import { asNum } from "utils-min";
import { getRouteOrgId, pathAt } from "./route";
import { getCurrentOrgId } from "./user-org-ctx";

export const ORG_BASE_PATHS = ["packs"];

export function pathOrgedAt(idx: number): string | null {
	let urlPath = pathAt(idx);
	if (getRouteOrgId()) {
		urlPath = pathAt(idx + 1);
	}
	return urlPath;
}

export function wrapOrgPath(urlPath: string): string {
	let paths = urlPath.split("/");
	const startSlash = urlPath.startsWith("/");
	const startPath = startSlash ? paths[1] : paths[0];
	// org scoped
	if (asNum(startPath)) {
		return urlPath;
	}
	let needWrap = ORG_BASE_PATHS.includes(startPath);
	const prefix = startSlash ? "/" : "";
	let newPath = needWrap ? prefix + getCurrentOrgId() + (startSlash ? "" : "/") + urlPath : urlPath;
	return newPath;
}
