## Drawer component relationships for frontends

These are the best practice for many to many relation maintain on frontend side with a drawer if we need.
let's say the Entity is "UserOrg", so it is relationshitp for "User" and "Org", which is many to many, and it is base on "Org", so it would insert users and delete users for org

### implement api in DCO

````ts
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



````
- the both functions "get_users_by_org" and "save_users_to_org" is for query and save relationship, put it into frontends/web/src/dco-org.ts, if there is no dco-org.ts, create the file, and register in dcos.ts, if not, then append the both functions into ```class OrgDco```
- do not make the full codes to replace, just put the codes which need into frontends/web/src/dco-org.ts


### Implement the ui drawer for org to add user relationship

````ts
import { BaseInputElement } from '@dom-native/ui/src/d-base-input.js';
import { User } from 'bindings/User.js';
import { adoptStyleSheets, all, css, customElement, onEvent } from 'dom-native';
import { DrDrawer } from 'drawer/dr-drawer.js';
import { asNum } from 'utils-min';
import { Org } from '../bindings/Org.js';
import { orgDco, userDco } from '../dcos.js';

const _compCss = css`
	::slotted(.dialog-content) {
		display: grid;
		grid-auto-flow: row;
		grid-auto-rows: min-content; 
		grid-gap: 1rem;
	}
`;

@customElement('dr-org-users')
export class DrOrgUsers extends DrDrawer {
	#orgId?: number;

	set orgId(v: number | undefined) {
		this.#orgId = v;
		this.refresh();
	}

	constructor() {
		super();
		adoptStyleSheets(this, _compCss);
	}

	//#region    ---------- Events ---------- 
	@onEvent('pointerup', '.do-ok')
	async doOk() {
		const itemIds = all(this, "d-check[checked]").map((f:HTMLElement) => {
			let checkbox = f as BaseInputElement;
			return asNum(checkbox.value!);
		})!;
		await orgDco.saveUsersToOrg(this.#orgId!, itemIds as number[]);
		super.doOk();
	}
	//#endregion ---------- /Events ---------- 

	//#region    ---------- Lifecycle ---------- 
	async refresh() {
		if(this.#orgId){
			const org = await orgDco.get(this.#orgId!);
			const users = await userDco.list();
			const selectedUsers = await orgDco.getUsersByOrg(this.#orgId);
			this.innerHTML = _render(org, users, selectedUsers);
		}
	}
	//#endregion ---------- /Lifecycle ---------- 

}

function _render(org: Org, users: User[], selectedUsers: User[]) {
	const title = 'Organization users';
	let selUser = new Set(selectedUsers.map((s) => s.id));
	const rows = users.map(user => `
		<div class="ui-drawer-item" data-id="${user.id}">
			<d-check value="${user.id}" ${selUser.has(user.id) ? 'checked' : ''}></d-check>
			<label>${user.username}</label>
		</div>
	`).join('');

	return `
		<div slot="title">${title}</div>

		<div class="drawer-content">
			${rows}
		</div>
		
		<button slot="footer" class="do-cancel">CANCEL</button>
		<button slot="footer" class="do-ok medium">OK</button>
	`;
}

````

- create the ui drawer in views/dr-org-users.ts, and add styles in views/dr-org-users.pcss if need


### Buttons and Events to trigger

````ts
	... other ignored codes
	@onEvent('click', '.btn-manage-users')
	onManageUsersClick(evt: MouseEvent & OnEvent) {
		const rowEl = evt.selectTarget.closest('.row') as HTMLElement;
		const orgId = asNum(rowEl.dataset.id);
		if (!isEmpty(orgId)) {
			this.showOrgUsersDrawer(orgId!);
		}
	}
		... other ignored codes


	private showOrgUsersDrawer(orgId?: number) {
		const drawer = document.createElement('dr-org-users') as DrOrgUsers;
		drawer.orgId = orgId;
		this.appendChild(drawer);
	}

function _render(){
	`
	<div class="cell actions">
		... other ignored codes
		<button class="btn-manage-users prime">Manage Users</button>
		... other ignored codes
	</div>
	`
}
	
````

- then in v-orgs.ts, add the event handler "onManageUsersClick"
- and add private function "showOrgUsersDrawer" for event handlers to call
- then in the function "_render", add the button ".btn-manage-users" in the div "cell actions"
- do not make the full codes to replace, just put the codes which need into frontends/web/views/v-orgs.ts
