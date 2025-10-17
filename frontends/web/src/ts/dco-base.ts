// <origin src="https://raw.githubusercontent.com/BriteSnow/cloud-starter/master/frontends/web/src/ts/dco-base.ts" />
// (c) 2019 BriteSnow, inc - This code is licensed under MIT license (see LICENSE for details)

import { rpc_invoke } from "common/rpc";
import { hub } from "dom-native";

export const dcoHub = hub("dcoHub");

export class BaseDco<E, F> {
	#cmd_suffix: string;
	#plural?: string;
	#orgScoped?: boolean;

	get cmd_suffix() {
		return this.#cmd_suffix;
	}
	get plural() {
		return this.#plural ? this.#plural : `${this.#cmd_suffix}s`;
	}
	get orgScoped() {
		return this.#orgScoped;
	}

	constructor(cmd_suffix: string, plural?: string, orgScoped?: boolean) {
		this.#cmd_suffix = cmd_suffix;
		this.#plural = plural;
		this.#orgScoped = orgScoped;
	}

	//#region    ---------- Utils ----------

	//#endregion ---------- /Utils ----------
	async get(id: number): Promise<E> {
		const result = await rpc_invoke(`get_${this.#cmd_suffix}`, { id }, undefined, this.#orgScoped);
		if (result.data) {
			return result.data;
		} else {
			throw result;
		}
	}

	async list(qo?: F): Promise<E[]> {
		const result = await rpc_invoke(`list_${this.plural}`, { ...qo }, undefined, this.#orgScoped);
		if (result.data) {
			return result.data;
		} else {
			throw result;
		}
	}

	async create(data: any): Promise<E> {
		const result = await rpc_invoke(`create_${this.#cmd_suffix}`, { data }, undefined, this.#orgScoped);
		if (result.data) {
			dcoHub.pub(this.#cmd_suffix, "create", result.data);
			return result.data;
		} else {
			throw result;
		}
	}

	async update(id: number, data: Partial<E>): Promise<any> {
		const result = await rpc_invoke(`update_${this.#cmd_suffix}`, { id, data }, undefined, this.#orgScoped);
		if (result.data) {
			dcoHub.pub(this.#cmd_suffix, "update", result.data);
			return result.data;
		} else {
			throw result;
		}
	}

	async delete(id: number): Promise<any> {
		const result = await rpc_invoke(`delete_${this.#cmd_suffix}`, { id }, undefined, this.#orgScoped);
		if (result.data) {
			dcoHub.pub(this.#cmd_suffix, "delete", result.data);
			return result.data;
		} else {
			throw result;
		}
	}
}
