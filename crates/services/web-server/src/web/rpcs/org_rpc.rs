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

// /// Returns org_msg
// pub async fn add_org_msg(
// 	ctx: Ctx,
// 	mm: ModelManager,
// 	params: ParamsForCreate<OrgMsgForCreate>,
// ) -> Result<DataRpcResult<OrgMsg>> {
// 	let ParamsForCreate { data: msg_c } = params;

// 	let msg_id = OrgBmc::add_msg(&ctx, &mm, msg_c).await?;
// 	let msg = OrgBmc::get_msg(&ctx, &mm, msg_id).await?;

// 	Ok(msg.into())
// }

// /// Returns org_msg
// #[allow(unused)]
// pub async fn get_org_msg(
// 	ctx: Ctx,
// 	mm: ModelManager,
// 	params: ParamsIded,
// ) -> Result<DataRpcResult<OrgMsg>> {
// 	let ParamsIded { id: msg_id } = params;

// 	let msg = OrgBmc::get_msg(&ctx, &mm, msg_id).await?;

// 	Ok(msg.into())
// }
