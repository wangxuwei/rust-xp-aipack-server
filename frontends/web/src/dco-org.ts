import { Org } from "bindings/Org";
import { User } from "bindings/User";
import { QueryOptions } from "common/query_options";
import { rpc_invoke } from "common/rpc";
import { BaseDco, dcoHub } from "./dco-base";

export class OrgDco extends BaseDco<Org, QueryOptions<Org>> {
  constructor() {
    super("org");
  }

  async renameOrg(id: number, name: string): Promise<void> {
    const result = await rpc_invoke(`rename_org`, { id, name });
    if (typeof result.data != "undefined") {
      dcoHub.pub(this.cmd_suffix, "rename", result.data);
      return result.data;
    } else {
      throw result;
    }
  }

  async searchUsersForOrg(id: number, username: string): Promise<User[]> {
    const result = await rpc_invoke(`search_users_for_org`, {
      id,
      username,
    });
    if (result.data) {
      return result.data;
    } else {
      throw result;
    }
  }

  async getUsersByOrg(id: number): Promise<User[]> {
    const result = await rpc_invoke(`get_users_by_org`, { id });
    if (result.data) {
      return result.data;
    } else {
      throw result;
    }
  }

  async addUsersToOrg(org_id: number, user_ids?: number[]): Promise<boolean> {
    const result = await rpc_invoke(`add_users_to_org`, { org_id, user_ids });
    if (result.data) {
      return result.data;
    } else {
      throw result;
    }
  }

  async removeUsersFromOrg(
    org_id: number,
    user_ids?: number[]
  ): Promise<boolean> {
    const result = await rpc_invoke(`remove_users_from_org`, {
      org_id,
      user_ids,
    });
    if (result.data) {
      return result.data;
    } else {
      throw result;
    }
  }
}
