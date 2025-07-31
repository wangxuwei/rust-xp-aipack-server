// region:    --- Modules

pub mod org_rpc;

use rpc_router::{Router, RouterBuilder};

// endregion: --- Modules

pub fn all_rpc_router_builder() -> RouterBuilder {
	Router::builder().extend(org_rpc::rpc_router_builder())
}
