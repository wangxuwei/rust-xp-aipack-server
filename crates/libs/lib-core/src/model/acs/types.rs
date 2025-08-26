use modql::{SIden, StringIden};
use sea_query::{
	with_array::NotU8, ArrayType, ColumnType, DynIden, SeaRc, ValueType,
	ValueTypeErr,
};
use serde::{Deserialize, Serialize};
use strum::EnumIter;
use strum::IntoEnumIterator;
use ts_rs::TS;

//#region ---------- App Access ----------
#[derive(Debug)]
pub enum Access {
	Global(GlobalAccess),
	Org(OrgAccess),
	Entity(EntityMatchAccess),
}

// need to impl Display instead of use derive_more::Display, cause it will be ignored for inner enum derive_more::Display
impl core::fmt::Display for Access {
	fn fmt(&self, f: &mut core::fmt::Formatter<'_>) -> core::fmt::Result {
		match self {
			Access::Global(access) => write!(f, "Global({access})"),
			Access::Org(access) => write!(f, "Org({access})"),
			Access::Entity(access) => write!(f, "Entity({access})"),
		}
	}
}

#[derive(
	Clone,
	Debug,
	sqlx::Type,
	derive_more::Display,
	Deserialize,
	Serialize,
	TS,
	PartialEq,
	EnumIter,
	Hash,
	Eq,
)]
#[ts(export, export_to = "../../../frontends/_common/src/bindings/")]
#[sqlx(type_name = "user_access")]
pub enum GlobalAccess {
	#[sqlx(rename = "a_sys")]
	Sys,
	#[sqlx(rename = "a_user")]
	User,
	#[sqlx(rename = "a_ui")]
	Ui,
	#[sqlx(rename = "a_admin")]
	Admin,
	#[sqlx(rename = "a_api")]
	Api,

	#[sqlx(rename = "a_user_manage")]
	UserManage,
	#[sqlx(rename = "a_user_pwd_update")]
	UserPwdUpdate,
	#[sqlx(rename = "a_org_manage")]
	OrgManage,
}

pub type Ga = GlobalAccess;

impl From<GlobalAccess> for sea_query::Value {
	fn from(val: GlobalAccess) -> Self {
		let val = format!("a_{}", val.to_string().to_ascii_lowercase());
		val.to_string().into()
	}
}
impl NotU8 for GlobalAccess {}
impl ValueType for GlobalAccess {
	fn try_from(v: sea_query::Value) -> Result<Self, ValueTypeErr> {
		match v {
			sea_query::Value::String(Some(x)) => {
				let val = Self::iter().find(|f| f.to_string() == *x);
				match val {
					Some(value) => Ok(value),
					None => Err(ValueTypeErr),
				}
			}
			_ => Err(ValueTypeErr),
		}
	}

	fn type_name() -> String {
		"UserAccess".into()
	}

	fn array_type() -> ArrayType {
		ArrayType::String
	}

	fn column_type() -> ColumnType {
		ColumnType::Enum {
			name: SeaRc::new(SIden("user_access")),
			variants: Self::iter()
				.map(|f| SeaRc::new(StringIden(f.to_string())))
				.collect::<Vec<DynIden>>(),
		}
	}
}

#[derive(Debug, PartialEq, Clone, Eq, Hash, derive_more::Display)]
pub enum EntityMatchAccess {
	Id,
	Cid,
	UserId,
}
pub type Ema = EntityMatchAccess;

impl EntityMatchAccess {
	pub fn get_prop(&self) -> &str {
		match self {
			Self::Id => "id",
			Self::Cid => "cid",
			Self::UserId => "user_id",
		}
	}
}

//#endregion ---------- /App Access ----------

//#region    ---------- Org Access ----------
#[derive(
	Debug,
	PartialEq,
	Clone,
	Eq,
	Hash,
	Copy,
	derive_more::Display,
	TS,
	Serialize,
	Deserialize,
)]
#[ts(export, export_to = "../../../frontends/_common/src/bindings/")]
pub enum OrgAccess {
	User,
	Manage,
	Admin,

	OrgRename,
	UserManage,
	PackPublish,
	PackYank,
}
pub type Oa = OrgAccess;

//#endregion    ---------- /Org Access ----------
