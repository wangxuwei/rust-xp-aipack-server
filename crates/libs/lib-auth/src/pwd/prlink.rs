use crate::{
	config::auth_config,
	pwd::{Error, Result},
};
use hmac::{Hmac, Mac};
use lib_utils::b64::b64u_encode;
use serde::Serialize;
use sha2::Sha512;
use time::OffsetDateTime;
use uuid::Uuid;

#[derive(Serialize)]
pub struct PrlinkUserInfo {
	pub code: Uuid,
	pub user_id: i64,
	pub ctime: OffsetDateTime,
}

// region:    --- Helper Functions

pub fn url_prparam(info: &PrlinkUserInfo) -> Result<String> {
	// Create hash
	let hash = hash_for_prlink(info)?;
	// Create the signature data
	let signature_data = format!("{}.{}", info.code, hash);
	println!("sing {signature_data}");
	// Format as _uuid_.__hash__
	Ok(signature_data)
}

pub fn validate_prparam(rp_hash: String, info: &PrlinkUserInfo) -> Result<bool> {
	let expected_hash = url_prparam(info)?;
	if expected_hash != rp_hash {
		return Err(Error::FailRpLinkForValidate);
	}
	Ok(true)
}

fn hash_for_prlink(info: &PrlinkUserInfo) -> Result<String> {
	let config = auth_config();
	// -- Create a HMAC-SHA-512 from key.
	let mut hmac_sha512 = Hmac::<Sha512>::new_from_slice(&config.PRLINK_KEY)
		.map_err(|_| Error::FailSpawnBlockForHash)?;

	// -- Add content.
	let signature_data = format!("{}{}{}", info.code, info.user_id, info.ctime);
	hmac_sha512.update(signature_data.as_bytes());

	// -- Finalize and b64u encode.
	let hmac_result = hmac_sha512.finalize();
	let result_bytes = hmac_result.into_bytes();

	let result = b64u_encode(result_bytes);

	Ok(result)
}

// endregion: --- Helper Functions
