import { OrgAccess } from './bindings/OrgAccess.js';
import { ORoleName } from './bindings/ORoleName.js';
import { webGet } from './web-request.js';

export interface UserOrgContext {
	id: number;
	role: ORoleName,
	accesses: OrgAccess[];
}

let _uoc:UserOrgContext | null;

export async function getUserOrgContext(): Promise<UserOrgContext | null> {
	const uocResult = await webGet('/api/user-org-context');
	_uoc = uocResult?.result?.org;
	return (uocResult && uocResult.result) ? uocResult.result.org: null;
}

export function hasOrgAccess(...accesses:OrgAccess[]): boolean {
	if(!_uoc?.id){
		return false;
	}
	for(const a of accesses){
		if(_uoc.accesses?.indexOf(a) > -1){
			return true;
		}
	}
	return false;
}