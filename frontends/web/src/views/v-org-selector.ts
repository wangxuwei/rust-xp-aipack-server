import { getCurrentUserCtx } from "common/user-ctx.js";
import { BaseViewElement } from "common/v-base.js";
import { customElement, onDoc, OnEvent, onEvent, trigger } from "dom-native";
import { orgDco } from "ts/dcos";
import { isEmpty } from "utils-min";
import { Org } from "../bindings/Org.js";

@customElement("v-org-selector")
export class OrgSelector extends BaseViewElement {
	#orgs: Org[] = [];
	#selectedOrgId: number | null = null;

	//#region    ---------- Properties ----------
	set selectedOrgId(value: number | null) {
		if (this.#selectedOrgId !== value) {
			this.#selectedOrgId = value;
			this.refresh();
		}
	}
	//#endregion ---------- /Properties ----------

	//#region    ---------- Events ----------
	@onEvent("click", ".current-org")
	onCurrentOrgClick(evt: Event) {
		if (isEmpty(this.#orgs)) {
			return;
		}
		evt.stopPropagation();
		this.classList.add("show-dropdown");
		this.refresh();
	}

	@onEvent("click", ".dropdown-item")
	onDropdownItemClick(evt: Event & OnEvent) {
		const itemEl = evt.selectTarget as HTMLElement;
		const orgId = parseInt(itemEl.dataset.orgId || "");
		this.#selectedOrgId = orgId;
		this.classList.remove("show-dropdown");
		this.refresh();
		trigger(this, "change", { detail: this.#selectedOrgId });
	}

	// Close dropdown when clicking outside
	@onDoc("click")
	onDocumentClick(evt: Event) {
		if (!this.classList.contains("show-dropdown") && !this.contains(evt.target as Node)) {
			this.classList.remove("show-dropdown");
		}
	}
	//#endregion ---------- /Events ----------

	//#region    ---------- Lifecycle ----------
	init() {
		super.init();
	}

	async refresh() {
		try {
			const user = await getCurrentUserCtx();
			const [orgs] = await orgDco.getOrgsByUser(user?.id!);
			this.#orgs = orgs;
			this.innerHTML = _render(this.#orgs, this.#selectedOrgId);
		} catch (error) {
			console.error("Failed to load organizations:", error);
			this.innerHTML = `<div class="error">Failed to load organizations</div>`;
		}
	}
	//#endregion ---------- /Lifecycle ----------

	//#region    ---------- Private ----------
	//#endregion ---------- /Private ----------
}

function _render(orgs: Org[], selectedId: number | null) {
	if (!orgs || orgs.length === 0) {
		return `
			<div class="current-org disabled">
				<span class="org-name">No organizations available</span>
			</div>
		`;
	}
	const unnamedOrg = "Unnamed";
	const selectedOrg = orgs.find((org) => org.id === selectedId);
	const dropdownItems = orgs
		.map(
			(org) =>
				`<div class="dropdown-item" data-org-id="${org.id}">
					${org.name || unnamedOrg}
				</div>`
		)
		.join("");
	return `
		<label>Current org:</label>
		<div class="current-org">
			<span class="org-name">${selectedOrg ? selectedOrg.name || unnamedOrg : ""}</span>
			<c-ico class="toggle-icon" src="#ico-c-down"></c-ico>
			<div class="dropdown">
				${dropdownItems}
			</div>
		</div>
	`;
}
