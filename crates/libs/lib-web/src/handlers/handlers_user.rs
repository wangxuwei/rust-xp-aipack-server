use crate::config::rpc_config;
use crate::error::{Error, Result};
use crate::middleware::mw_auth::CtxW;
use crate::utils::token::{remove_token_cookie, set_token_cookie};
use axum::body::Body;
use axum::extract::{Query, State};
use axum::http::header::CONTENT_TYPE;
use axum::http::{Response, StatusCode};
use axum::Json;
use lettre::message::header::ContentType;
use lettre::{Message, SmtpTransport, Transport};
use lib_auth::pwd::prlink::{url_prparam, validate_prparam, PrlinkUserInfo};
use lib_auth::pwd::{self, ContentToHash};
use lib_core::ctx::Ctx;
use lib_core::model::prlink::{Prlink, PrlinkBmc, PrlinkForCreate};
use lib_core::model::user::{User, UserBmc, UserForAuth, UserForLogin};
use lib_core::model::ModelManager;
use lib_utils::time::now_utc;
use regex::Regex;
use serde::Deserialize;
use serde_json::{json, Value};
use std::collections::HashMap;
use time::Duration;
use tower_cookies::Cookies;
use uuid::Uuid;

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

#[derive(Debug, Deserialize)]
pub struct PrlinkPayload {
	pub user_id: i64,
}

pub async fn api_user_prlink(
	ctx: Result<CtxW>,
	State(mm): State<ModelManager>,
	Json(payload): Json<PrlinkPayload>,
) -> Result<Json<Value>> {
	let Ok(ctx) = ctx else {
		return Err(Error::UserNotFound);
	};
	let ctx = ctx.0;
	let PrlinkPayload { user_id } = payload;

	// Get user
	let user = UserBmc::get::<User>(&ctx, &mm, user_id).await?;

	// Check if prlink already exists and remove it
	let existing_prlink = PrlinkBmc::get_by_user_id(&ctx, &mm, user_id).await?;
	if !existing_prlink.is_empty() {
		PrlinkBmc::delete_many(
			&ctx,
			&mm,
			existing_prlink.iter().map(|v| v.id).collect(),
		)
		.await?;
	}

	// Create new prlink
	let prlink_data = PrlinkForCreate {
		user_id,
		code: uuid::Uuid::now_v7(),
	};
	let prlink_id = PrlinkBmc::create(&ctx, &mm, prlink_data).await?;

	// Get the newly created prlink
	let prlink = PrlinkBmc::get(&ctx, &mm, prlink_id).await?;

	// Create PRLinkUserInfo
	let prlink_user_info = PrlinkUserInfo {
		code: prlink.code,
		user_id: user.id,
		ctime: prlink.ctime,
	};

	// Generate prp (password reset parameter)
	let config = rpc_config();
	let prp = url_prparam(&prlink_user_info)?;

	// Return response
	let url = format!("{}/pwd-reset?prp={prp}", config.HOST);
	send_email(url.as_str(), user.username.as_str()).await?;

	Ok(Json(json!({
		"result": {
			"success": true
		}
	})))
}

pub async fn pwd_reset(
	query: Query<HashMap<String, String>>,
) -> Result<Response<Body>> {
	let prp = query.get("prp").ok_or(Error::PrpMissing)?;

	// Render the pwd-reset.html using handlebars
	let mut handlebars = handlebars::Handlebars::new();
	let config = rpc_config();
	handlebars.register_template_file(
		"pwd-reset",
		format!("{}/pwd-reset.html", config.WEB_FOLDER),
	)?;

	let mut data = HashMap::new();
	data.insert("prp", prp);

	let html = handlebars.render("pwd-reset", &data)?;

	Ok(Response::builder()
		.status(StatusCode::OK)
		.header(CONTENT_TYPE, "text/html")
		.body(Body::from(html))?)
}

#[derive(Debug, Deserialize)]
pub struct CheckPrpPayload {
	pub prp: String,
}

