import { OrgAccess } from "./bindings/OrgAccess.js";
import { ORoleName } from "./bindings/ORoleName.js";
import { apiPrx } from "./conf.js";
import { webGet } from "./web-request.js";

export interface UserOrgContext {
	id: number;
	role: ORoleName;
	accesses: OrgAccess[];
}

let _uoc: UserOrgContext | null;

export async function getUserOrgContext(orgId: number): Promise<UserOrgContext | null> {
	const uocResult = await webGet(apiPrx + "/user-org-context", {
		params: { org_id: orgId },
		headers: { "content-type": "application/json" },
	});
	_uoc = uocResult?.result?.org;
	return uocResult && uocResult.result ? uocResult.result.org : null;
}

export function getCurrentOrgCtx(): UserOrgContext | null {
	return _uoc;
}

export function hasOrgAccess(...accesses: OrgAccess[]): boolean {
	if (!_uoc?.id) {
		return false;
	}
	for (const a of accesses) {
		if (_uoc.accesses?.indexOf(a) > -1) {
			return true;
		}
	}
	return false;
}
