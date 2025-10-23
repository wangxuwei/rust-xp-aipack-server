use axum::extract::DefaultBodyLimit;
use axum::routing::post;
use axum::{middleware, Router};
use lib_core::model::ModelManager;
use lib_web::handlers::handlers_org;
use lib_web::routes::size_error_handler;
use tower_http::limit::RequestBodyLimitLayer;

// Axum router for '/api/user-context'
pub fn routes(mm: ModelManager) -> Router {
	Router::new()
		.route(
			"/api/upload_org_avatar",
			post(handlers_org::api_upload_avatar_handler),
		)
		.layer(DefaultBodyLimit::disable())
		.layer(RequestBodyLimitLayer::new(5 * 1024 * 1024))
		.layer(middleware::map_response(size_error_handler))
		.with_state(mm)
}
