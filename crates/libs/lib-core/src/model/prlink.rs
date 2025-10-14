use crate::ctx::Ctx;
use crate::generate_common_bmc_fns;
use crate::model::acs::prelude::*;
use crate::model::base::{self, DbBmc};
use crate::model::uuid_to_sea_value;
use crate::model::ModelManager;
use crate::model::Result;
use lib_utils::time::Rfc3339;
use modql::field::Fields;
use modql::filter::{FilterNodes, ListOptions, OpValValue, OpValsInt64};
use modql::filter::{OpValInt64, OpValsValue};

use crate::model::acs::{Access, Ga};
use lib_acs_macros::privileges;
use sea_query::enum_def;
use serde::{Deserialize, Serialize};
use serde_with::serde_as;
use sqlx::types::time::OffsetDateTime;
use sqlx::FromRow;
use ts_rs::TS;
use uuid::Uuid;

// region:    --- Prlink Types

#[serde_as]
#[derive(Debug, Clone, Fields, FromRow, Serialize, TS, sqlx::Type)]
#[ts(export, export_to = "../../../frontends/web/src/bindings/")]
#[enum_def]
pub struct Prlink {
	#[ts(type = "number")]
	pub id: i64,
	pub code: Uuid,
	#[ts(type = "number")]
	pub user_id: i64,

	// -- Timestamps
	#[ts(type = "number")]
	pub cid: i64,
	#[serde_as(as = "Rfc3339")]
	#[ts(type = "string")]
	pub ctime: OffsetDateTime,
	#[ts(type = "number")]
	pub mid: i64,
	#[serde_as(as = "Rfc3339")]
	#[ts(type = "string")]
	pub mtime: OffsetDateTime,
}

#[derive(Fields, Serialize, Deserialize)]
pub struct PrlinkForCreate {
	pub code: Uuid,
	pub user_id: i64,
}

#[derive(Fields, Serialize, Deserialize, Default)]
pub struct PrlinkForUpdate {
	pub code: Option<Uuid>,
	pub user_id: Option<i64>,
}

#[derive(FilterNodes, Deserialize, Default, Debug, Clone)]
pub struct PrlinkFilter {
	#[modql(to_sea_value_fn = "uuid_to_sea_value")]
	pub code: Option<OpValsValue>,
	pub user_id: Option<OpValsInt64>,
}

// endregion: --- Prlink Types

// region:    --- PrlinkBmc

pub struct PrlinkBmc;

impl DbBmc for PrlinkBmc {
	const TABLE: &'static str = "prlink";
}

generate_common_bmc_fns!(
	Bmc: PrlinkBmc,
	Entity: Prlink,
	ForCreate: PrlinkForCreate, CreatePrivileges: [Access::Global(Ga::PwdReset)],
	ForUpdate: PrlinkForUpdate, UpdatePrivileges: [Access::Global(Ga::PwdReset)],
	Filter: PrlinkFilter, ListPrivileges: [Access::Global(Ga::PwdReset)],
	GetPrivileges: [Access::Global(Ga::PwdReset)],
	DeletePrivileges: [Access::Global(Ga::PwdReset)]
);

impl PrlinkBmc {
	#[privileges(Access::Global(Ga::PwdReset))]
	pub async fn get_by_code(
		ctx: &Ctx,
		mm: &ModelManager,
		code: Uuid,
	) -> Result<Option<Prlink>> {
		let code_json = serde_json::Value::String(code.to_string());
		base::first::<Self, _, _>(
			ctx,
			mm,
			Some(vec![PrlinkFilter {
				code: Some(OpValValue::Eq(code_json).into()),
				..Default::default()
			}]),
			None,
		)
		.await
	}

	#[privileges(Access::Global(Ga::PwdReset))]
	pub async fn get_by_user_id(
		ctx: &Ctx,
		mm: &ModelManager,
		user_id: i64,
	) -> Result<Vec<Prlink>> {
		base::list::<Self, _, _>(
			ctx,
			mm,
			Some(vec![PrlinkFilter {
				user_id: Some(OpValInt64::Eq(user_id).into()),
				..Default::default()
			}]),
			None,
		)
		.await
	}
}

