use axum::handler::HandlerWithoutStateExt;
use axum::http::{StatusCode, Uri};
use axum::response::{Html, IntoResponse};
use axum::routing::{any_service, MethodRouter};
use std::ffi::OsStr;
use std::fs::read_to_string;
use std::path::Path;
use tower_http::services::ServeDir;

// Note: Here we can just return a MethodRouter rather than a full Router
//       since ServeDir is a service.
pub fn serve_dir(web_folder: &'static String) -> MethodRouter {
	let path = format!("{}{}", web_folder, "./index.html");
	let handle_404 = async move |uri: Uri| {
		match get_extension(uri.path()) {
			Some(_) => {
				(StatusCode::NOT_FOUND, "Resource not found.").into_response()
			}
			// for no extesion and render in client side
			None => (StatusCode::OK, Html(read_to_string(&path).unwrap()))
				.into_response(),
		}
	};

	// use .fallback instead of .not_found_service, this way, can handle status code
	any_service(ServeDir::new(web_folder).fallback(handle_404.into_service()))
}

fn get_extension(file_name: &str) -> Option<&str> {
	Path::new(file_name).extension().and_then(OsStr::to_str)
}
