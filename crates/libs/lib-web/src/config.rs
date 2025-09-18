use lib_utils::envs::get_env;
use std::sync::OnceLock;

pub fn rpc_config() -> &'static RpcConfig {
	static INSTANCE: OnceLock<RpcConfig> = OnceLock::new();

	INSTANCE.get_or_init(|| {
		RpcConfig::load_from_env().unwrap_or_else(|ex| {
			panic!("FATAL - WHILE LOADING CONF - Cause: {ex:?}")
		})
	})
}

#[allow(non_snake_case)]
pub struct RpcConfig {
	pub PACKS_UPLOAD_DIR: String,
}

impl RpcConfig {
	fn load_from_env() -> lib_utils::envs::Result<RpcConfig> {
		Ok(RpcConfig {
			PACKS_UPLOAD_DIR: get_env("PACKS_UPLOAD_DIR")?,
		})
	}
}
