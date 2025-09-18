use lib_core::model::user::{
	User, UserBmc, UserFilter, UserForCreate, UserForUpdate,
};
use lib_rpc_core::prelude::*;

pub fn rpc_router_builder() -> RouterBuilder {
	router_builder!(create_user, get_user, list_users, update_user, delete_user,)
}

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
// endregion: --- RPC Functions
