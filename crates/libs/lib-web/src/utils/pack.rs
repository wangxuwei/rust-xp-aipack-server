pub struct PackData {
	pub version: String,
	pub namespace: String,
	pub name: String,
}

pub fn parse_pack_file_name(filename: &str) -> Result<PackData, &str> {
	// remove ext
	let base_name = filename
		.strip_suffix(".aipack")
		.ok_or("Invalid file name")?;

	// split @
	let parts: Vec<&str> = base_name.split('@').collect();
	if parts.len() != 2 {
		return Err("Invalid file name format, missing '@'");
	}

	let namespace = parts[0].to_string();
	let rest = parts[1];

	// split -
	let rest_parts: Vec<&str> = rest.splitn(2, '-').collect();
	if rest_parts.len() != 2 {
		return Err("Invalid file name format, missing '-'");
	}

	let name = rest_parts[0].to_string();

	// process version, maybe be start with 'v'
	let version = if rest_parts[1].starts_with('v') {
		rest_parts[1][1..].to_string()
	} else {
		rest_parts[1].to_string()
	};

	Ok(PackData {
		namespace,
		name,
		version,
	})
}
