use crate::{
	ctx::Ctx,
	model::{
		base::{self, DbBmc},
		ModelManager, Result,
	},
};
use lib_utils::time::Rfc3339;
use modql::field::Fields;
use serde::{Deserialize, Serialize};
use serde_with::serde_as;
use sqlx::FromRow;
use time::OffsetDateTime;
use ts_rs::TS;

// region:    --- Types

#[serde_as]
#[derive(Debug, Clone, Fields, FromRow, Serialize, TS)]
#[ts(export, export_to = "../../../frontends/web/src/bindings/")]
pub struct UserOrg {
	pub id: i64,

	// -- FK
	pub org_id: i64,
	pub user_id: i64,

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

#[derive(Fields, Deserialize)]
pub struct UserOrgForCreate {
	pub org_id: i64,
	pub user_id: i64,
}

// endregion: --- Types

// region:    --- UserOrg

pub struct UserOrgBmc;

impl DbBmc for UserOrgBmc {
	const TABLE: &'static str = "user_org";
}

impl UserOrgBmc {
	pub async fn create(
		ctx: &Ctx,
		mm: &ModelManager,
		entity_c: UserOrgForCreate,
	) -> Result<i64> {
		base::create::<Self, _>(ctx, mm, entity_c).await
	}

	pub async fn create_many(
		ctx: &Ctx,
		mm: &ModelManager,
		entity_c: Vec<UserOrgForCreate>,
	) -> Result<Vec<i64>> {
		base::create_many::<Self, _>(ctx, mm, entity_c).await
	}

	pub async fn get(ctx: &Ctx, mm: &ModelManager, id: i64) -> Result<UserOrg> {
		base::get::<Self, _>(ctx, mm, id).await
	}

	pub async fn delete(ctx: &Ctx, mm: &ModelManager, id: i64) -> Result<()> {
		base::delete::<Self>(ctx, mm, id).await
	}

	pub async fn delete_many(
		ctx: &Ctx,
		mm: &ModelManager,
		ids: Vec<i64>,
	) -> Result<u64> {
		base::delete_many::<Self>(ctx, mm, ids).await
	}
}

// endregion: --- UserOrg
