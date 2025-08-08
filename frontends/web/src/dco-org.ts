import { Org } from 'bindings/Org';
import { User } from 'bindings/User';
import { QueryOptions } from 'common/query_options';
import { rpc_invoke } from 'common/rpc';
import { BaseDco } from './dco-base';


export class OrgDco extends BaseDco<Org, QueryOptions<Org>> {
	constructor() { super('org') }

	async getUsersByOrg(id: number): Promise<User[]> {
		const result = await rpc_invoke(`get_users_by_org`, { id });
		if (result.data) {
			return result.data;
		} else {
			throw result;
		}
	}

	async saveUsersToOrg(org_id: number, user_ids?: number[]): Promise<boolean> {
		const result = await rpc_invoke(`save_users_to_org`, { org_id, user_ids });
		if (result.data) {
			return result.data;
		} else {
			throw result;
		}
	}
}

