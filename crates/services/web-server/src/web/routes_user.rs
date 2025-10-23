use axum::extract::DefaultBodyLimit;
use axum::routing::{get, post};
use axum::{middleware, Router};
use lib_core::model::ModelManager;
use lib_web::handlers::handlers_user;
use lib_web::routes::size_error_handler;
use tower_http::limit::RequestBodyLimitLayer;

// Axum router for '/api/user-context'
pub fn routes(mm: ModelManager) -> Router {
	Router::new()
		.route(
			"/api/upload_user_avatar",
			post(handlers_user::api_upload_avatar_handler),
		)
		.layer(RequestBodyLimitLayer::new(5 * 1024 * 1024))
		.layer(DefaultBodyLimit::disable())
		.layer(middleware::map_response(size_error_handler))
		.route("/api/user-context", get(handlers_user::api_user_handler))
		.route(
			"/api/update-pwd",
			post(handlers_user::api_user_update_pwd_handler),
		)
		.route("/api/prlink", post(handlers_user::api_user_prlink))
		.route("/api/check-prp", post(handlers_user::api_prp_check_prlink))
		.route("/api/reset-pwd", post(handlers_user::api_prp_reset_pwd))
		// page
		.route("/pwd-reset", get(handlers_user::pwd_reset))
		.with_state(mm)
}
