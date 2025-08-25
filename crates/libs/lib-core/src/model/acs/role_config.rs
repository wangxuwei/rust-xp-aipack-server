use crate::model::{
	acs::{Ga, GlobalAccess, Oa, OrgAccess},
	user::UserTyp,
	user_org::ORoleName,
};
use std::{
	collections::{HashMap, HashSet},
	sync::OnceLock,
};
use strum::IntoEnumIterator;

pub struct GlobalRoleConfig {
	roles: HashMap<UserTyp, HashSet<Ga>>,
}

impl GlobalRoleConfig {
	fn new() -> Self {
		let user: HashSet<GlobalAccess> = HashSet::from([Ga::User]);

		let admin: HashSet<GlobalAccess> =
			GlobalAccess::iter().collect::<HashSet<_>>();
		let admin = admin.union(&user).cloned().collect();

		let mut roles = HashMap::new();
		roles.insert(UserTyp::User, user);
		roles.insert(UserTyp::Sys, admin);

		Self { roles }
	}

	pub fn get_role_accesses(&self, role: &UserTyp) -> HashSet<GlobalAccess> {
		self.roles.get(role).cloned().unwrap_or(HashSet::new())
	}
}

static GLOBAL_ROLE_CONFIG: OnceLock<GlobalRoleConfig> = OnceLock::new();

pub fn global_role_config() -> &'static GlobalRoleConfig {
	GLOBAL_ROLE_CONFIG.get_or_init(GlobalRoleConfig::new)
}

pub struct OrgRoleConfig {
	roles: HashMap<ORoleName, HashSet<OrgAccess>>,
	roles_by_access: HashMap<OrgAccess, HashSet<ORoleName>>,
}

impl OrgRoleConfig {
	fn new() -> Self {
		let viewer: HashSet<OrgAccess> = HashSet::from([Oa::User]);

		let editor: HashSet<OrgAccess> = HashSet::from([Oa::Manage]);
		let editor = editor.union(&viewer).copied().collect();

		let admin: HashSet<OrgAccess> = HashSet::from([]);
		let admin = admin.union(&editor).copied().collect();

		let owner: HashSet<OrgAccess> = HashSet::from([Oa::Admin]);
		let owner = owner.union(&admin).copied().collect();

		let mut roles = HashMap::new();
		roles.insert(ORoleName::Viewer, viewer);
		roles.insert(ORoleName::Editor, editor);
		roles.insert(ORoleName::Admin, admin);
		roles.insert(ORoleName::Owner, owner);

		let mut roles_by_access = HashMap::new();
		for (role, accesses) in &roles {
			for access in accesses {
				roles_by_access
					.entry(*access)
					.or_insert_with(HashSet::new)
					.insert(*role);
			}
		}

		Self {
			roles,
			roles_by_access,
		}
	}

	pub fn get_role_accesses(&self, role: &ORoleName) -> HashSet<OrgAccess> {
		self.roles.get(role).cloned().unwrap_or(HashSet::new())
	}

	pub fn get_roles_by_access(&self, access: &OrgAccess) -> HashSet<ORoleName> {
		self.roles_by_access
			.get(access)
			.cloned()
			.unwrap_or(HashSet::new())
	}

	pub fn role_has_access(&self, role: &ORoleName, access: &OrgAccess) -> bool {
		self.get_role_accesses(role).contains(access)
	}
}

static ORG_ROLE_CONFIG: OnceLock<OrgRoleConfig> = OnceLock::new();

pub fn org_role_config() -> &'static OrgRoleConfig {
	ORG_ROLE_CONFIG.get_or_init(OrgRoleConfig::new)
}
