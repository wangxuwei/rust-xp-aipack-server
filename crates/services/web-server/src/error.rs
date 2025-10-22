use derive_more::From;
use lib_core::model;
use serde::Serialize;
use serde_with::serde_as;

pub type Result<T> = core::result::Result<T, Error>;

#[serde_as]
#[derive(Debug, From, Serialize)]
#[serde(tag = "type", content = "data")]
pub enum Error {
	// -- Modules
	#[from]
	Pwd(lib_auth::pwd::Error),
	#[from]
	Model(model::Error),
	#[from]
	Rpc(lib_rpc_core::Error),

	FileTooLarge,
}

// region:    --- Error Boilerplate
impl core::fmt::Display for Error {
	fn fmt(
		&self,
		fmt: &mut core::fmt::Formatter,
	) -> core::result::Result<(), core::fmt::Error> {
		write!(fmt, "{self:?}")
	}
}

impl std::error::Error for Error {}
// endregion: --- Error Boilerplate
