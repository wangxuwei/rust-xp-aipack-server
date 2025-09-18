// region:    --- Modules

pub mod org_rpc;
pub mod pack_rpc;
pub mod user_rpc;

use rpc_router::{Router, RouterBuilder};

// endregion: --- Modules

pub fn all_rpc_router_builder() -> RouterBuilder {
	Router::builder()
		.extend(org_rpc::rpc_router_builder())
		.extend(pack_rpc::rpc_router_builder())
		.extend(user_rpc::rpc_router_builder())
}
