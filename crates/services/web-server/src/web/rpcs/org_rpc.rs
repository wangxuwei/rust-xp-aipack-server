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
