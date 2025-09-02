use crate::error::{Error, Result};
use crate::utils::token;
use axum::extract::State;
use axum::Json;
use lib_auth::pwd::{self, ContentToHash, SchemeStatus};
use lib_auth::token::generate_web_token;
use lib_core::ctx::Ctx;
use lib_core::model::user::{UserBmc, UserForLogin};
use lib_core::model::ModelManager;
use serde::Deserialize;
use serde_json::{json, Value};
use tower_cookies::Cookies;
use tracing::debug;

// region:    --- Login
pub async fn api_login_handler(
	State(mm): State<ModelManager>,
	cookies: Cookies,
	Json(payload): Json<LoginPayload>,
) -> Result<Json<Value>> {
	debug!("{:<12} - api_login_handler", "HANDLER");
	let root_ctx = Ctx::root_ctx(None);

	let user = do_login(&root_ctx, &mm, &payload).await?;

	// -- Set web token.
	token::set_token_cookie(&cookies, &user.username, user.token_salt)?;

	// Create the success body.
	let body = Json(json!({
		"result": {
			"success": true
		}
	}));

	Ok(body)
}

pub async fn api_aip_login_handler(
	State(mm): State<ModelManager>,
	Json(payload): Json<LoginPayload>,
) -> Result<Json<Value>> {
	debug!("{:<12} - api_aip_login_handler", "HANDLER");
	let root_ctx = Ctx::root_ctx(None);

	let user = do_login(&root_ctx, &mm, &payload).await?;

	// -- generate web token.
	let token = generate_web_token(&user.username, user.token_salt)?;

	// Create the success body.
	let body = Json(json!({
		"result": {
			"success": true,
			"token": token.to_string()
		}
	}));

	Ok(body)
}

#[derive(Debug, Deserialize)]
pub struct LoginPayload {
	username: String,
	pwd: String,
}
// endregion: --- Login

// region:    --- Logoff
pub async fn api_logoff_handler(
	cookies: Cookies,
	Json(payload): Json<LogoffPayload>,
) -> Result<Json<Value>> {
	debug!("{:<12} - api_logoff_handler", "HANDLER");
	let should_logoff = payload.logoff;

	if should_logoff {
		token::remove_token_cookie(&cookies)?;
	}

	// Create the success body.
	let body = Json(json!({
		"result": {
			"logged_off": should_logoff
		}
	}));

	Ok(body)
}

#[derive(Debug, Deserialize)]
pub struct LogoffPayload {
	logoff: bool,
}
// endregion: --- Logoff

async fn do_login(
	ctx: &Ctx,
	mm: &ModelManager,
	payload: &LoginPayload,
) -> Result<UserForLogin> {
	let LoginPayload {
		username,
		pwd: pwd_clear,
	} = payload;

	// -- Get the user.
	let user: UserForLogin = UserBmc::first_by_username(ctx, mm, username)
		.await?
		.ok_or(Error::LoginFailUsernameNotFound)?;
	let user_id = user.id;

	// -- Validate the password.
	let Some(ref pwd) = user.pwd else {
		return Err(Error::LoginFailUserHasNoPwd { user_id });
	};

	let scheme_status = pwd::validate_pwd(
		ContentToHash {
			salt: user.pwd_salt,
			content: pwd_clear.to_string(),
		},
		pwd.to_string(),
	)
	.await
	.map_err(|_| Error::LoginFailPwdNotMatching { user_id })?;

	// -- Update password scheme if needed
	if let SchemeStatus::Outdated = scheme_status {
		debug!("pwd encrypt scheme outdated, upgrading.");
		UserBmc::update_pwd(ctx, mm, user.id, pwd_clear).await?;
	}

	Ok(user)
}
