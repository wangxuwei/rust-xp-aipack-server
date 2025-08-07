## rpc api Best Practices

These are the best practices for rpc apis

### rpc common crud apis

````rs

use lib_core::model::org::{Org, OrgBmc, OrgFilter, OrgForCreate, OrgForUpdate};
use lib_rpc_core::prelude::*;

pub fn rpc_router_builder() -> RouterBuilder {
	router_builder!(
		// Same as RpcRouter::new().add...
		create_org, get_org, list_orgs, update_org, delete_org,
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


````
let's say the Entity is "Org", it is template above, then similar with others
- generate_common_rpc_fns macro provides apis like: create_org, get_org, list_orgs, update_org, delete_org, it is similar for other entity
- we can use this template to create other crud rpc api for other entities

### an single rpc api

````rs

pub async fn create_org(
		ctx: Ctx,
		mm: ModelManager,
		params: ParamsForCreate<OrgForCreate>,
) -> Result<DataRpcResult<Org>> {
		let ParamsForCreate { data } = params;
		let id = OrgBmc::create(&ctx, &mm, data).await?;
		let entity = OrgBmc::get(&ctx, &mm, id).await?;
		Ok(entity.into())
}

pub async fn get_org(
		ctx: Ctx,
		mm: ModelManager,
		params: ParamsIded,
) -> Result<DataRpcResult<Org>> {
		let entity = OrgBmc::get(&ctx, &mm, params.id).await?;
		Ok(entity.into())
}

// Note: for now just add `s` after the suffix.
pub async fn list_orgs(
		ctx: Ctx,
		mm: ModelManager,
		params: ParamsList<OrgFilter>,
) -> Result<DataRpcResult<Vec<Org>>> {
		let entities = OrgBmc::list(&ctx, &mm, params.filters, params.list_options).await?;
		Ok(entities.into())
}

pub async fn update_org(
		ctx: Ctx,
		mm: ModelManager,
		params: ParamsForUpdate<OrgForUpdate>,
) -> Result<DataRpcResult<Org>> {
		let ParamsForUpdate { id, data } = params;
		OrgBmc::update(&ctx, &mm, id, data).await?;
		let entity = OrgBmc::get(&ctx, &mm, id).await?;
		Ok(entity.into())
}

pub async fn delete_org(
		ctx: Ctx,
		mm: ModelManager,
		params: ParamsIded,
) -> Result<DataRpcResult<Org>> {
		let ParamsIded { id } = params;
		let entity = OrgBmc::get(&ctx, &mm, id).await?;
		OrgBmc::delete(&ctx, &mm, id).await?;
		Ok(entity.into())
}


````
let's say the Entity is "Org", it is template above, then similar with others
- when we need an api for "create" records, just use create_org as template
- when we need an api for "update" records, just use update_org as template
- when we need an api for "delete" records, just use delete_org as template
- when we need an api for "list" records, just use list_orgs as template
- when we need an api for "get" an record, just use get_org as template
- for the params custom added, need to implement like: 
	```
	#[derive(Debug, Deserialize)]
	pub struct ParamsForUserOrg {
		pub user_id: i64,
		pub org_id: i64,
	}
	impl IntoParams for ParamsForUserOrg {}

	impl IntoParams for ParamsForUserOrg {}
	```