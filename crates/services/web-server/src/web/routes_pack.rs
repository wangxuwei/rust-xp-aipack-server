use axum::extract::DefaultBodyLimit;
use axum::routing::{get, post};
use axum::{middleware, Router};
use lib_core::model::ModelManager;
use lib_web::handlers::handlers_pack;
use lib_web::routes::size_error_handler;
use tower_http::limit::RequestBodyLimitLayer;

pub fn routes(mm: ModelManager) -> Router {
	Router::new()
		.route(
			"/api/upload_pack",
			post(handlers_pack::api_upload_pack_handler),
		)
		.layer(DefaultBodyLimit::disable())
		.layer(RequestBodyLimitLayer::new(5 * 1024 * 1024))
		.layer(middleware::map_response(size_error_handler))
		.route(
			"/api/download_pack/{id}",
			get(handlers_pack::api_download_pack_handler),
		)
		.with_state(mm)
}
