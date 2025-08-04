use axum::routing::get;
use axum::Router;
use lib_core::model::ModelManager;
use lib_web::handlers::handlers_user;

// Axum router for '/api/user-context'
pub fn routes(mm: ModelManager) -> Router {
	Router::new()
		.route("/api/user-context", get(handlers_user::api_user_handler))
		.with_state(mm)
}
