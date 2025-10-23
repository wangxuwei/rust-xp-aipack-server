import { apiPrx } from "common/conf";

// get order format from sort type
export function getOrderBy(sortColumn: string, sortType: string) {
	let orderType = sortType == "desc" ? "!" : "";
	return `${orderType}${sortColumn}`;
}

export function getUserAvatar(uuid: string) {
	return `${apiPrx}/avatar/users/${uuid}/avatar.jpeg`;
}

export function getOrgAvatar(uuid: string) {
	return `${apiPrx}/avatar/orgs/${uuid}/avatar.jpeg`;
}
