use crate::config::rpc_config;
use crate::error::{Error, Result};
use crate::middleware::mw_auth::CtxW;
use axum::extract::{Multipart, State};
use axum::Json;
use lib_core::model::org::{OrgBmc, OrgForUpdate};
use lib_core::model::ModelManager;
use serde_json::{json, Value};
use std::path::Path;
use tokio::fs::{create_dir_all, File};
use tokio::io::AsyncWriteExt;

pub async fn api_upload_avatar_handler(
	State(mm): State<ModelManager>,
	ctx: Result<CtxW>,
	mut multipart: Multipart,
) -> Result<Json<Value>> {
	let ctx = ctx?.0;
	let config = rpc_config();
	let upload_dir = Path::new(&config.STORE_DIR);

	let mut file_content = None;
	let mut org_id = None;

	while let Ok(Some(field)) = multipart.next_field().await {
		if let Some("org_id") = field.name() {
			org_id = field.text().await.ok().and_then(|f| f.parse::<i64>().ok());
		} else if let Some("file") = field.name() {
			file_content =
				Some(field.bytes().await.map_err(|_| Error::FileNotFound)?);
		}
	}

	let content =
		file_content.ok_or(Error::MissingRequiredField("file".to_string()))?;

	let org_id = org_id.ok_or(Error::MissingRequiredField("org_id".to_string()))?;
	let org = OrgBmc::get(&ctx, &mm, org_id).await?;

	let upload_path = upload_dir.join("orgs").join(org.uuid.to_string());
	if !upload_path.exists() {
		create_dir_all(&upload_path).await?;
	}

	let file_path_name = "avatar.jpeg";

	let file_path = upload_path.join(file_path_name);
	// Write file content
	let mut file = File::create(&file_path).await?;
	file.write_all(&content).await?;

	OrgBmc::update(
		&ctx,
		&mm,
		org_id,
		OrgForUpdate {
			profile: Some(file_path_name.to_string()),
			name: None,
			kind: None,
		},
	)
	.await?;

	Ok(Json(json!({
		"result": {
			"success": true,
			"file_path": file_path
		}
	})))
}
