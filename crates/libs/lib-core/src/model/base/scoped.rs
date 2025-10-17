use crate::{
	ctx::Ctx,
	model::{base::DbBmc, Error, Result},
};
use modql::{field::SeaFields, SIden};
use sea_query::{
	DeleteStatement, Expr, IntoIden, SeaRc, SelectStatement, SimpleExpr,
	UpdateStatement, Value,
};

pub trait QueryCondition {
	fn and_where(&mut self, expr: SimpleExpr) -> &mut Self;
}

impl QueryCondition for SelectStatement {
	fn and_where(&mut self, expr: SimpleExpr) -> &mut Self {
		self.and_where(expr)
	}
}

impl QueryCondition for UpdateStatement {
	fn and_where(&mut self, expr: SimpleExpr) -> &mut Self {
		self.and_where(expr)
	}
}

impl QueryCondition for DeleteStatement {
	fn and_where(&mut self, expr: SimpleExpr) -> &mut Self {
		self.and_where(expr)
	}
}

//#region    ---------- Store Scoped Helper Methods ----------
#[allow(unused)]
pub fn scope_data<MC>(ctx: &Ctx, fields: &mut SeaFields) -> Result<()>
where
	MC: DbBmc,
{
	if MC::has_scoped() {
		let org_id = ctx.org_id();
		if org_id.is_none() {
			return Err(Error::AccessFail(format!(
				"Fail to scope data {fields:?} for table {}, require CTX to have .org_id, but not found in ctx"
			, MC::TABLE)));
		}

		let org_field = fields
			.clone()
			.into_iter()
			.find(|p| p.iden == SeaRc::new(SIden("org_id")));

		// If we have a data id make sure the org_id match, and if not present in data, set it
		if let Some(org_field) = org_field {
			let data_org_id = org_field.sea_value();
			let match_id = data_org_id
				.map(|f| *f == Value::BigInt(org_id))
				.unwrap_or(false);
			if !match_id {
				return Err(Error::AccessFail(format!(
				"Fail to scope data CTX.org_id {org_id:?} does not match column the data org_id {data_org_id:?}"
			)));
			}
		}
	}

	Ok(())
}

#[allow(unused)]
pub fn scope_for_query<MC, S, C>(
	ctx: &Ctx,
	query: &mut S,
	column: Option<C>,
) -> Result<()>
where
	C: IntoIden + 'static,
	S: QueryCondition,
	MC: DbBmc,
{
	if MC::has_scoped() {
		let org_id = ctx.org_id();
		if org_id.is_none() {
			return Err(Error::AccessFail(
				"Fail to scope query, require CTX to have .org_id, but not found in ctx"
			.to_string()));
		}

		let org_id = org_id.unwrap();
		let col = if let Some(c) = column {
			c.into_iden()
		} else {
			SIden("org_id").into_iden()
		};
		query.and_where(Expr::col(col).eq(org_id));
	}
	Ok(())
}

//#endregion ---------- /Store Scoped Helper Methods ----------
