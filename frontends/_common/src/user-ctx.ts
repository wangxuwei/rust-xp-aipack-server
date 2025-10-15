import { GlobalAccess } from "./bindings/GlobalAccess.js";
import { apiPrx } from "./conf.js";
import { webGet, webPost } from "./web-request.js";

export interface UserContext {
	id: number;
	name: string;
	username: string;
	accesses: GlobalAccess[];
}

let _uc: UserContext | null;

export async function login(username: string, pwd: string) {
	const r = await webPost(apiPrx + "/login", { body: { username, pwd } });
	return r;
}

export async function logoff() {
	const r = await webPost(apiPrx + "/logoff", { body: { logoff: true } });
	return r;
}

export function getCurrentUserCtx(): UserContext | null {
	return _uc;
}

export async function getUserContext(): Promise<UserContext | null> {
	const ucResult = await webGet(apiPrx + "/user-context");
	_uc = ucResult?.result?.user;
	return ucResult && ucResult.result ? ucResult.result.user : null;
}

export function hasAccess(...accesses: GlobalAccess[]): boolean {
	if (!_uc?.id) {
		return false;
	}
	for (const a of accesses) {
		if (_uc.accesses?.indexOf(a) > -1) {
			return true;
		}
	}
	return false;
}
