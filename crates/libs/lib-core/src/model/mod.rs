//! Model Layer
//!
//! Design:
//!
//! - The Model layer normalizes the application's data type
//!   structures and access.
//! - All application code data access must go through the Model layer.
//! - The `ModelManager` holds the internal states/resources
//!   needed by ModelControllers to access data.
//!   (e.g., db_pool, S3 client, redis client).
//! - Model Controllers (e.g., `ConvBmc`, `AgentBmc`) implement
//!   CRUD and other data access methods on a given "entity"
//!   (e.g., `Conv`, `Agent`).
//!   (`Bmc` is short for Backend Model Controller).
//! - In frameworks like Axum, Tauri, `ModelManager` are typically used as App State.
//! - ModelManager are designed to be passed as an argument
//!   to all Model Controllers functions.
//!

// region:    --- Modules

pub mod acs;
mod base;
mod error;
mod store;

pub mod modql_utils;
pub mod org;
pub mod pack;
pub mod pack_version;
pub mod prlink;
pub mod user;
pub mod user_org;

pub use self::error::{Error, Result};

use crate::model::store::dbx::Dbx;
use crate::model::store::new_db_pool;
use modql::filter::IntoSeaError;
use std::str::FromStr;

// endregion: --- Modules

// region:    --- ModelManager

#[cfg_attr(feature = "with-rpc", derive(rpc_router::RpcResource))]
#[derive(Clone)]
pub struct ModelManager {
	dbx: Dbx,
}

impl ModelManager {
	/// Constructor
	pub async fn new() -> Result<Self> {
		let db_pool = new_db_pool()
			.await
			.map_err(|ex| Error::CantCreateModelManagerProvider(ex.to_string()))?;
		let dbx = Dbx::new(db_pool, false)?;
		Ok(ModelManager { dbx })
	}

	pub fn new_with_txn(&self) -> Result<ModelManager> {
		let dbx = Dbx::new(self.dbx.db().clone(), true)?;
		Ok(ModelManager { dbx })
	}

	pub fn dbx(&self) -> &Dbx {
		&self.dbx
	}
}

// endregion: --- ModelManager

pub fn uuid_to_sea_value(
	json_value: serde_json::Value,
) -> modql::filter::SeaResult<sea_query::Value> {
	let uuid_str = json_value
		.as_str()
		.ok_or(IntoSeaError::Custom("sea value convert".to_owned()))?;
	let value = uuid::Uuid::from_str(uuid_str)
		.map_err(|_| IntoSeaError::Custom("sea value convert to uuid".to_owned()))?;
	Ok(value.into())
}
