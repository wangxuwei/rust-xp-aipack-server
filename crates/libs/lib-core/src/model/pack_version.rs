use crate::ctx::Ctx;
use crate::generate_common_bmc_fns;
use crate::model::acs::prelude::*;
use crate::model::acs::Ga;
use crate::model::base::{self, DbBmc};
use crate::model::modql_utils::time_to_sea_value;
use crate::model::pack::PackBmc;
use crate::model::ModelManager;
use crate::model::Result;
use lib_utils::time::Rfc3339;
use modql::field::Fields;
use modql::filter::OpValInt64;
use modql::filter::OpValString;
use modql::filter::{
	FilterNodes, ListOptions, OpValsInt64, OpValsString, OpValsValue,
};

use crate::model::org::OrgBmc;
use sea_query::enum_def;
use serde::{Deserialize, Serialize};
use serde_with::serde_as;
use sqlx::types::time::OffsetDateTime;
use sqlx::FromRow;
use ts_rs::TS;

// region:    --- PackVersion Types

#[serde_as]
#[derive(Debug, Clone, Fields, FromRow, Serialize, TS, sqlx::Type)]
#[ts(export, export_to = "../../../frontends/web/src/bindings/")]
#[enum_def]
pub struct PackVersion {
	#[ts(type = "number")]
	pub id: i64,
	#[ts(type = "number")]
	pub org_id: i64,
	#[ts(type = "number")]
	pub pack_id: i64,
	pub version: String,
	pub file_path: String,
	#[ts(type = "number")]
	pub file_size: i64,
	pub changelog: Option<String>,

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
pub struct PackVersionForCreate {
	pub pack_id: i64,
	pub org_id: i64,
	pub version: String,
	pub file_path: String,
	pub file_size: i64,
	pub changelog: Option<String>,
}

#[derive(Fields, Serialize, Deserialize, Default)]
pub struct PackVersionForUpdate {
	pub version: Option<String>,
	pub file_path: Option<String>,
	pub file_size: Option<i64>,
	pub changelog: Option<String>,
}

#[derive(FilterNodes, Deserialize, Default, Debug, Clone)]
pub struct PackVersionFilter {
	pub id: Option<OpValsInt64>,
	pub pack_id: Option<OpValsInt64>,
	pub version: Option<OpValsString>,

	pub cid: Option<OpValsInt64>,
	#[modql(to_sea_value_fn = "time_to_sea_value")]
	pub ctime: Option<OpValsValue>,
	pub mid: Option<OpValsInt64>,
	#[modql(to_sea_value_fn = "time_to_sea_value")]
	pub mtime: Option<OpValsValue>,
}

// endregion: --- PackVersion Types

// region:    --- PackVersionBmc

pub struct PackVersionBmc;

impl DbBmc for PackVersionBmc {
	const TABLE: &'static str = "pack_version";
}

generate_common_bmc_fns!(
	Bmc: PackVersionBmc,
	Entity: PackVersion,
	ForCreate: PackVersionForCreate, CreatePrivileges: [Access::Global(Ga::PackManage)],
	ForUpdate: PackVersionForUpdate, UpdatePrivileges: [Access::Global(Ga::PackManage)],
	Filter: PackVersionFilter, ListPrivileges: [Access::Global(Ga::PackManage)],
	GetPrivileges: [Access::Global(Ga::PackManage)],
	DeletePrivileges: [Access::Global(Ga::PackManage)]
);

impl PackVersionBmc {
	#[privileges(Access::Global(Ga::PackManage))]
	pub async fn list_and_count(
		ctx: &Ctx,
		mm: &ModelManager,
		filter: Option<Vec<PackVersionFilter>>,
		list_options: Option<ListOptions>,
	) -> Result<(Vec<PackVersion>, i64)> {
		let list =
			base::list::<Self, _, _>(ctx, mm, filter.clone(), list_options).await?;
		let count = base::count::<Self, _>(ctx, mm, filter).await?;
		Ok((list, count))
	}

