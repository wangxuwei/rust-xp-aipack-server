use crate::error::Result;
use crate::middleware::mw_auth::CtxW;
use axum::extract::State;
use axum::Json;
use lib_core::model::user_org::UserOrgBmc;
use lib_core::model::ModelManager;
use serde_json::{json, Value};

#[axum::debug_handler]
pub async fn api_user_org_handler(
	ctx: CtxW,
	State(mm): State<ModelManager>,
) -> Result<Json<Value>> {
	let ctx = ctx.0;
	let org_id = ctx.org_id();
	match org_id {
		Some(org_id) => {
			let user_id = ctx.user_id();
			let user_org =
				UserOrgBmc::get_by_user_org(&ctx, &mm, user_id, org_id).await?;

			ctx.add_org_access_if_need(&mm, org_id).await?;
			let accesses = ctx.org_accesses(org_id);
			// Create the success body.
			let body = Json(json!({
				"result": {
					"org": {
						"id": org_id,
						"role": user_org.role,
						"accesses": accesses
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
