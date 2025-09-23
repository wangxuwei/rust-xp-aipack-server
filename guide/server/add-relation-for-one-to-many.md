## One to Many relationship for server

These are the best practice for one to many relation maintain on backend side
let's say the Entity is "UserOrg", so it is relationshitp for "Org" and "UserOrg", which is one to many, and it is base on "Org", so it would insert and delete users for org

### the implement save and query relations in model/BMC

````rs

	pub async fn get_users_by_org(
		_ctx: &Ctx,
		mm: &ModelManager,
		org_id: i64,
	) -> Result<Vec<User>> {
		// -- Build the query
		let mut query = Query::select();

		query
			.from(Self::table_ref())
			.columns(User::sea_column_refs_with_rel(UserIden::User))
			.inner_join(
				UserIden::User,
				Expr::col((UserOrgIden::Table, UserOrgIden::UserId))
					.eq(Expr::col((UserIden::User, UserIden::Id))),
			)
			.inner_join(
				OrgIden::Table,
				Expr::col((UserOrgIden::Table, UserOrgIden::OrgId))
					.eq(Expr::col((OrgIden::Table, OrgIden::Id))),
			);

		// condition from filter
		let condition =
			Condition::all().add(Expr::col(UserOrgIden::OrgId).eq(org_id));
		query.cond_where(condition.clone());

		// -- Execute the query
		let (sql, values) = query.build_sqlx(PostgresQueryBuilder);
		let sqlx_query = sqlx::query_as_with::<_, User, _>(&sql, values);
		let entities = mm.dbx().fetch_all(sqlx_query).await?;

		Ok(entities)
	}

	pub async fn search_users_for_org(
		_ctx: &Ctx,
		mm: &ModelManager,
		org_id: i64,
		username: &str,
	) -> Result<Vec<User>> {
		// -- Build the query
		let mut query = Query::select();

		let sub_query = Query::select()
			.column(UserOrgIden::UserId)
			.from(UserOrgIden::Table)
			.and_where(Expr::col(UserOrgIden::OrgId).eq(org_id))
			.to_owned();

		let username_filter = format!("%{username}%");

		query
			.from(Self::table_ref())
			.columns(User::sea_column_refs_with_rel(UserIden::User))
			.and_where(Expr::col(UserIden::Id).not_in_subquery(sub_query))
			.and_where(Expr::col(UserIden::Username).ilike(username_filter));

		// -- Execute the query
		let (sql, values) = query.build_sqlx(PostgresQueryBuilder);
		let sqlx_query = sqlx::query_as_with::<_, User, _>(&sql, values);
		let entities = mm.dbx().fetch_all(sqlx_query).await?;

		Ok(entities)
	}

	pub async fn add_users_to_org(
		ctx: &Ctx,
		mm: &ModelManager,
		org_id: i64,
		user_ids: &[i64],
	) -> Result<Vec<i64>> {
		// region: --- list UserOrg
		let user_orgs = Self::list(
			ctx,
			mm,
			Some(vec![UserOrgFilter {
				user_id: None,
				org_id: Some(OpValInt64::Eq(org_id).into()),
			}]),
			None,
		)
		.await?;
		// endregion: --- /list UserOrg

		let mm = mm.new_with_txn()?;
		mm.dbx().begin_txn().await?;
		// region: --- add UserOrg
		// -- for add
		let existing_set: HashSet<i64> =
			user_orgs.iter().map(|uo| uo.user_id).collect();

		let to_add_rel = user_ids
			.iter()
			.filter(|user_id| !existing_set.contains(user_id))
			.copied()
			.collect::<Vec<_>>();

		if !to_add_rel.is_empty() {
			let mut query = Query::insert();
			query.into_table(Self::table_ref());
			let to_adds = to_add_rel
				.iter()
				.map(|f| UserOrgForCreate {
					user_id: *f,
					org_id,
					role: ORoleName::Owner,
				})
				.collect::<Vec<_>>();
			Self::create_many(ctx, &mm, to_adds).await?;
		}

		// Commit the transaction
		mm.dbx().commit_txn().await?;

		// endregion: --- /add UserOrg
		Ok(user_ids.to_vec())
	}

	pub async fn remove_users_from_org(
		ctx: &Ctx,
		mm: &ModelManager,
		org_id: i64,
		user_ids: &[i64],
	) -> Result<Vec<i64>> {
		// region: --- list UserOrg
		let user_orgs = Self::list(
			ctx,
			mm,
			Some(vec![UserOrgFilter {
				user_id: None,
				org_id: Some(OpValInt64::Eq(org_id).into()),
			}]),
			None,
		)
		.await?;
		// endregion: --- /list UserOrg

		let mm = mm.new_with_txn()?;
		mm.dbx().begin_txn().await?;
		// region: --- delete UserOrg

		// -- for delete
		let to_del_rel = user_orgs
			.iter()
			.filter(|user_org| user_ids.contains(&user_org.user_id))
			.map(|f| f.id)
			.collect::<Vec<i64>>();

		if !to_del_rel.is_empty() {
			Self::delete_many(ctx, &mm, to_del_rel).await?;
		}

		// Commit the transaction
		mm.dbx().commit_txn().await?;

		// endregion: --- /delete UserOrg
		Ok(user_ids.to_vec())
	}


