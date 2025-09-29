import { hasAccess } from "common/user-ctx.js";
import { hasOrgAccess } from "common/user-org-ctx.js";
import { BaseViewElement } from "common/v-base.js";
import { orgDco } from "dcos.js";
import { OnEvent, customElement, onEvent, onHub } from "dom-native";
import { asNum, isEmpty } from "utils-min";
import { Org } from "../bindings/Org.js";
import { DgOrgRename } from "./dg-org-rename.js";
import { DgOrg } from "./dg-org.js";

@customElement("v-orgs")
export class OrgsView extends BaseViewElement {
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
		const orgs = await orgDco.list();
		this.innerHTML = _render(orgs);
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
					<div class="cell">Name</div>
					<div class="cell">Kind</div>
					<div class="cell actions">Actions</div>
				</div>
				<div class="tbody">
					${rows}
				</div>
			</div>
		</div>
	`;
}
