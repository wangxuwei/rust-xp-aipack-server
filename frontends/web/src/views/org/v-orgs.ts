import { hasAccess } from "common/user-ctx.js";
import { hasOrgAccess } from "common/user-org-ctx.js";
import { OnEvent, all, customElement, first, onEvent, onHub, setAttr } from "dom-native";
import { PaginationView } from "pagination/v-pagination.js";
import { TableCell } from "table/v-table-cell.js";
import { getOrderBy } from "ts/app-helper.js";
import { orgDco } from "ts/dcos.js";
import { asNum, isEmpty } from "utils-min";
import { Org } from "../../bindings/Org.js";
import { BaseLeafRoute } from "../route/v-leaf-route.js";
import { DgOrgRename } from "./dg-org-rename.js";
import { DgOrg } from "./dg-org.js";

@customElement("v-orgs")
export class OrgsView extends BaseLeafRoute {
	#pageIndex: number = 0;
	#pageSize: number = 3;
	#sortColumn = "id";
	#sortType = "asc";

	//// Key elements
	private get paginationEl(): PaginationView {
		return first(this, "v-pagination") as PaginationView;
	}

	private get orderColumnEl(): TableCell {
		return first(this, `v-table-cell[sort-column='${this.#sortColumn}']`) as TableCell;
	}
	//#region    ---------- Events ----------
	@onEvent("click", ".btn-edit")
	onEditClick(evt: MouseEvent & OnEvent) {
		const rowEl = evt.selectTarget.closest(".row") as HTMLElement;
		const orgId = asNum(rowEl.dataset.id);
		if (!isEmpty(orgId)) {
			this.showOrgDialog(orgId!);
		}
	}

	@onEvent("click", ".btn-rename")
	onRename(evt: MouseEvent & OnEvent) {
		const rowEl = evt.selectTarget.closest(".row") as HTMLElement;
		const orgId = asNum(rowEl.dataset.id);
		if (!isEmpty(orgId)) {
			this.showOrgRenameDialog(orgId!);
		}
	}

	@onEvent("click", ".btn-delete")
	onDeleteClick(evt: MouseEvent & OnEvent) {
		const rowEl = evt.selectTarget.closest(".row") as HTMLElement;
		const orgId = asNum(rowEl.dataset.id);
		if (!isEmpty(orgId)) {
			orgDco.delete(orgId!).then(() => this.refresh());
		}
	}

	@onEvent("click", "button.add")
	onAddClick() {
		this.showOrgDialog();
	}

	@onEvent("PAGE_CHANGE")
	onPageChange(evt: OnEvent) {
		this.#pageIndex = evt.detail.pageIndex;
		this.#pageSize = evt.detail.pageSize;
		this.refresh();
	}

	@onEvent("SORT_CHANGE")
	onSortChange(evt: OnEvent) {
		this.#sortColumn = evt.detail.sortColumn;
		this.#sortType = evt.detail.sortType;
		this.refresh();
	}
	//#endregion ---------- /Events ----------

	//#region    ---------- Hub Events ----------
	@onHub("dcoHub", "org", "create,update,delete,rename")
	onOrgChange() {
		this.refresh();
	}
	//#endregion ---------- /Hub Events ----------

	//#region    ---------- Lifecycle ----------
	init() {
		super.init();
		this.refresh();
	}

	async refresh() {
		const [orgs, count] = await orgDco.listAndCount({
			list_options: {
				offset: this.#pageIndex * this.#pageSize,
				limit: this.#pageSize,
				order_bys: [getOrderBy(this.#sortColumn, this.#sortType)],
			},
		});
		this.innerHTML = _render(orgs);
		const paginationEl = this.paginationEl;
		paginationEl.refreshInfo(this.#pageIndex, count);
		const orderColumnEl = this.orderColumnEl;
		all(this, "v-table-cell").forEach((cellEl) => {
			setAttr(cellEl, "sort-type", null);
		});
		if (this.#sortType) {
			setAttr(orderColumnEl, "sort-type", this.#sortType);
		}
	}
	//#endregion ---------- /Lifecycle ----------

	//#region    ---------- Private Functions ----------
	private showOrgDialog(orgId?: number) {
		const dialog = document.createElement("dg-org") as DgOrg;
		dialog.orgId = orgId;
		this.appendChild(dialog);
	}

	private showOrgRenameDialog(orgId?: number) {
		const dialog = document.createElement("dg-org-rename") as DgOrgRename;
		dialog.orgId = orgId!;
		this.appendChild(dialog);
	}

	//#endregion ---------- /Private Functions ----------
}

function _render(orgs: Org[]) {
	const rows = orgs
		.map((org) => {
			let html = `
			<div class="row" data-id="${org.id}">
				<div class="cell"><a href="/orgs/users/${org.id}">${org.name}</a></div>
				<div class="cell">${org.kind}</div>
				<div class="cell actions">
					<button class="btn-edit prime">Edit</button>`;
			if (hasOrgAccess("OrgRename") || hasAccess("OrgManage")) {
				html += `
				<button class="btn-rename prime">Rename Organization</button>`;
			}
			html += `
				<button class="btn-delete danger">Delete</button>
			</div>
		</div>
		`;

			return html;
		})
		.join("");

	return `
		<div class="ui-breadcrumbs">
			<div class="breadcrumb-item">Organizations</div>
		</div>
		<div class="header">
			<button class="add default">Add Organization</button>
		</div>
		<div class="table-container">
			<div class="ui-table">
				<div class="thead row">
					<v-table-cell sort-column="name">Name</v-table-cell>
					<div class="cell">Kind</div>
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
	`;
}
