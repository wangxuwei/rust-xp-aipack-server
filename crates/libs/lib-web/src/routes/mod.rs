use crate::error::Error;
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};

pub mod routes_static;

pub async fn size_error_handler(res: Response) -> Response {
	if res.status() == StatusCode::PAYLOAD_TOO_LARGE {
		println!("resss: {res:?}");
		return (StatusCode::OK, Error::FileTooLarge).into_response();
	}
	res
}
