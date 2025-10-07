use crate::error::{Error, Result};
use crate::middleware::mw_auth::CtxW;
use crate::utils::token::set_token_cookie;
use axum::extract::State;
use axum::Json;
use lib_auth::pwd::{self, ContentToHash};
use lib_core::model::user::{UserBmc, UserForAuth, UserForLogin};
use lib_core::model::ModelManager;
use serde::Deserialize;
use serde_json::{json, Value};
use tower_cookies::Cookies;

#[axum::debug_handler]
pub async fn api_user_handler(
	ctx: Result<CtxW>,
	State(mm): State<ModelManager>,
) -> Result<Json<Value>> {
	let ctx = ctx.ok().map(|ctx| ctx.0);
	match ctx {
		Some(ctx) => {
			let user_id = ctx.user_id();
			let user: UserForAuth = UserBmc::get(&ctx, &mm, user_id).await?;
			let user_id = user.id;

			// Create the success body.
			let body = Json(json!({
				"result": {
					"user": {
						"id": user_id,
						"username": user.username,
						"role": user.typ,
						"accesses": ctx.accesses()
					}
				}
			}));

			Ok(body)
		}
		None => Ok(Json(json!({
			"result": {
			}
		}))),
	}
}

#[derive(Debug, Deserialize)]
pub struct UpdatePwdPayload {
	pub user_id: i64,
	pub pwd_clear: String,
	pub repeat_pwd: String,
	pub pwd: Option<String>,
}

pub async fn api_user_update_pwd_handler(
	ctx: Result<CtxW>,
	State(mm): State<ModelManager>,
	cookies: Cookies,
	Json(payload): Json<UpdatePwdPayload>,
) -> Result<Json<Value>> {
	let Ok(ctx) = ctx else {
		return Err(Error::UserNotFound);
	};
	let ctx = ctx.0;

	let user: UserForLogin =
		UserBmc::get::<UserForLogin>(&ctx, &mm, payload.user_id).await?;
	let user_id = user.id;

	// -- Validate the password.
	let Some(pwd) = user.pwd else {
		return Err(Error::FailUserHasNoPwd { user_id });
	};

	if payload.repeat_pwd != payload.pwd_clear {
		return Err(Error::FailPwdNotMatching { user_id });
	};

	if payload.user_id == ctx.user_id() {
		let Some(old_pwd) = payload.pwd else {
			return Err(Error::FailUserHasNoPwd { user_id });
		};
		let _ = pwd::validate_pwd(
			ContentToHash {
				salt: user.pwd_salt,
				content: old_pwd,
			},
			pwd,
		)
		.await
		.map_err(|_| Error::FailPwdNotCorrect { user_id })?;
	}

	UserBmc::update_pwd(&ctx, &mm, user.id, &payload.pwd_clear).await?;
	// -- Set web token.
	set_token_cookie(&cookies, &user.username, user.token_salt)?;

	Ok(Json(json!({
		"result": {
			"success": true
		}
	})))
}
