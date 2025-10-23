import { apiPrx, AVATAR_IMAGE } from "common/conf";

// get order format from sort type
export function getOrderBy(sortColumn: string, sortType: string) {
	let orderType = sortType == "desc" ? "!" : "";
	return `${orderType}${sortColumn}`;
}

export function getUserAvatar(uuid: string, profile?: string | null) {
	return profile ? `${apiPrx}/avatar/users/${uuid}/${AVATAR_IMAGE}` : "";
}

export function getOrgAvatar(uuid: string, profile?: string | null) {
	return profile ? `${apiPrx}/avatar/orgs/${uuid}/${AVATAR_IMAGE}` : "";
}
