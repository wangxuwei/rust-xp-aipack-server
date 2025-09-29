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
	const rows =
		users.length > 0
			? users
					.map(
						(user) =>
							`
							<div class="row" data-id="${user.id}">
								<div class="cell">${user.username}</div>
								<div class="cell actions">
									<button class="btn-delete danger">Remove</button>
								</div>
							</div>
						`
					)
					.join("")
			: '<div class="no-rows">No user of org.</div>';

	return `
		<div class="ui-breadcrumbs">
			<div class="breadcrumb-item"><a href="/orgs">Organizations</a></div>
			<div class="breadcrumb-item">Users</div>
		</div>
		<div class="info-main">
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
					</section>
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
		</div>
	`;
}
