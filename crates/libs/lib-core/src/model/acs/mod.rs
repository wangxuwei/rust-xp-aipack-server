//! TO BE IMPLEMENTED
//!
//! `acs` Access Control System based on PBAC (Privilege Based Access Control)
//!
//! (more to come)
//!

pub mod access;
pub mod access_org;
pub mod prelude;
mod role_config;
pub mod types;

use crate::model::{
	acs::role_config::{global_role_config, org_role_config},
	user::UserTyp,
	user_org::ORoleName,
};
use std::collections::HashSet;
pub use types::*;

//#region    ---------- Global Access ----------
pub fn parse_role_accesses(
	role: &UserTyp,
	accesses: &Option<Vec<GlobalAccess>>,
) -> Vec<GlobalAccess> {
	let ga_config = global_role_config();
	let mut role_accesses = ga_config.get_role_accesses(role);
	if let Some(accesses) = accesses {
		role_accesses.extend(accesses.iter().cloned());
	}
	role_accesses.into_iter().collect()
}
//#endregion    ---------- /Global Access ----------

//#region    ---------- Org Access ----------

pub fn org_role_has_access(role: &ORoleName, access: &OrgAccess) -> bool {
	let or_config = org_role_config();
	or_config.role_has_access(role, access)
}

pub fn get_org_role_accesses(role: &ORoleName) -> HashSet<OrgAccess> {
	let or_config = org_role_config();
	or_config.get_role_accesses(role)
}

pub fn get_org_roles_by_access(access: &OrgAccess) -> HashSet<ORoleName> {
	let or_config = org_role_config();
	or_config.get_roles_by_access(access)
}
//#endregion    ---------- /Org Access ----------
