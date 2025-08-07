use crate::ctx::Ctx;
use crate::generate_common_bmc_fns;
use crate::model::base::{self, DbBmc};
use crate::model::modql_utils::time_to_sea_value;
use crate::model::ModelManager;
use crate::model::Result;
use lib_utils::time::Rfc3339;
use modql::field::Fields;
use modql::filter::{
	FilterNodes, ListOptions, OpValsInt64, OpValsString, OpValsValue,
};
use sea_query::Nullable;
use serde::{Deserialize, Serialize};
use serde_with::serde_as;
use sqlx::types::time::OffsetDateTime;
use sqlx::FromRow;
use ts_rs::TS;

// region:    --- Org Types

/// Trait to implement on entities that have a org_id
/// This will allow Ctx to be upgraded with the corresponding org_id for
/// future access control.
pub trait OrgScoped {
	fn org_id(&self) -> i64;
}

#[derive(
	Debug, Clone, sqlx::Type, derive_more::Display, Deserialize, Serialize, TS,
)]
#[ts(export, export_to = "../../../frontends/web/src/bindings/")]
#[sqlx(type_name = "org_kind")]
#[cfg_attr(test, derive(PartialEq))]
pub enum OrgKind {
	Personal,
	Corporate,
}

/// Note: Manual implementation.
///       Required for a modql::field::Fields
impl From<OrgKind> for sea_query::Value {
	fn from(val: OrgKind) -> Self {
		val.to_string().into()
	}
}

/// Note: Manual implementation.
///       This is required for sea::query in case of None.
///       However, in this codebase, we utilize the modql not_none_field,
///       so this will be disregarded anyway.
///       Nonetheless, it's still necessary for compilation.
impl Nullable for OrgKind {
	fn null() -> sea_query::Value {
		OrgKind::Personal.into()
	}
}

#[serde_as]
#[derive(Debug, Clone, Fields, FromRow, Serialize, TS)]
#[ts(export, export_to = "../../../frontends/web/src/bindings/")]
pub struct Org {
	pub id: i64,

	// -- Properties
	pub name: Option<String>,
	pub kind: OrgKind,

	// -- Timestamps
	// creator user_id and time
	pub cid: i64,
	#[serde_as(as = "Rfc3339")]
	#[ts(type = "string")]
	pub ctime: OffsetDateTime,
	// last modifier user_id and time
	pub mid: i64,
	#[serde_as(as = "Rfc3339")]
	#[ts(type = "string")]
	pub mtime: OffsetDateTime,
}

#[derive(Fields, Deserialize, Default)]
pub struct OrgForCreate {
	pub name: Option<String>,

	#[field(cast_as = "org_kind")]
	pub kind: Option<OrgKind>,
}

#[derive(Fields, Deserialize, Default)]
pub struct OrgForUpdate {
	pub name: Option<String>,
	#[field(cast_as = "org_kind")]
	pub kind: Option<OrgKind>,
}

#[derive(FilterNodes, Deserialize, Default, Debug)]
pub struct OrgFilter {
	pub id: Option<OpValsInt64>,

	#[modql(cast_as = "org_kind")]
	pub kind: Option<OpValsString>,

	pub name: Option<OpValsString>,

	pub cid: Option<OpValsInt64>,
	#[modql(to_sea_value_fn = "time_to_sea_value")]
	pub ctime: Option<OpValsValue>,
	pub mid: Option<OpValsInt64>,
	#[modql(to_sea_value_fn = "time_to_sea_value")]
	pub mtime: Option<OpValsValue>,
}

// endregion: --- Org Types

// region:    --- OrgBmc

pub struct OrgBmc;

impl DbBmc for OrgBmc {
	const TABLE: &'static str = "org";
}

// This will generate the `impl OrgBmc {...}` with the default CRUD functions.
generate_common_bmc_fns!(
	Bmc: OrgBmc,
	Entity: Org,
	ForCreate: OrgForCreate,
	ForUpdate: OrgForUpdate,
	Filter: OrgFilter,
);

// endregion: --- OrgBmc

// region:    --- Tests

#[cfg(test)]
mod tests {
	type Error = Box<dyn std::error::Error>;
	type Result<T> = core::result::Result<T, Error>; // For tests.

	use super::*;
	use crate::_dev_utils::{self, clean_orgs};
	use crate::ctx::Ctx;
	use modql::filter::OpValString;
	use serial_test::serial;

	#[serial]
	#[tokio::test]
	async fn test_create_ok() -> Result<()> {
		// -- Setup & Fixtures
		let mm = _dev_utils::init_test().await;
		let ctx = Ctx::root_ctx();
		let fx_title = "test_create_ok org 01";
		let fx_kind = OrgKind::Personal;

		// -- Exec
		let org_id = OrgBmc::create(
			&ctx,
			&mm,
			OrgForCreate {
				name: Some(fx_title.to_string()),
				kind: Some(fx_kind.clone()),
			},
		)
		.await?;

		// -- Check
		let org: Org = OrgBmc::get(&ctx, &mm, org_id).await?;
		assert_eq!(&org.kind, &fx_kind);
		assert_eq!(org.name.ok_or("org should have title")?, fx_title);

		// -- Clean
		OrgBmc::delete(&ctx, &mm, org_id).await?;

		Ok(())
	}

	#[serial]
	#[tokio::test]
	async fn test_list_ok() -> Result<()> {
		// -- Setup & Fixtures
		let mm = _dev_utils::init_test().await;
		let ctx = Ctx::root_ctx();
		let fx_title_prefix = "test_list_ok org - ";

		for i in 1..=6 {
			let kind = if i <= 3 {
				OrgKind::Personal
			} else {
				OrgKind::Corporate
			};

			let _org_id = OrgBmc::create(
				&ctx,
				&mm,
				OrgForCreate {
					name: Some(format!("{fx_title_prefix}{i:<02}")),
					kind: Some(kind),
				},
			)
			.await?;
		}

		// -- Exec
		let orgs = OrgBmc::list(
			&ctx,
			&mm,
			Some(vec![OrgFilter {
				kind: Some(OpValString::In(vec!["MultiUsers".to_string()]).into()),
				// or
				// kind: Some(OpValString::Eq("MultiUsers".to_string()).into()),
				..Default::default()
			}]),
			None,
		)
		.await?;

		// -- Check
		// extract the 04, 05, 06 parts of the tiles
		let num_parts = orgs
			.iter()
			.filter_map(|c| c.name.as_ref().and_then(|s| s.split("- ").nth(1)))
			.collect::<Vec<&str>>();
		assert_eq!(num_parts, &["04", "05", "06"]);

		// -- Clean
		// This should delete cascade
		clean_orgs(&ctx, &mm, fx_title_prefix).await?;

		Ok(())
	}
}

// endregion: --- Tests