````
- the functions above is for query and save relationship, it will append into ```impl UserOrgBmc``` in the file model/user_org.rs, if there is no ```impl UserOrgBmc``` , add that and then put the codes in ```impl UserOrgBmc```
- do not make the full codes to replace, just put the codes which need into model/user_org.rs

### provide rpc API for the BMC functions

````rs


pub fn rpc_router_builder() -> RouterBuilder {
	router_builder!(
		...
		get_users_by_org,
		search_users_for_org,
		add_users_to_org,
		remove_users_from_org,
	)
}


// region:    --- Params
...
#[derive(Debug, Deserialize)]
pub struct ParamsForOrgUsers {
	pub user_ids: Vec<i64>,
	pub org_id: i64,
}
impl IntoParams for ParamsForOrgUsers {}

#[derive(Deserialize)]
pub struct ParamsOrg {
	pub id: i64,
	pub name: String,
}
// endregion: --- Params

// region:    --- RPC Functions
...

pub async fn get_users_by_org(
	ctx: Ctx,
	mm: ModelManager,
	params: ParamsIded,
) -> Result<DataRpcResult<Vec<User>>> {
	let ParamsIded { id } = params;
	let entities = UserOrgBmc::get_users_by_org(&ctx, &mm, id).await?;
	Ok(entities.into())
}

/// Params structure for any RPC Update call.
#[derive(Deserialize)]
pub struct ParamsSearchOrgUser {
	pub id: i64,
	pub username: String,
}
impl IntoParams for ParamsSearchOrgUser {}
pub async fn search_users_for_org(
	ctx: Ctx,
	mm: ModelManager,
	params: ParamsSearchOrgUser,
) -> Result<DataRpcResult<Vec<User>>> {
	let ParamsSearchOrgUser { id, username } = params;
	let entities =
		UserOrgBmc::search_users_for_org(&ctx, &mm, id, username.as_str()).await?;
	Ok(entities.into())
}

pub async fn add_users_to_org(
	ctx: Ctx,
	mm: ModelManager,
	params: ParamsForOrgUsers,
) -> Result<DataRpcResult<Vec<i64>>> {
	let ids =
		UserOrgBmc::add_users_to_org(&ctx, &mm, params.org_id, &params.user_ids)
			.await?;
	Ok(ids.into())
}

pub async fn remove_users_from_org(
	ctx: Ctx,
	mm: ModelManager,
	params: ParamsForOrgUsers,
) -> Result<DataRpcResult<Vec<i64>>> {
	let ids = UserOrgBmc::remove_users_from_org(
		&ctx,
		&mm,
		params.org_id,
		&params.user_ids,
	)
	.await?;
	Ok(ids.into())
}
// endregion: --- RPC Functions

````

- provide the above functions "get_users_by_org", "search_users_for_org", "add_users_to_org", "remove_users_from_org", which are for query and save relationship rpc api, put the codes in rpcs/org_rpc.rs
- for the comments region "Params" and "RPC Functions", if there are, then insert both functions in the corresponding region
- then register the functions name in the router_builder! in function "rpc_router_builder"
- do not make the full codes to replace, just put the codes which need into rpcs/org_rpc.rs
