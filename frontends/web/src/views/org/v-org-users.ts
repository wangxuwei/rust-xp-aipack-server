import { pathAsNum } from "common/route.js";
import { OnEvent, all, customElement, first, onEvent, onHub, setAttr } from "dom-native";
import { PaginationView } from "pagination/v-pagination.js";
import { TableCell } from "table/v-table-cell.js";
import { getOrderBy, getOrgAvatar, getUserAvatar } from "ts/app-helper.js";
import { orgDco } from "ts/dcos.js";
import { asNum, isEmpty } from "utils-min";
import { Org } from "../../bindings/Org.js";
import { User } from "../../bindings/User.js";
import { BaseRouteView } from "../route/v-base-route.js";
import { BaseLeafRoute } from "../route/v-leaf-route.js";
import { DgOrgUserAdd } from "./dg-org-user-add.js";

@customElement("v-org-users")
export class OrgUsersView extends BaseLeafRoute {
	#pageIndex: number = 0;
	#pageSize: number = 20;
	#sortColumn = "id";
	#sortType = "asc";
	#orgId: number | null = null;

	//// Key elements
	private get paginationEl(): PaginationView {
		return first(this, "v-pagination") as PaginationView;
	}

	private get orderColumnEl(): TableCell {
		return first(this, `v-table-cell[sort-column='${this.#sortColumn}']`) as TableCell;
	}

	protected get leafLevel() {
		return 2;
	}

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

	@onEvent("PAGE_CHANGE")
	onPageChange(evt: OnEvent) {
		this.#pageIndex = evt.detail.pageIndex;
		this.#pageSize = evt.detail.pageSize;
		this.refresh();
	}
	//#endregion ---------- /Events ----------

	//#region    ---------- Hub Events ----------
	@onHub("dcoHub", "org", "add_user,remove_user")
	onUserOrgChange() {
		this.refresh();
	}

	@onEvent("SORT_CHANGE")
	onSortChange(evt: OnEvent) {
		this.#sortColumn = evt.detail.sortColumn;
		this.#sortType = evt.detail.sortType;
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
			let org;
			try {
				org = await orgDco.get(this.#orgId);
			} catch (e) {}

			if (!org) {
				const routeView = this.closest(".ui-route") as BaseRouteView;
				routeView.showNotFound();
				return;
			}
			const [users, count] = await orgDco.getUsersByOrg(this.#orgId, {
				offset: this.#pageIndex * this.#pageSize,
				limit: this.#pageSize,
				order_bys: [getOrderBy(this.#sortColumn, this.#sortType)],
			});
			this.innerHTML = _render(org, users);
			const paginationEl = this.paginationEl;
			paginationEl.refreshInfo(this.#pageIndex, count);
			const orderColumnEl = this.orderColumnEl;
			all(this, "v-table-cell").forEach((cellEl) => {
				setAttr(cellEl, "sort-type", null);
			});
			if (this.#sortType) {
				setAttr(orderColumnEl, "sort-type", this.#sortType);
			}
		} else {
			const routeView = this.closest(".ui-route") as BaseRouteView;
			routeView.showNotFound();
		}
	}
	//#endregion ---------- /Lifecycle ----------

	private showUserAddDialog() {
		const dialog = document.createElement("dg-org-user-add") as DgOrgUserAdd;
		dialog.orgId = this.#orgId;
		this.appendChild(dialog);
	}
}

function _render(org: Org, users: User[]) {
	const rows =
		users.length > 0
			? users
					.map(
						(user) =>
							`
							<div class="row" data-id="${user.id}">
								<div class="cell">
									<c-avatar url="${getUserAvatar(user.uuid, user.profile)}"></c-avatar>
									${user.username}
								</div>
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
						<div class="org-profile">
							<c-avatar url="${getOrgAvatar(org.uuid, org.profile)}" default-icon="#ico-group"></c-avatar>
						</div>
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
					<button class="add default">Add User</button>
				</div>
				<div class="table-container">
					<div class="ui-table">
						<div class="thead row">
							<v-table-cell sort-column="username">Username</v-table-cell>
							<div class="cell actions">Actions</div>
						</div>
						<div class="tbody">
							${rows}
						</div>
						<div class="tfoot">
							<v-pagination></v-pagination>
						</div>
					</div>
				</div>
			</div>
		</div>
	`;
}
