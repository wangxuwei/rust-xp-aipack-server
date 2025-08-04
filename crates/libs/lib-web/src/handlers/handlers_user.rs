use crate::error::Result;
use crate::middleware::mw_auth::CtxW;
use axum::extract::State;
use axum::Json;
use lib_core::model::user::{UserBmc, UserForLogin};
use lib_core::model::ModelManager;
use serde_json::{json, Value};

#[axum::debug_handler]
pub async fn api_user_handler(
	ctx: Result<CtxW>,
	State(mm): State<ModelManager>,
) -> Result<Json<Value>> {
	let ctx = ctx.ok().map(|ctx| ctx.0);
	match ctx {
		Some(ctx) => {
			let user_id = ctx.user_id();
			let user: UserForLogin = UserBmc::get(&ctx, &mm, user_id).await?;
			let user_id = user.id;

			// Create the success body.
			let body = Json(json!({
				"result": {
					"user": {
						"id": user_id,
						"username": user.username
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
