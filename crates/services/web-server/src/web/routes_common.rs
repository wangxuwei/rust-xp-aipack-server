use axum::routing::get;
use axum::Router;
use lib_core::model::ModelManager;
use lib_web::handlers::handlers_common;

// Axum router for '/api/user-context'
pub fn routes(mm: ModelManager) -> Router {
	Router::new()
		.route(
			"/api/avatar/{*file_path_p}",
			get(handlers_common::api_get_avatar),
		)
		.with_state(mm)
}
