use crate::config::rpc_config;
use crate::error::{Error, Result};
use axum::body::Body;
use axum::extract::Path;
use axum::http::{header, Response, StatusCode};
use axum::response::IntoResponse;
use std::path::Path as StdPath;
use tokio::fs::File;

pub async fn api_get_avatar(
	Path(file_path_p): Path<String>,
) -> Result<impl IntoResponse> {
	let config = rpc_config();
	let store_dir = StdPath::new(&config.STORE_DIR);

	let image_path = store_dir.join(file_path_p);
	if image_path.exists() {
		let file = File::open(&image_path)
			.await
			.map_err(|_| Error::FileDownload)?;
		let stream = tokio_util::io::ReaderStream::new(file);
		let body = Body::from_stream(stream);
		let file_name = image_path.file_name().unwrap().to_str().unwrap();

		let headers = [
			(
				header::CONTENT_TYPE,
				format!(
					"image/{}; charset=utf-8",
					if file_name.to_lowercase().ends_with("png") {
						"png"
					} else {
						"jpeg"
					}
				),
			),
			(
				header::CONTENT_DISPOSITION,
				format!(
					"attachment; filename=\"{}\"",
					image_path.file_name().unwrap().to_str().unwrap()
				),
			),
		];

		Ok((headers, body).into_response())
	} else {
		Ok(Response::builder()
			.status(StatusCode::NOT_FOUND)
			.body(Body::from("404 Not Found"))
			.unwrap())
	}
}
