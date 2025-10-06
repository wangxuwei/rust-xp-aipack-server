// get order format from sort type
export function getOrderBy(sortColumn: string, sortType: string) {
	let orderType = sortType == "desc" ? "!" : "";
	return `${orderType}${sortColumn}`;
}
