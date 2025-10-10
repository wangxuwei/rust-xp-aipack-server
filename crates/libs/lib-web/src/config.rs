use lib_utils::envs::{get_env, get_env_parse};
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
	pub WEB_FOLDER: String,
	pub HOST: String,
	pub EMAIL_HOST: String,
	pub EMAIL_PORT: u16,
	pub EMAIL_FROM: String,
	pub PRLINK_DURATION: i64,
}

impl RpcConfig {
	fn load_from_env() -> lib_utils::envs::Result<RpcConfig> {
		Ok(RpcConfig {
			PACKS_UPLOAD_DIR: get_env("PACKS_UPLOAD_DIR")?,
			// -- Web
			HOST: get_env("SERVICE_HOST")?,
			EMAIL_HOST: get_env("SERVICE_EMAIL_HOST")?,
			EMAIL_PORT: get_env_parse::<u16>("SERVICE_EMAIL_PORT")?,
			EMAIL_FROM: get_env("SERVICE_EMAIL_FROM")?,
			WEB_FOLDER: get_env("SERVICE_WEB_FOLDER")?,
			PRLINK_DURATION: get_env_parse::<i64>("SERVICE_PRLINK_DURATION")?,
		})
	}
}
