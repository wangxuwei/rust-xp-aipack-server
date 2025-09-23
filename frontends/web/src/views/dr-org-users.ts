import { BaseInputElement } from "@dom-native/ui/src/d-base-input.js";
import { User } from "bindings/User.js";
import { adoptStyleSheets, all, css, customElement, onEvent } from "dom-native";
import { DrDrawer } from "drawer/dr-drawer.js";
import { asNum } from "utils-min";
import { Org } from "../bindings/Org.js";
import { orgDco, userDco } from "../dcos.js";

const _compCss = css`
  ::slotted(.dialog-content) {
    display: grid;
    grid-auto-flow: row;
    grid-auto-rows: min-content;
    grid-gap: 1rem;
  }
`;

@customElement("dr-org-users")
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
  @onEvent("pointerup", ".do-ok")
  async doOk() {
    const itemIds = all(this, "d-check[checked]").map((f: HTMLElement) => {
      let checkbox = f as BaseInputElement;
      return asNum(checkbox.value!);
    })!;
    await orgDco.addUsersToOrg(this.#orgId!, itemIds as number[]);
    super.doOk();
  }
  //#endregion ---------- /Events ----------

  //#region    ---------- Lifecycle ----------
  async refresh() {
    if (this.#orgId) {
      const org = await orgDco.get(this.#orgId!);
      const users = await userDco.list();
      const selectedUsers = await orgDco.getUsersByOrg(this.#orgId);
      this.innerHTML = _render(org, users, selectedUsers);
    }
  }
  //#endregion ---------- /Lifecycle ----------
}

function _render(org: Org, users: User[], selectedUsers: User[]) {
  const title = "Organization users";
  let selUser = new Set(selectedUsers.map((s) => s.id));
  const rows = users
    .map(
      (user) => `
		<div class="ui-drawer-item" data-id="${user.id}">
			<d-check value="${user.id}" ${selUser.has(user.id) ? "checked" : ""}></d-check>
			<label>${user.username}</label>
		</div>
	`
    )
    .join("");

  return `
		<div slot="title">${title}</div>

		<div class="drawer-content">
			${rows}
		</div>
		
		<button slot="footer" class="do-cancel">CANCEL</button>
		<button slot="footer" class="do-ok medium">OK</button>
	`;
}
