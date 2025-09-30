use lib_core::model::{
	org::{Org, OrgBmc, OrgFilter, OrgForCreate, OrgForUpdate},
	user::User,
	user_org::UserOrgBmc,
};
use lib_rpc_core::prelude::*;
use modql::filter::ListOptions;
use rpc_router::IntoParams;
use serde::Deserialize;

pub fn rpc_router_builder() -> RouterBuilder {
	router_builder!(
		create_org,
		get_org,
		list_orgs,
		update_org,
		delete_org,
		rename_org,
		list_and_count_orgs,
		get_users_by_org,
		search_users_for_org,
		add_users_to_org,
		remove_users_from_org,
	)
}

generate_common_rpc_fns!(
	Bmc: OrgBmc,
	Entity: Org,
	ForCreate: OrgForCreate,
	ForUpdate: OrgForUpdate,
	Filter: OrgFilter,
	Suffix: org
);

// region:    --- Params

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
impl IntoParams for ParamsOrg {}

#[derive(Deserialize)]
pub struct ParamsUserOrg {
	pub id: i64,
	pub list_options: Option<ListOptions>,
}
impl IntoParams for ParamsUserOrg {}
// endregion: --- Params

// region:    --- RPC Functions

pub async fn rename_org(
	ctx: Ctx,
	mm: ModelManager,
	params: ParamsOrg,
) -> Result<DataRpcResult<()>> {
	OrgBmc::rename_org(&ctx, &mm, params.id, &params.name).await?;
	Ok(().into())
}

pub async fn get_users_by_org(
	ctx: Ctx,
	mm: ModelManager,
	params: ParamsUserOrg,
) -> Result<DataRpcResult<(Vec<User>, i64)>> {
	let ParamsUserOrg { id, list_options } = params;
	let result = UserOrgBmc::get_users_by_org(&ctx, &mm, id, list_options).await?;
	Ok(result.into())
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

pub async fn list_and_count_orgs(
	ctx: Ctx,
	mm: ModelManager,
	params: ParamsList<OrgFilter>,
) -> Result<DataRpcResult<(Vec<Org>, i64)>> {
	let result =
		OrgBmc::list_and_count(&ctx, &mm, params.filters, params.list_options)
			.await?;
	Ok(result.into())
}
// endregion: --- RPC Functions
