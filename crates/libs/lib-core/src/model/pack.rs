use crate::ctx::Ctx;
use crate::generate_common_bmc_fns;
use crate::model::acs::prelude::*;
use crate::model::acs::Ga;
use crate::model::base::{self, DbBmc};
use crate::model::modql_utils::time_to_sea_value;
use crate::model::ModelManager;
use crate::model::Result;
use lib_utils::time::Rfc3339;
use modql::field::Fields;
use modql::filter::OpValString;
use modql::filter::{
	FilterNodes, ListOptions, OpValsInt64, OpValsString, OpValsValue,
};
use sea_query::enum_def;
use serde::{Deserialize, Serialize};
use serde_with::serde_as;
use sqlx::types::time::OffsetDateTime;
use sqlx::FromRow;
use ts_rs::TS;

// region:    --- Pack Types

#[serde_as]
#[derive(Debug, Clone, Fields, FromRow, Serialize, TS)]
#[ts(export, export_to = "../../../frontends/web/src/bindings/")]
#[enum_def]
pub struct Pack {
	#[ts(type = "number")]
	pub id: i64,
	pub name: String,
	#[ts(type = "number")]
	pub org_id: i64,

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
pub struct PackForCreate {
	pub org_id: i64,
	pub name: String,
}

#[derive(Fields, Serialize, Deserialize, Default)]
pub struct PackForUpdate {
	pub name: Option<String>,
}

#[derive(FilterNodes, Deserialize, Default, Debug, Clone)]
pub struct PackFilter {
	pub id: Option<OpValsInt64>,
	pub name: Option<OpValsString>,

	pub cid: Option<OpValsInt64>,
	#[modql(to_sea_value_fn = "time_to_sea_value")]
	pub ctime: Option<OpValsValue>,
	pub mid: Option<OpValsInt64>,
	#[modql(to_sea_value_fn = "time_to_sea_value")]
	pub mtime: Option<OpValsValue>,
}

// endregion: --- Pack Types

// region:    --- PackBmc

pub struct PackBmc;

impl DbBmc for PackBmc {
	const TABLE: &'static str = "pack";

	fn has_scoped() -> bool {
		true
	}
}

generate_common_bmc_fns!(
	Bmc: PackBmc,
	Entity: Pack,
	ForCreate: PackForCreate, CreatePrivileges: [Access::Global(Ga::PackManage)],
	ForUpdate: PackForUpdate, UpdatePrivileges: [Access::Global(Ga::PackManage)],
	Filter: PackFilter, ListPrivileges: [Access::Global(Ga::PackManage)],
	GetPrivileges: [Access::Global(Ga::PackManage)],
	DeletePrivileges: [Access::Global(Ga::PackManage)]
);

impl PackBmc {
	#[privileges(Access::Global(Ga::PackManage))]
	pub async fn list_and_count(
		ctx: &Ctx,
		mm: &ModelManager,
		filter: Option<Vec<PackFilter>>,
		list_options: Option<ListOptions>,
	) -> Result<(Vec<Pack>, i64)> {
		let list =
			base::list::<Self, _, _>(ctx, mm, filter.clone(), list_options).await?;
		let count = base::count::<Self, _>(ctx, mm, filter).await?;
		Ok((list, count))
	}

	#[privileges(Access::Global(Ga::PackManage))]
	pub async fn ensure_pack(
		ctx: &Ctx,
		mm: &ModelManager,
		org_id: i64,
		pack_name: String,
	) -> Result<Pack> {
		// Check if pack exists by name
		let pack = PackBmc::first(
			ctx,
			mm,
			Some(vec![PackFilter {
				name: Some(OpValString::Eq(pack_name.clone()).into()),
				..Default::default()
			}]),
			None,
		)
		.await?;

		let pack = match pack {
			Some(pack) => pack,
			None => {
				// Create new pack
				let pack_id = PackBmc::create(
					ctx,
					mm,
					PackForCreate {
						name: pack_name.clone(),
						org_id,
					},
				)
				.await?;
				PackBmc::get(ctx, mm, pack_id).await?
			}
		};

		Ok(pack)
	}
}

// endregion: --- PackBmc

// region:    --- Tests

#[cfg(test)]
mod tests {
	type Error = Box<dyn std::error::Error>;
	type Result<T> = core::result::Result<T, Error>;

	use super::*;
	use crate::_dev_utils::{self, clean_orgs, seed_org};
	use serial_test::serial;

	#[serial]
	#[tokio::test]
	async fn test_create_ok() -> Result<()> {
		// -- Setup & Fixtures
		let mm = _dev_utils::init_test().await;
		let ctx = Ctx::root_ctx(None);
		let fx_name = "test_pack";
		let org_id = seed_org(&ctx, &mm, "test_org_pack_01").await?;
		let ctx = ctx.add_org_id(org_id);

		// -- Exec
		let pack_id = PackBmc::create(
			&ctx,
			&mm,
			PackForCreate {
				org_id,
				name: fx_name.to_string(),
			},
		)
		.await?;

		// -- Check
		let pack: Pack = PackBmc::get(&ctx, &mm, pack_id).await?;
		assert_eq!(pack.name, fx_name);

		// -- Clean
		PackBmc::delete(&ctx, &mm, pack_id).await?;
		clean_orgs(&ctx, &mm, "test_org_pack_01").await?;

		Ok(())
	}
}

// endregion: --- Tests
