use axum::routing::post;
use axum::Router;
use lib_core::model::ModelManager;
use lib_web::handlers::handlers_org;

// Axum router for '/api/user-context'
pub fn routes(mm: ModelManager) -> Router {
	Router::new()
		.route(
			"/api/upload_org_avatar",
			post(handlers_org::api_upload_avatar_handler),
		)
		.with_state(mm)
}
