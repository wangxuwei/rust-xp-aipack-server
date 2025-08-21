//! This is a prelude for all .._rpc modules to avoid redundant imports.
//! NOTE: This is only for the `rpcs` module and sub-modules.

pub use crate::model::acs::access::MethodRef;
pub use crate::model::acs::Access;
pub use crate::model::acs::GlobalAccess;
pub use crate::model::acs::OrgAccess;
pub use lib_acs_macros::privileges;
