import { QueryOptions } from "common/query_options";
import { rpc_invoke } from "common/rpc";
import { User } from "../bindings/User";
import { BaseDco } from "./dco-base";

export class UserDco extends BaseDco<User, QueryOptions<User>> {
	constructor() {
		super("user");
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
