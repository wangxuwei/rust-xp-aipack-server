// region:    --- Modules

mod error;

pub use self::error::{Error, Result};
use crate::model::{
	acs::{
		access_org::get_org_access, parse_role_accesses, GlobalAccess, OrgAccess,
	},
	user::{UserForAuth, UserTyp},
	ModelManager,
};
use std::{
	collections::{HashMap, HashSet},
	sync::{Arc, RwLock},
};
use uuid::Uuid;

// endregion: --- Modules

#[cfg_attr(feature = "with-rpc", derive(rpc_router::RpcResource))]
#[derive(Clone, Debug)]
pub struct Ctx {
	user_id: i64,

	/// Note: For the future ACS (Access Control System)
	org_id: Option<i64>,
	user: UserForAuth,
	accesses_by_org_id: Arc<RwLock<HashMap<i64, HashSet<OrgAccess>>>>,
}

// Constructors.
impl Ctx {
	pub fn root_ctx(org_id: Option<i64>) -> Self {
		let typ = UserTyp::Sys;
		let acs = None;
		let accesses = parse_role_accesses(&typ, &acs);
		Ctx {
			user_id: 0,
			org_id,
			user: UserForAuth {
				id: 0,
				typ,
				username: "Sys".to_string(),
				token_salt: Uuid::new_v4(),
				accesses: Some(accesses),
			},
			accesses_by_org_id: Arc::new(RwLock::new(HashMap::new())),
		}
	}

	pub fn new(mut user: UserForAuth) -> Result<Self> {
		user.accesses = Some(parse_role_accesses(&user.typ, &user.accesses));
		if user.id == 0 {
			Err(Error::CtxCannotNewRootCtx)
		} else {
			Ok(Self {
				user_id: user.id,
				org_id: None,
				user,
				accesses_by_org_id: Arc::new(RwLock::new(HashMap::new())),
			})
		}
	}

	/// Note: For the future ACS (Access Control System)
	pub fn add_org_id(&self, org_id: i64) -> Ctx {
		let mut ctx = self.clone();
		ctx.org_id = Some(org_id);
		ctx
	}
}

// Property Accessors.
impl Ctx {
	pub fn user_id(&self) -> i64 {
		self.user_id
	}

	//. /// Note: For the future ACS (Access Control System)
	pub fn org_id(&self) -> Option<i64> {
		self.org_id
	}

	pub fn has_access(&self, access: &GlobalAccess) -> bool {
		if let Some(ref accesses) = self.user.accesses {
			accesses.contains(access)
		} else {
			false
		}
	}

	pub fn has_org_access(&self, org_id: i64, access: &OrgAccess) -> bool {
		let map = self.accesses_by_org_id.read().unwrap();
		// first, get the privileges for this user on this org (from context cache)
		let privileges = map.get(&org_id);
		if privileges.is_none() {
			return false;
		}
		let privileges = privileges.unwrap();
		privileges.contains(access)
	}

	pub async fn add_org_access_if_need(
		&self,
		mm: &ModelManager,
		org_id: i64,
	) -> Result<()> {
		// get read lock first
		{
			let map = self.accesses_by_org_id.read().unwrap();
			if map.contains_key(&org_id) {
				return Ok(());
			}
		}

		let privileges_array: Vec<OrgAccess> =
			get_org_access(mm, self.user_id, org_id)
				.await
				.map_err(|_| Error::LoadOrgAccesses)?;

		// no cache, then get write lock to save
		let mut map = self.accesses_by_org_id.write().unwrap();
		// get write lock to check again
		if map.contains_key(&org_id) {
			return Ok(());
		}

		let accesses = privileges_array.into_iter().collect::<HashSet<_>>();
		map.insert(org_id, accesses);

		Ok(())
	}
}
