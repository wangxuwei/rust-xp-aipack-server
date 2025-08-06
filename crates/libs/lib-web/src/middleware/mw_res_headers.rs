// region:    --- Modules

use crate::error::Result;
use axum::{
	body::Body,
	http::{header, Request},
	middleware::Next,
	response::Response,
};

// endregion: --- Modules

// region:    --- Middleware

/// Middleware that adds headers to all responses.
pub async fn mw_res_header(request: Request<Body>, next: Next) -> Result<Response> {
	let mut response = next.run(request).await;
	response.headers_mut().insert(
		header::CACHE_CONTROL,
		header::HeaderValue::from_static("no-cache"),
	);
	Ok(response)
}

// endregion: --- Middleware
