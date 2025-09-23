## Sub inner view for some entities

let's say we have Org, but Org will have org users. first Org view will have table v-orgs, then we can have a sub inner view named "v-org-users".
then we can implement below:

### implement api in DCO

````ts
import { Org } from 'bindings/Org';
import { User } from 'bindings/User';
import { QueryOptions } from 'common/query_options';
import { rpc_invoke } from 'common/rpc';
import { BaseDco } from './dco-base';


export class OrgDco extends BaseDco<Org, QueryOptions<Org>> {
	constructor() { super('org') }

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



````
- the all four functions above are for query and save relationship, put it into frontends/web/src/dco-org.ts, if there is no dco-org.ts, create the file, and register in dcos.ts, if not, then append the both functions into ```class OrgDco```
- do not make the full codes to replace, just put the codes which need into frontends/web/src/dco-org.ts


### Implement the inner view for org to add user relationship
- create the ui inner view in views/v-org-users.ts, and add styles in views/v-org-users.pcss if need
- then in v-orgs.ts, add the event handler "onManageUsersClick"
- and add private function "showOrgUsersView" for event handlers to call, and will change the url like "[host]/orgs/1/users", the 1 mean the org id
- then in the function "_render", add the button ".btn-manage-users" in the div "cell actions"
- do not make the full codes to replace, just put the codes which need into frontends/web/views/v-orgs.ts


#### In v-org-user
- on the left side, is .ui-card, which is for org info, for org just name
- on the right side, 2 sections as well, top and bottoml
- top will have a button "Add user"
- bottom will have .ui-table, which have 2 columns, the col is for the username, and another is actions button delete
- for the styles make sure do it in v-org-users.pcss.



