use crate::config::rpc_config;
use crate::error::{Error, Result};
use crate::middleware::mw_auth::CtxW;
use crate::utils::pack::parse_pack_file_name;
use axum::extract::{Multipart, Path, State};
use axum::response::Response;
use axum::Json;
use lib_core::model::org::OrgBmc;
use lib_core::model::pack::PackBmc;
use lib_core::model::pack_version::PackVersionBmc;
use lib_core::model::ModelManager;
use serde_json::{json, Value};
use std::path::Path as StdPath;
use tokio::fs::{create_dir_all, File};
use tokio::io::AsyncWriteExt;

#[axum::debug_handler]
pub async fn api_upload_pack_handler(
	State(mm): State<ModelManager>,
	ctx: Result<CtxW>,
	mut multipart: Multipart,
) -> Result<Json<Value>> {
	let ctx = ctx?.0;
	let config = rpc_config();
	let upload_dir = StdPath::new(&config.PACKS_UPLOAD_DIR);

	if !upload_dir.exists() {
		create_dir_all(upload_dir).await?;
	}

	let mut pack_data = None;
	let mut file_content = None;
	let mut file_name = None;

	while let Ok(Some(field)) = multipart.next_field().await {
		if let Some("file") = field.name() {
			file_name = Some(field.file_name().unwrap_or_default().to_string());
			let parse_data =
				parse_pack_file_name(&file_name.clone().unwrap_or_default())
					.map_err(|_| Error::PackFileParse)?;
			pack_data = Some(parse_data);

			file_content =
				Some(field.bytes().await.map_err(|_| Error::PackFileNotFound)?);
		}
	}

	let pack_data = pack_data.ok_or(Error::PackFileParse)?;

	let pack_name = pack_data.name;
	let version = pack_data.version;
	let org = pack_data.namespace;
	let content =
		file_content.ok_or(Error::MissingRequiredField("file".to_string()))?;

	let file_path_name = file_name.unwrap_or_default();
	let file_path = upload_dir.join(&file_path_name);
	let file_size = content.len() as i64;

	// Write file content
	let mut file = File::create(&file_path).await?;
	file.write_all(&content).await?;

	let pack_version = PackVersionBmc::save_pack_version(
		&ctx,
		&mm,
		org,
		pack_name,
		version,
		file_path.to_string_lossy().to_string(),
		file_size,
	)
	.await?;

	Ok(Json(json!({
		"result": {
			"success": true,
			"id": pack_version.id,
			"pack_id": pack_version.pack_id,
			"file_path": file_path
		}
	})))
}

pub async fn api_download_pack_handler(
	State(mm): State<ModelManager>,
	ctx: Result<CtxW>,
	Path(id): Path<i64>,
) -> Result<Response> {
	let ctx = ctx?.0;
	let pack_version = PackVersionBmc::get(&ctx, &mm, id).await?;
	let pack = PackBmc::get(&ctx, &mm, pack_version.pack_id).await?;
	let org = OrgBmc::get(&ctx, &mm, pack.org_id).await?;

	if !StdPath::new(&pack_version.file_path).exists() {
		return Err(Error::PackFileNotFound);
	}

	let content = tokio::fs::read(&pack_version.file_path).await?;

	let response = axum::response::Response::builder()
		.header("Content-Type", "application/octet-stream")
		.header(
			"Content-Disposition",
			format!(
				"attachment; filename=\"{}@{}-{}.aipack\"",
				org.name.unwrap_or_default(),
				pack.name,
				pack_version.version
			),
		)
		.body(axum::body::Body::from(content))
		.map_err(|_| Error::FileDownload)?;
	Ok(response)
}
