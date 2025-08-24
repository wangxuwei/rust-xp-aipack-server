use crate::{
	ctx::Ctx,
	model::{
		base::{self, DbBmc},
		org::OrgIden,
		user::{User, UserIden},
		Error, ModelManager, Result,
	},
};
use lib_utils::time::Rfc3339;
use modql::{
	field::{Fields, HasSeaFields},
	filter::{FilterNodes, ListOptions, OpValInt64, OpValsInt64},
};
use sea_query::{enum_def, Condition, Expr, PostgresQueryBuilder, Query};
use sea_query_binder::SqlxBinder;
use serde::{Deserialize, Serialize};
use serde_with::serde_as;
use sqlx::FromRow;
use std::collections::HashSet;
use time::OffsetDateTime;
use ts_rs::TS;

// region:    --- Types

#[derive(
	Clone,
	Debug,
	sqlx::Type,
	derive_more::Display,
	Deserialize,
	Serialize,
	TS,
	PartialEq,
	std::cmp::Eq,
	Hash,
	Copy,
)]
#[ts(export, export_to = "../../../frontends/web/src/bindings/")]
#[sqlx(type_name = "orole_name")]
pub enum ORoleName {
	#[sqlx(rename = "or_owner")]
	Owner,
	#[sqlx(rename = "or_admin")]
	Admin,
	#[sqlx(rename = "or_editor")]
	Editor,
	#[sqlx(rename = "or_viewer")]
	Viewer,
}
impl From<ORoleName> for sea_query::Value {
	fn from(val: ORoleName) -> Self {
		let val = format!("or_{}", val.to_string().to_ascii_lowercase());
		val.to_string().into()
	}
}

#[serde_as]
#[derive(Debug, Clone, Fields, FromRow, Serialize, TS)]
#[ts(export, export_to = "../../../frontends/web/src/bindings/")]
#[enum_def]
pub struct UserOrg {
	pub id: i64,
	pub role: ORoleName,

	// -- FK
	pub org_id: i64,
	pub user_id: i64,

	// -- Timestamps
	// creator user_id and time
	pub cid: i64,
	#[serde_as(as = "Rfc3339")]
	#[ts(type = "string")]
	pub ctime: OffsetDateTime,
	// last modifier user_id and time
	pub mid: i64,
	#[serde_as(as = "Rfc3339")]
	#[ts(type = "string")]
	pub mtime: OffsetDateTime,
}

#[derive(Fields, Serialize, Deserialize)]
pub struct UserOrgForCreate {
	pub org_id: i64,
	pub user_id: i64,
	#[field(cast_as = "orole_name")]
	pub role: ORoleName,
}

#[derive(FilterNodes, Deserialize, Default, Debug)]
pub struct UserOrgFilter {
	pub user_id: Option<OpValsInt64>,
	pub org_id: Option<OpValsInt64>,
}

// endregion: --- Types

// region:    --- UserOrg

pub struct UserOrgBmc;

impl DbBmc for UserOrgBmc {
	const TABLE: &'static str = "user_org";
}

impl UserOrgBmc {
	pub async fn create(
		ctx: &Ctx,
		mm: &ModelManager,
		entity_c: UserOrgForCreate,
	) -> Result<i64> {
		base::create::<Self, _>(ctx, mm, entity_c).await
	}

	pub async fn create_many(
		ctx: &Ctx,
		mm: &ModelManager,
		entity_c: Vec<UserOrgForCreate>,
	) -> Result<Vec<i64>> {
		base::create_many::<Self, _>(ctx, mm, entity_c).await
	}

	pub async fn get(ctx: &Ctx, mm: &ModelManager, id: i64) -> Result<UserOrg> {
		base::get::<Self, _>(ctx, mm, id).await
	}

	pub async fn get_by_user_org(
		ctx: &Ctx,
		mm: &ModelManager,
		user_id: i64,
		org_id: i64,
	) -> Result<UserOrg> {
		base::first::<Self, _, _>(
			ctx,
			mm,
			Some(vec![UserOrgFilter {
				user_id: Some(OpValInt64::Eq(user_id).into()),
				org_id: Some(OpValInt64::Eq(org_id).into()),
			}]),
			None,
		)
		.await?
		.ok_or(Error::UserOrgNotFound { user_id, org_id })
	}

	pub async fn delete(ctx: &Ctx, mm: &ModelManager, id: i64) -> Result<()> {
		base::delete::<Self>(ctx, mm, id).await
	}

	pub async fn delete_many(
		ctx: &Ctx,
		mm: &ModelManager,
		ids: Vec<i64>,
	) -> Result<u64> {
		base::delete_many::<Self>(ctx, mm, ids).await
	}

	pub async fn list(
		ctx: &Ctx,
		mm: &ModelManager,
		filter: Option<Vec<UserOrgFilter>>,
		list_options: Option<ListOptions>,
	) -> Result<Vec<UserOrg>> {
		base::list::<Self, _, _>(ctx, mm, filter, list_options).await
	}

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

	pub async fn save_users_to_org(
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
		// region: --- save UserOrg
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

		// -- for delete
		let to_del_rel = user_orgs
			.iter()
			.filter(|user_org| !user_ids.contains(&user_org.user_id))
			.map(|f| f.id)
			.collect::<Vec<i64>>();

		if !to_del_rel.is_empty() {
			Self::delete_many(ctx, &mm, to_del_rel).await?;
		}

		// Commit the transaction
		mm.dbx().commit_txn().await?;

		// endregion: --- /save UserOrg
		Ok(user_ids.to_vec())
	}
}

// endregion: --- UserOrg
