use lib_core::model::{
	org::{Org, OrgBmc, OrgFilter, OrgForCreate, OrgForUpdate},
	user::User,
	user_org::UserOrgBmc,
};
use lib_rpc_core::prelude::*;
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
		get_users_by_org,
		save_users_to_org
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

// endregion: --- Params

// region:    --- RPC Functions
#[derive(Deserialize)]
pub struct ParamsOrg {
	pub id: i64,
	pub name: String,
}
impl IntoParams for ParamsOrg {}

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
	params: ParamsIded,
) -> Result<DataRpcResult<Vec<User>>> {
	let ParamsIded { id } = params;
	let entities = UserOrgBmc::get_users_by_org(&ctx, &mm, id).await?;
	Ok(entities.into())
}

pub async fn save_users_to_org(
	ctx: Ctx,
	mm: ModelManager,
	params: ParamsForOrgUsers,
) -> Result<DataRpcResult<Vec<i64>>> {
	let ids =
		UserOrgBmc::save_users_to_org(&ctx, &mm, params.org_id, &params.user_ids)
			.await?;
	Ok(ids.into())
}
// endregion: --- RPC Functions