// endregion: --- PrlinkBmc

// region:    --- Tests

#[cfg(test)]
mod tests {
	type Error = Box<dyn std::error::Error>;
	type Result<T> = core::result::Result<T, Error>;

	use super::*;
	use crate::_dev_utils::{self, clean_users, seed_user};
	use serial_test::serial;

	#[serial]
	#[tokio::test]
	async fn test_create_ok() -> Result<()> {
		// -- Setup & Fixtures
		let mm = _dev_utils::init_test().await;
		let ctx = Ctx::root_ctx(None);
		let fx_user_id = seed_user(&ctx, &mm, "test_user_create_01").await?;

		// -- Exec
		let prlink_id = PrlinkBmc::create(
			&ctx,
			&mm,
			PrlinkForCreate {
				code: Uuid::now_v7(),
				user_id: fx_user_id,
			},
		)
		.await?;

		// -- Check
		let prlink: Prlink = PrlinkBmc::get(&ctx, &mm, prlink_id).await?;
		assert_eq!(prlink.user_id, fx_user_id);
		assert!(prlink.code != Uuid::nil());

		// -- Clean
		PrlinkBmc::delete(&ctx, &mm, prlink_id).await?;
		clean_users(&ctx, &mm, "test_user_create").await?;

		Ok(())
	}

	#[serial]
	#[tokio::test]
	async fn test_get_by_code() -> Result<()> {
		// -- Setup & Fixtures
		let mm = _dev_utils::init_test().await;
		let ctx = Ctx::root_ctx(None);
		let fx_user_id = seed_user(&ctx, &mm, "test_user_create_02").await?;
		let fx_code = Uuid::now_v7();

		let prlink_id = PrlinkBmc::create(
			&ctx,
			&mm,
			PrlinkForCreate {
				code: fx_code,
				user_id: fx_user_id,
			},
		)
		.await?;

		// -- Exec
		let prlink = PrlinkBmc::get_by_code(&ctx, &mm, fx_code).await?;

		// -- Check
		assert!(prlink.is_some());
		assert_eq!(prlink.unwrap().id, prlink_id);

		// -- Clean
		PrlinkBmc::delete(&ctx, &mm, prlink_id).await?;
		clean_users(&ctx, &mm, "test_user_create").await?;

		Ok(())
	}

	#[serial]
	#[tokio::test]
	async fn test_get_by_user_id() -> Result<()> {
		// -- Setup & Fixtures
		let mm = _dev_utils::init_test().await;
		let ctx = Ctx::root_ctx(None);
		let fx_user_id = seed_user(&ctx, &mm, "test_user_create_03").await?;

		let prlink_id1 = PrlinkBmc::create(
			&ctx,
			&mm,
			PrlinkForCreate {
				code: Uuid::now_v7(),
				user_id: fx_user_id,
			},
		)
		.await?;

		let prlink_id2 = PrlinkBmc::create(
			&ctx,
			&mm,
			PrlinkForCreate {
				code: Uuid::now_v7(),
				user_id: fx_user_id,
			},
		)
		.await?;

		// -- Exec
		let prlinks = PrlinkBmc::get_by_user_id(&ctx, &mm, fx_user_id).await?;

		// -- Check
		assert_eq!(prlinks.len(), 2);
		let ids: Vec<i64> = prlinks.iter().map(|p| p.id).collect();
		assert!(ids.contains(&prlink_id1));
		assert!(ids.contains(&prlink_id2));

		// -- Clean
		PrlinkBmc::delete(&ctx, &mm, prlink_id1).await?;
		PrlinkBmc::delete(&ctx, &mm, prlink_id2).await?;
		clean_users(&ctx, &mm, "test_user_create").await?;

		Ok(())
	}
}

// endregion: --- Tests