pub async fn api_prp_check_prlink(
	State(mm): State<ModelManager>,
	Json(payload): Json<CheckPrpPayload>,
) -> Result<Json<Value>> {
	let _ = check_prp(&mm, &payload.prp).await?;
	Ok(Json(json!({
		"result": {
			"success": true
		}
	})))
}

#[derive(Debug, Deserialize)]
pub struct CheckResetPwdPayload {
	pub prp: String,
	pub pwd_clear: String,
	pub repeat_pwd: String,
}

pub async fn api_prp_reset_pwd(
	State(mm): State<ModelManager>,
	cookies: Cookies,
	Json(payload): Json<CheckResetPwdPayload>,
) -> Result<Json<Value>> {
	let _ = check_prp(&mm, &payload.prp).await?;
	let ctx = Ctx::root_ctx(None);
	let (user, _) = check_prp(&mm, &payload.prp).await?;
	let user_id = user.id;

	// -- Validate the password.
	if payload.pwd_clear.is_empty() {
		return Err(Error::FailUserHasNoPwd { user_id });
	};

	if payload.repeat_pwd != payload.pwd_clear {
		return Err(Error::FailPwdNotMatching { user_id });
	};

	UserBmc::update_pwd(&ctx, &mm, user.id, &payload.pwd_clear).await?;
	remove_token_cookie(&cookies)?;

	Ok(Json(json!({
		"result": {
			"success": true
		}
	})))
}

async fn check_prp(mm: &ModelManager, prp: &str) -> Result<(UserForLogin, Prlink)> {
	let parts: Vec<&str> = prp.split('.').collect();
	if parts.len() != 2 || parts[0].is_empty() || parts[1].is_empty() {
		return Err(Error::PrpMissing);
	}

	let uuid_str = parts[0];

	// Parse the UUID
	let uuid = Uuid::parse_str(uuid_str).map_err(|_| Error::PrpInvalid)?;

	// Get the prlink from the database
	let ctx = Ctx::root_ctx(None);
	let prlink = PrlinkBmc::get_by_code(&ctx, mm, uuid).await?;

	let prlink = prlink.ok_or(Error::PrpInvalid)?;

	// Get the user
	let user = UserBmc::get::<UserForLogin>(&ctx, mm, prlink.user_id).await?;

	let ctime = prlink.ctime;
	let now_time = now_utc();
	let config = rpc_config();
	if now_time - ctime > Duration::hours(config.PRLINK_DURATION) {
		return Err(Error::PrpTimeout);
	}

	let prlink_user_info = PrlinkUserInfo {
		code: prlink.code,
		user_id: user.id,
		ctime: prlink.ctime,
	};

	let _ = validate_prparam(prp.to_string(), &prlink_user_info)?;
	Ok((user, prlink))
}

async fn send_email(url: &str, to: &str) -> Result<()> {
	if !is_valid_email(to) {
		return Err(Error::EmailAddress(
			lettre::address::AddressError::InvalidUser,
		));
	}

	// create email
	// region:    --- tmpl
	let mut handlebars = handlebars::Handlebars::new();
	let config = rpc_config();
	handlebars.register_template_file(
		"email-tmpl",
		format!("{}/email-tmpl.html", config.WEB_FOLDER),
	)?;

	let mut data = HashMap::new();
	data.insert("url", url);
	let html = handlebars.render("email-tmpl", &data)?;
	// endregion: --- tmpl

	let email = Message::builder()
		.from(format!("From <{}>", config.EMAIL_FROM).parse()?)
		.to(format!("To <{to}>").parse()?)
		.subject("Reset password")
		.multipart(
			lettre::message::MultiPart::alternative().singlepart(
				lettre::message::SinglePart::builder()
					.content_type(ContentType::TEXT_HTML)
					.body(html),
			),
		)?;

	// create SMTP connector(connect to MailHog)
	// skip TLS
	let mailer = SmtpTransport::builder_dangerous(config.EMAIL_HOST.as_str())
		// MailHog SMTP port
		.port(config.EMAIL_PORT)
		.build();

	// send email
	mailer.send(&email)?;

	Ok(())
}

fn is_valid_email(email: &str) -> bool {
	let email_regex =
		Regex::new(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$").unwrap();
	email_regex.is_match(email)
}
