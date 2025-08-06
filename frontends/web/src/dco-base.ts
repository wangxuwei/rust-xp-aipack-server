// <origin src="https://raw.githubusercontent.com/BriteSnow/cloud-starter/master/frontends/web/src/ts/dco-base.ts" />
// (c) 2019 BriteSnow, inc - This code is licensed under MIT license (see LICENSE for details)

import { rpc_invoke } from 'common/rpc';


export class BaseDco<E, F> {
	#cmd_suffix: string;
	#plural?: string;
	get cmd_suffix() { return this.#cmd_suffix; }
	get plural() { return this.#plural ? this.#plural : `${this.#cmd_suffix}s` }

	constructor(cmd_suffix: string, plural?: string) {
		this.#cmd_suffix = cmd_suffix;
		this.#plural = plural;
	}

	//#region    ---------- Utils ---------- 

	//#endregion ---------- /Utils ---------- 
	async get(id: number): Promise<E> {
		const result = await rpc_invoke(`get_${this.#cmd_suffix}`, { id });
		return result.data;
	}

	async list(qo?: F): Promise<E[]> {
		const result = await rpc_invoke(`list_${this.plural}`, { ...qo });
		return result.data;
	}

	async create(data: any): Promise<E> {
		const result = await rpc_invoke(`create_${this.#cmd_suffix}`, { data });
		const entity = result.data;
		return entity;
	}

	async update(id: number, data: Partial<E>): Promise<any> {
		const result = await rpc_invoke(`update_${this.#cmd_suffix}`, { id, data });
		const entity = result.data;
		return entity;
	}

	async delete(id: number): Promise<boolean> {
		const result = await rpc_invoke(`delete_${this.#cmd_suffix}`, { id });
		return true;
	}
}