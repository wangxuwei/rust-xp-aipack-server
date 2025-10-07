import { apiPrx } from "common/conf";
import { QueryOptions } from "common/query_options";
import { rpc_invoke } from "common/rpc";
import { webPost } from "common/web-request";
import { deepFreeze } from "utils-min";
import { User } from "../bindings/User";
import { BaseDco } from "./dco-base";

export class UserDco extends BaseDco<User, QueryOptions<User>> {
	constructor() {
		super("user");
	}

	// use REST, not use jsonrpc
	async updatePwd(user_id: number, pwd_clear: string, repeat_pwd: string, pwd: string): Promise<void> {
		let response: any = await webPost(`${apiPrx}/update-pwd`, {
			body: { user_id, pwd_clear, repeat_pwd, pwd },
		});
		if (response.error != null) {
			throw response.error;
		} else {
			return deepFreeze(response.result);
		}
	}

	async listAndCount(qo?: QueryOptions<User>): Promise<[User[], number]> {
		const result = await rpc_invoke(`list_and_count_${this.plural}`, { ...qo });
		if (result.data) {
			return result.data;
		} else {
			throw result;
		}
	}
}
