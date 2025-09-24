## Sub inner view for some entities

let's say we have Org, but Org will have org users. first Org view will have table v-orgs, then we can have a sub inner view named "v-org-users".
then we can implement below:

### implement api in DCO

````ts
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
			dcoHub.pub(this.cmd_suffix, 'add_user', result.data);
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
			dcoHub.pub(this.cmd_suffix, 'remove_user', result.data);
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


for event in v-org
```

  //#region    ---------- Events ----------
  @onEvent("click", ".btn-manage-users")
  onManageUsersClick(evt: MouseEvent & OnEvent) {
    const rowEl = evt.selectTarget.closest(".row") as HTMLElement;
    const orgId = asNum(rowEl.dataset.id);
    if (!isEmpty(orgId)) {
      pushPath(`/orgs/users/${orgId}`);
    }
  }

```


- create the ui inner view in views/v-org-users.ts, and add styles in views/v-org-users.pcss if need
- then in v-orgs.ts, add the event handler "onManageUsersClick", which will change the url like "[host]/orgs/1/users", the 1 mean the org id
- then in the function "_render", add the button ".btn-manage-users" in the div "cell actions"
- do not make the full codes to replace, just put the codes which need into frontends/web/views/v-orgs.ts


#### In v-org-user
```
import { pathAsNum } from "common/route.js";
import { BaseViewElement } from "common/v-base.js";
import { orgDco } from "dcos.js";
import { OnEvent, customElement, onEvent, onHub } from "dom-native";
import { asNum, isEmpty } from "utils-min";
import { Org } from "../bindings/Org.js";
import { User } from "../bindings/User.js";
import { DgOrgUserAdd } from "./dg-org-user-add.js";

@customElement("v-org-users")
export class OrgUsersView extends BaseViewElement {
  #orgId: number | null = null;

  //#region    ---------- Events ----------
  @onEvent("click", "button.add")
  onAddClick() {
    this.showUserAddDialog();
  }

  @onEvent("click", ".btn-delete")
  onDeleteClick(evt: MouseEvent & OnEvent) {
    const rowEl = evt.selectTarget.closest(".row") as HTMLElement;
    const userId = asNum(rowEl.dataset.id);
    if (!isEmpty(userId) && this.#orgId) {
      // Remove user from org
      orgDco.removeUsersFromOrg(this.#orgId, [userId!]).then(() => this.refresh());
    }
  }
  //#endregion ---------- /Events ----------

  //#region    ---------- Hub Events ----------
  @onHub("dcoHub", "org", "add_user,remove_user")
  onUserOrgChange() {
    this.refresh();
  }
  //#endregion ---------- /Hub Events ----------

  //#region    ---------- Lifecycle ----------
  init() {
    super.init();
    this.#orgId = pathAsNum(2);
    this.refresh();
  }

  async refresh() {
    if (this.#orgId) {
      const org = await orgDco.get(this.#orgId);
      const users = await orgDco.getUsersByOrg(this.#orgId);
      this.innerHTML = _render(org, users);
    } else {
      this.innerHTML = _renderEmpty();
    }
  }
  //#endregion ---------- /Lifecycle ----------

  private showUserAddDialog() {
    const dialog = document.createElement("dg-org-user-add") as DgOrgUserAdd;
		dialog.orgId = this.#orgId;
    this.appendChild(dialog);
  }
}

function _renderEmpty() {
  return "not exist";
}

function _render(org: Org, users: User[]) {
  const rows = users
    .map(
      (user) => `
		<div class="row" data-id="${user.id}">
			<div class="cell">${user.username}</div>
			<div class="cell actions">
				<button class="btn-delete danger">Remove</button>
			</div>
		</div>
	`
    )
    .join("");

  return `
		<div class="org-info-section">
			<div class="card">
				<div class="header">
					<h3>Organization</h3>
				</div>
				<section>
					<div class="info-item">
						<span class="label">Name:</span>
						<span class="value">${org.name}</span>
					</div>
					<div class="info-item">
						<span class="label">Kind:</span>
						<span class="value">${org.kind}</span>
					</div>
				</div>
			</div>
		</div>
		<div class="users-table-section">
			<div class="section-header">
				<h3>Users</h3>
			</div>
			<div class="actions">
				<button class="add">Add User</button>
			</div>
			<div class="table-container">
				<div class="ui-table">
					<div class="thead row">
						<div class="cell">Username</div>
						<div class="cell actions">Actions</div>
					</div>
					<div class="tbody">
						${rows}
					</div>
				</div>
			</div>
		</div>
	`;
}
```
- on the left side, is .ui-card, which is for org info, for org just name
- on the right side, 2 sections as well, top and bottoml
- top will have a button "Add user"
- bottom will have .ui-table, which have 2 columns, the col is for the username, and another is actions button delete
- for the styles make sure do it in v-org-users.pcss.



