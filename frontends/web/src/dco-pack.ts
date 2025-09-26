import { Pack } from "bindings/Pack";
import { PackVersion } from "bindings/PackVersion";
import { QueryOptions } from "common/query_options";
import { request_upload, rpc_invoke } from "common/rpc";
import { BaseDco, dcoHub } from "./dco-base";

export class PackDco extends BaseDco<Pack, QueryOptions<Pack>> {
	constructor() {
		super("pack");
	}

	async uploadPack(formData: any): Promise<any> {
		const result = await request_upload(`upload_pack`, formData);
		if (result.success) {
			dcoHub.pub(this.cmd_suffix, "upload_pack_version", result);
			return result.id;
		} else {
			throw result;
		}
	}
	// List all versions for a specific pack
	async listPackVersions(pack_id: number): Promise<PackVersion[]> {
		const result = await rpc_invoke(`list_pack_versions`, { filters: { pack_id } });
		if (result.data) {
			return result.data;
		} else {
			throw result;
		}
	}

	// Delete a specific pack version
	async deletePackVersion(versionId: number): Promise<void> {
		const result = await rpc_invoke(`delete_pack_version`, { id: versionId });
		if (result.data) {
			return result.data;
		} else {
			throw result;
		}
	}
}
