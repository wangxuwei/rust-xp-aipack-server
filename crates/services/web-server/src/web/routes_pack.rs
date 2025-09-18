use axum::routing::{get, post};
use axum::Router;
use lib_core::model::ModelManager;
use lib_web::handlers::handlers_pack;

pub fn routes(mm: ModelManager) -> Router {
	Router::new()
		.route(
			"/api/upload_pack",
			post(handlers_pack::api_upload_pack_handler),
		)
		.route(
			"/api/download_pack/{id}",
			get(handlers_pack::api_download_pack_handler),
		)
		.with_state(mm)
}
