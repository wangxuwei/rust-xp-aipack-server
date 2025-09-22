import { BaseViewElement } from 'common/v-base.js';
import { userDco } from 'dcos.js';
import { OnEvent, customElement, onEvent, onHub } from 'dom-native';
import { asNum, isEmpty } from 'utils-min';
import { User } from '../bindings/User.js';
import { DgUser } from './dg-user.js';

@customElement('v-users')
export class UsersView extends BaseViewElement {

	//#region    ---------- Events ---------- 
	@onEvent('click', '.btn-edit')
	onEditClick(evt: MouseEvent & OnEvent) {
		const rowEl = evt.selectTarget.closest('.row') as HTMLElement;
		const userId = asNum(rowEl.dataset.id);
		if (!isEmpty(userId)) {
			this.showUserDialog(userId!);
		}
	}

	@onEvent('click', '.btn-delete')
	onDeleteClick(evt: MouseEvent & OnEvent) {
		const rowEl = evt.selectTarget.closest('.row') as HTMLElement;
		const userId = asNum(rowEl.dataset.id);
		if (!isEmpty(userId)) {
			userDco.delete(userId!).then(() => this.refresh());
		}
	}

	@onEvent('click', 'button.add')
	onAddClick() {
		this.showUserDialog();
	}
	//#endregion ---------- /Events ----------

	//#region    ---------- Hub Events ---------- 
	@onHub('dcoHub', 'user', 'create,update,delete')
	onUserChange() {
		this.refresh();
	}
	//#endregion ---------- /Hub Events ----------

	//#region    ---------- Lifecycle ---------- 
	init() {
		super.init();
		this.refresh();
	}

	async refresh() {
		const users = await userDco.list();
		this.innerHTML = _render(users);
	}
	//#endregion ---------- /Lifecycle ----------

	//#region    ---------- Private Functions ---------- 
	private showUserDialog(userId?: number) {
		const dialog = document.createElement('dg-user') as DgUser;
		dialog.userId = userId;
		this.appendChild(dialog);
	}
	//#endregion ---------- /Private Functions ----------
}

function _render(users: User[]) {
	const rows = users.map(user => `
		<div class="row" data-id="${user.id}">
			<div class="cell">${user.username}</div>
			<div class="cell actions">
				<button class="btn-edit prime">Edit</button>
				<button class="btn-delete danger">Delete</button>
			</div>
		</div>
	`).join('');

	return `
		<div class="header">
			<button class="add">Add User</button>
		</div>
		<div class="table-container">
			<div class="ui-table">
				<div class="thead row">
					<div class="cell">Username</div>
					<div class="cell">Actions</div>
				</div>
				<div class="tbody">
					${rows}
				</div>
			</div>
		</div>
	`;
}
