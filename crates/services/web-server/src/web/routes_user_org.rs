use axum::routing::get;
use axum::Router;
use lib_core::model::ModelManager;
use lib_web::handlers::handlers_user_org;

// Axum router for '/api/user-context'
pub fn routes(mm: ModelManager) -> Router {
	Router::new()
		.route(
			"/api/user-org-context",
			get(handlers_user_org::api_user_org_handler),
		)
		.with_state(mm)
}
