use crate::model::acs::{Access, GlobalAccess};
use crate::model::{Error, Result};
use crate::{ctx::Ctx, model::ModelManager};
use serde_json::{Map, Value};
use sqlx::types::Json;

pub struct MethodRef {
	pub table: String,
	pub method: String,
	pub struct_name: String,
}

pub async fn check_access(
	ctx: &Ctx,
	mm: &ModelManager,
	accesses: Vec<Access>,
	extra: Map<String, Value>,
	method_ref: MethodRef,
) -> Result<()> {
	let user_id = ctx.user_id();
	let mut pass = false;
	if ctx.has_access(&GlobalAccess::Sys) {
		pass = true;
	}

	let data = extra.get("data");
	let first_entity_id = get_entity_id(data);
	if !pass {
		let mut entity = None::<serde_json::Value>;
		for access in &accesses {
			match access {
				Access::Global(ga) => {
					if ctx.has_access(ga) {
						pass = true;
						break;
					}
				}
				Access::Org(oa) => {
					let org_id = ctx.org_id().or_else(|| {
						if method_ref.table == "org" {
							first_entity_id
						} else {
							None
						}
					});

					if let Some(org_id) = org_id {
						ctx.add_org_access_if_need(mm, org_id)
							.await
							.map_err(|_| Error::OrgAddRole)?;
						if ctx.has_org_access(org_id, oa) {
							pass = true;
						}
						break;
					}
				}
				Access::Entity(ea) => {
					let prop_name = ea.get_prop();

					// // If we have entity id, we fetch and check
					if let Some(entity_id) = first_entity_id {
						if entity.is_none() {
							entity = get_entity_by_id(
								mm,
								method_ref.table.as_str(),
								entity_id,
							)
							.await
							.ok();
						}

						if let Some(ref entity) = entity {
							if check_entity_prop(user_id, entity, prop_name) {
								pass = true;
								break;
							}
						}
					} else if let Some(data) = data {
						if data.is_object()
							&& check_entity_prop(user_id, data, prop_name)
						{
							pass = true;
							break;
						} else if data.is_array() {
							let arr = data.as_array();
							if let Some(arr) = arr {
								for entity in arr {
									if !check_entity_prop(user_id, entity, prop_name)
									{
										break;
									}
								}
								pass = true;
								break;
							}
						}
					} else {
						let error_str = format!("{}::{} - AccessRequires {ea:?} must be on a method with the entity_id or data as 3rd params.",method_ref.struct_name, method_ref.method);
						return Err(Error::AccessFail(error_str));
					}
				}
			}
		}
	}

	if !pass {
		let error_str = format!(
			r#"User {user_id} does not have the necessary access for "{}::{}", access: [{}]"#,
			method_ref.struct_name,
			method_ref.method,
			accesses
				.iter()
				.map(|a| a.to_string())
				.collect::<Vec<String>>()
				.join(",")
		);
		return Err(Error::AccessFail(error_str));
	}

	Ok(())
}

fn get_entity_id(val: Option<&serde_json::Value>) -> Option<i64> {
	let entity_id = match val {
		Some(serde_json::Value::Object(obj)) => {
			obj.get("id").map(|f| f.as_i64().unwrap())
		}
		Some(serde_json::Value::Number(id)) => id.as_i64(),
		Some(serde_json::Value::Array(obj)) => get_entity_id(obj.first()),
		_ => None,
	};
	entity_id
}

async fn get_entity_by_id(
	mm: &ModelManager,
	table: &str,
	id: i64,
) -> Result<serde_json::Value> {
	let sql =
		format!("SELECT row_to_json(\"{table}\") FROM \"{table}\" WHERE id = $1");
	let query = sqlx::query_scalar::<_, Json<Value>>(&sql).bind(id);
	let json_entity = query
		.fetch_one(mm.dbx().db())
		.await
		.map_err(|_| Error::AccessGetEntity)?;
	Ok(json_entity.0)
}

fn check_entity_prop(user_id: i64, entity: &Value, prop_name: &str) -> bool {
	if let Some(entity) = entity.as_object() {
		let val = entity.get(prop_name).and_then(|e| e.as_i64());
		if let Some(val_id) = val {
			if user_id == val_id {
				return true;
			}
		}
	}
	false
}
