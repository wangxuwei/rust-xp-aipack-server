import { BaseViewElement } from 'common/v-base.js';
import { userDco } from 'dcos.js';
import { OnEvent, customElement, first, onEvent, onHub } from 'dom-native';
import { asNum } from 'utils-min';
import { User } from '../bindings/User.js';

@customElement('v-users')
export class UsersView extends BaseViewElement {
	//#region    ---------- Key Elements ---------- 
	private get tableEl(): HTMLElement { return first(this, '.table') as HTMLElement };
	private get addBtnEl(): HTMLButtonElement { return first(this, 'button.add') as HTMLButtonElement };

	//#region    ---------- Events ---------- 
	@onEvent('click', 'button.update')
	onUpdateClick(evt: MouseEvent & OnEvent) {
		const rowEl = evt.selectTarget.closest('.row') as HTMLElement;
		const userId = asNum(rowEl.dataset.id);
		if (userId) {
			this.showUserDialog(userId);
		}
	}

	@onEvent('click', 'button.delete')
	onDeleteClick(evt: MouseEvent & OnEvent) {
		const rowEl = evt.selectTarget.closest('.row') as HTMLElement;
		const userId = asNum(rowEl.dataset.id);
		if (userId) {
			userDco.delete(userId).then(() => this.refresh());
		}
	}

	@onEvent('click', 'button.add')
	onAddClick() {
		this.showUserDialog();
	}
	//#endregion ---------- /Events ----------

	//#region    ---------- Hub Events ---------- 
	@onHub('dcoHub', 'User', 'create,update,delete')
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
		const dialog = document.createElement('d-user');
		// dialog.userId = userId;
		// dialog.addEventListener('close', () => {
		// 	if (dialog.returnValue === 'save') {
		// 		this.refresh();
		// 	}
		// });
		this.appendChild(dialog);
	}
	//#endregion ---------- /Private Functions ----------
}

function _render(users: User[]) {
	const rows = users.map(user => `
		<div class="row" data-id="${user.id}">
			<div>${user.username}</div>
			<div class="actions">
				<button class="update main-button">Update</button>
				<button class="delete danger">Delete</button>
			</div>
		</div>
	`).join('');

	return `
		<div class="header">
			<button class="add">Add User</button>
		</div>
		<div class="table">
			<div class="thead">
				<div class="row">
					<div>Username</div>
					<div>Actions</div>
				</div>
			</div>
			<div class="tbody">
				${rows}
			</div>
		</div>
	`;
}