	#[privileges(Access::Global(Ga::PackManage))]
	pub async fn get_pack_version(
		ctx: &Ctx,
		mm: &ModelManager,
		pack_id: i64,
		version: &str,
	) -> Result<Option<PackVersion>> {
		base::first::<Self, _, _>(
			ctx,
			mm,
			Some(vec![PackVersionFilter {
				pack_id: Some(OpValInt64::Eq(pack_id).into()),
				version: Some(OpValString::Eq(version.to_string()).into()),
				..Default::default()
			}]),
			None,
		)
		.await
	}

	#[privileges(Access::Global(Ga::PackManage))]
	pub async fn save_pack_version(
		ctx: &Ctx,
		mm: &ModelManager,
		org_name: String,
		pack_name: String,
		version: String,
		file_path: String,
		file_size: i64,
	) -> Result<PackVersion> {
		let org = OrgBmc::ensure_org(ctx, mm, org_name).await?;
		let pack = PackBmc::ensure_pack(ctx, mm, org.id, pack_name).await?;

		// Check if pack version exists for this pack and version
		let pack_version =
			Self::get_pack_version(ctx, mm, pack.id, &version).await?;

		let pack_version_id = match pack_version {
			Some(pack_version) => {
				// Update the pack version
				Self::update(
					ctx,
					mm,
					pack_version.id,
					PackVersionForUpdate {
						version: Some(version),
						file_path: Some(file_path),
						file_size: Some(file_size),
						changelog: None,
					},
				)
				.await?;
				pack_version.id
			}
			None => {
				// Create the pack version
				let pack_version_id = Self::create(
					ctx,
					mm,
					PackVersionForCreate {
						org_id: org.id,
						pack_id: pack.id,
						version,
						file_path,
						file_size,
						changelog: None,
					},
				)
				.await?;
				pack_version_id
			}
		};

		Self::get(ctx, mm, pack_version_id).await
	}
}

// endregion: --- PackVersionBmc

// region:    --- Tests

#[cfg(test)]
mod tests {
	type Error = Box<dyn std::error::Error>;
	type Result<T> = core::result::Result<T, Error>;

	use super::*;
	use crate::{
		_dev_utils::{self, clean_orgs, seed_org},
		model::pack::{PackBmc, PackForCreate},
	};
	use serial_test::serial;

	#[serial]
	#[tokio::test]
	async fn test_create_ok() -> Result<()> {
		// -- Setup & Fixtures
		let mm = _dev_utils::init_test().await;
		let ctx = Ctx::root_ctx(None);
		let org_id = seed_org(&ctx, &mm, "test_org_pack_01").await?;

		let pack_id = PackBmc::create(
			&ctx,
			&mm,
			PackForCreate {
				org_id,
				name: "test_pack".to_string(),
			},
		)
		.await?;
		let fx_version = "1.0.0";
		let fx_file_path = ".packs-data/packs/test.aipack";
		let fx_file_size = 1024;

		// -- Exec
		let pack_version_id = PackVersionBmc::create(
			&ctx,
			&mm,
			PackVersionForCreate {
				org_id,
				pack_id,
				version: fx_version.to_string(),
				file_path: fx_file_path.to_string(),
				file_size: fx_file_size,
				changelog: Some("Initial version".to_string()),
			},
		)
		.await?;

		// -- Check
		let pack_version: PackVersion =
			PackVersionBmc::get(&ctx, &mm, pack_version_id).await?;
		assert_eq!(pack_version.version, fx_version);
		assert_eq!(pack_version.file_path, fx_file_path);
		assert_eq!(pack_version.file_size, fx_file_size);

		// -- Clean
		PackVersionBmc::delete(&ctx, &mm, pack_version_id).await?;
		PackBmc::delete(&ctx, &mm, pack_id).await?;
		clean_orgs(&ctx, &mm, "test_org_pack_01").await?;

		Ok(())
	}
}

// endregion: --- Tests
