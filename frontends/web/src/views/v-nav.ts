import { pathOrgedAt, wrapOrgPath } from "common/route-orged";
import { hasAccess } from "common/user-ctx";
import { hasOrgAccess } from "common/user-org-ctx";
import { BaseViewElement } from "common/v-base.js";
import { all, customElement, onHub } from "dom-native";

@customElement("v-nav")
export class NavView extends BaseViewElement {
	//#region    ---------- Events----------
	//#endregion ---------- /Events----------

	//#region    ---------- Hub Events ----------
	@onHub("routeHub", "CHANGE")
	routChange() {
		this.refresh();
	}
	//#endregion ---------- /Hub Events ----------

	init() {
		super.init();
		this.refresh();
	}

	async refresh() {
		this.innerHTML = _render();
		let urlName = pathOrgedAt(0) ?? "";
		urlName = wrapOrgPath("/" + urlName);

		for (const a of all(this, "a")) {
			let href = a.getAttribute("href");
			if (href == urlName) {
				a.classList.add("sel");
			} else {
				a.classList.remove("sel");
			}
		}
	}
}

//// HTMLs

function _render() {
	let html = `
            <a class="nav-item" href="/users">Users</a>`;
	if (hasAccess("Admin")) {
		html += `
            <a class="nav-item" href="/orgs">Organizations</a>`;
	}

	if (hasOrgAccess("User")) {
		html += `<a class="nav-item" href="${wrapOrgPath("/packs")}">Packs</a>`;
	}
	return html;
}
