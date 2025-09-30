use std::path::Path;

use lib_core::model::{
	pack::{Pack, PackBmc, PackFilter, PackForCreate, PackForUpdate},
	pack_version::{PackVersion, PackVersionBmc, PackVersionFilter},
};
use lib_rpc_core::prelude::*;

pub fn rpc_router_builder() -> RouterBuilder {
	router_builder!(
		create_pack,
		get_pack,
		update_pack,
		list_packs,
		delete_pack,
		list_and_count_packs,
		list_pack_versions,
		delete_pack_version
	)
}

generate_common_rpc_fns!(
	Bmc: PackBmc,
	Entity: Pack,
	ForCreate: PackForCreate,
	ForUpdate: PackForUpdate,
	Filter: PackFilter,
	Suffix: pack
);

pub async fn list_and_count_packs(
	ctx: Ctx,
	mm: ModelManager,
	params: ParamsList<PackFilter>,
) -> Result<DataRpcResult<(Vec<Pack>, i64)>> {
	let result =
		PackBmc::list_and_count(&ctx, &mm, params.filters, params.list_options)
			.await?;
	Ok(result.into())
}

pub async fn list_pack_versions(
	ctx: Ctx,
	mm: ModelManager,
	params: ParamsList<PackVersionFilter>,
) -> Result<DataRpcResult<(Vec<PackVersion>, i64)>> {
	let result = PackVersionBmc::list_and_count(
		&ctx,
		&mm,
		params.filters,
		params.list_options,
	)
	.await?;
	Ok(result.into())
}

pub async fn delete_pack_version(
	ctx: Ctx,
	mm: ModelManager,
	params: ParamsIded,
) -> Result<DataRpcResult<PackVersion>> {
	let ParamsIded { id } = params;
	let pack = PackVersionBmc::get(&ctx, &mm, id).await?;
	let file_exists = Path::new(&pack.file_path).exists();
	if file_exists {
		tokio::fs::remove_file(&pack.file_path).await?;
	}
	PackVersionBmc::delete(&ctx, &mm, id).await?;
	Ok(pack.into())
}
// endregion: --- RPC Functions
