use crate::model::{
	acs::{get_org_role_accesses, OrgAccess},
	user_org::{ORoleName, UserOrg, UserOrgIden},
	Error, ModelManager, Result,
};
use modql::field::HasSeaFields;
use sea_query::{Expr, OnConflict, PostgresQueryBuilder, Query};
use sea_query_binder::SqlxBinder;

pub async fn save_org_role(
	mm: &ModelManager,
	user_id: i64,
	org_id: i64,
	role: ORoleName,
) -> Result<()> {
	let mut query = Query::insert();
	query
		.into_table(UserOrgIden::Table)
		.columns([UserOrgIden::UserId, UserOrgIden::OrgId, UserOrgIden::Role])
		.values([user_id.into(), org_id.into(), role.into()])
		.map_err(|_| Error::OrgAddRole)?
		.on_conflict(
			OnConflict::new()
				.expr(Expr::col(UserOrgIden::Id))
				.value(UserOrgIden::Role, Expr::value(role))
				.to_owned(),
		);

	let (sql, values) = query.build_sqlx(PostgresQueryBuilder);
	let sqlx_query = sqlx::query_with(&sql, values);
	let _ = mm.dbx().execute(sqlx_query).await?;

	Ok(())
}

pub async fn get_org_access(
	mm: &ModelManager,
	user_id: i64,
	org_id: i64,
) -> Result<Vec<OrgAccess>> {
	let mut query = Query::select();
	query
		.from(UserOrgIden::Table)
		.columns(UserOrg::sea_column_refs());
	query
		.and_where(Expr::col(UserOrgIden::UserId).eq(user_id))
		.and_where(Expr::col(UserOrgIden::OrgId).eq(org_id));

	// -- Execute the query
	let (sql, values) = query.build_sqlx(PostgresQueryBuilder);
	let sqlx_query = sqlx::query_as_with::<_, UserOrg, _>(&sql, values);
	let user_org = mm.dbx().fetch_one(sqlx_query).await?;

	let role = user_org.role;

	let org_accesses = get_org_role_accesses(&role);

	Ok(org_accesses.into_iter().collect())
}
