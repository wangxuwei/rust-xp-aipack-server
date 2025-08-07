use lib_core::model::{
	user::{User, UserBmc, UserFilter, UserForCreate, UserForUpdate},
	user_org::{UserOrg, UserOrgBmc, UserOrgForCreate},
};
use lib_rpc_core::prelude::*;
use rpc_router::IntoParams;
use serde::Deserialize;

pub fn rpc_router_builder() -> RouterBuilder {
	router_builder!(
		create_user,
		get_user,
		list_users,
		update_user,
		delete_user,
		add_user_to_org,
		delete_user_from_org
	)
}

// region:    --- Params

#[derive(Debug, Deserialize)]
pub struct ParamsForUserOrg {
	pub user_id: i64,
	pub org_id: i64,
}
impl IntoParams for ParamsForUserOrg {}

// endregion: --- Params

// region:    --- RPC Functions

pub async fn create_user(
	ctx: Ctx,
	mm: ModelManager,
	params: ParamsForCreate<UserForCreate>,
) -> Result<DataRpcResult<User>> {
	let ParamsForCreate { data } = params;
	let id = UserBmc::create(&ctx, &mm, data).await?;
	let entity = UserBmc::get::<User>(&ctx, &mm, id).await?;
	Ok(entity.into())
}

pub async fn get_user(
	ctx: Ctx,
	mm: ModelManager,
	params: ParamsIded,
) -> Result<DataRpcResult<User>> {
	let entity = UserBmc::get::<User>(&ctx, &mm, params.id).await?;
	Ok(entity.into())
}

// Note: for now just add `s` after the suffix.
pub async fn list_users(
	ctx: Ctx,
	mm: ModelManager,
	params: ParamsList<UserFilter>,
) -> Result<DataRpcResult<Vec<User>>> {
	let entities =
		UserBmc::list(&ctx, &mm, params.filters, params.list_options).await?;
	println!("users {entities:?}");
	Ok(entities.into())
}

pub async fn update_user(
	ctx: Ctx,
	mm: ModelManager,
	params: ParamsForUpdate<UserForUpdate>,
) -> Result<DataRpcResult<User>> {
	let ParamsForUpdate { id, data } = params;
	UserBmc::update(&ctx, &mm, id, data).await?;
	let entity = UserBmc::get::<User>(&ctx, &mm, id).await?;
	Ok(entity.into())
}

pub async fn delete_user(
	ctx: Ctx,
	mm: ModelManager,
	params: ParamsIded,
) -> Result<DataRpcResult<User>> {
	let ParamsIded { id } = params;
	let entity = UserBmc::get::<User>(&ctx, &mm, id).await?;
	UserBmc::delete(&ctx, &mm, id).await?;
	Ok(entity.into())
}

pub async fn add_user_to_org(
	ctx: Ctx,
	mm: ModelManager,
	params: ParamsForUserOrg,
) -> Result<DataRpcResult<UserOrg>> {
	let ParamsForUserOrg { user_id, org_id } = params;

	let user_org_c = UserOrgForCreate { user_id, org_id };
	let id = UserOrgBmc::create(&ctx, &mm, user_org_c).await?;
	let entity = UserOrgBmc::get(&ctx, &mm, id).await?;

	Ok(entity.into())
}

pub async fn delete_user_from_org(
	ctx: Ctx,
	mm: ModelManager,
	params: ParamsForUserOrg,
) -> Result<DataRpcResult<UserOrg>> {
	let ParamsForUserOrg { user_id, org_id } = params;
	let entity = UserOrgBmc::get_by_user_org(&ctx, &mm, user_id, org_id).await?;
	UserOrgBmc::delete(&ctx, &mm, entity.id).await?;
	Ok(entity.into())
}
// endregion: --- RPC Functions
