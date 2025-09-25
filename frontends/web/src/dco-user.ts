import { QueryOptions } from "common/query_options";
import { User } from "./bindings/User";
import { BaseDco } from "./dco-base";

export class UserDco extends BaseDco<User, QueryOptions<User>> {
	constructor() {
		super("user");
	}
}
