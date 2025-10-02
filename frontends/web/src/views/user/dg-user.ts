import { adoptStyleSheets, css, customElement, onEvent, pull } from "dom-native";
import { showValidateError, validateValues } from "ts/validate.js";
import { isEmpty } from "utils-min";
import { User } from "../../bindings/User.js";
import { DgDialog } from "../../dialog/dg-dialog.js";
import { userDco } from "../../ts/dcos.js";

const _compCss = css`
	::slotted(.dialog-content) {
		display: grid;
		grid-auto-flow: row;
		grid-auto-rows: min-content;
		grid-gap: 1rem;
	}
`;

@customElement("dg-user")
export class DgUser extends DgDialog {
	#userId?: number;

	set userId(v: number | undefined) {
		this.#userId = v;
		this.refresh();
	}

	constructor() {
		super();
		adoptStyleSheets(this, _compCss);
	}

	//#region    ---------- Events ----------
	@onEvent("pointerup", ".do-ok")
	async doOk() {
		const formData = pull(this);
		let message = validateValues(this);
		if (!message) {
			let user;
			if (this.#userId) {
				user = await userDco.update(this.#userId, formData);
			} else {
				user = await userDco.create(formData);
			}
			super.doOk();
		} else {
			showValidateError(this, message);
		}
	}
	//#endregion ---------- /Events ----------

	//#region    ---------- Lifecycle ----------
	async refresh() {
		const user = !isEmpty(this.#userId) ? await userDco.get(this.#userId!) : undefined;
		this.innerHTML = _render(user);
	}
	//#endregion ---------- /Lifecycle ----------
}

function _render(user?: User) {
	const title = user ? "Update User" : "Add User";
	const username = user?.username ?? "";

	const pwdClearHtml = user
		? ``
		: `
		<div class="ui-form-row">
			<label class="ui-form-lbl">Password:</label>
			<d-input class="ui-form-val" name="pwd_clear" value="" placeholder="Enter password" ></d-input>
		</div>
	`;

	return `
		<div slot="title">${title}</div>

		<div class="dialog-content">
			<div class="ui-form">
				<div class="ui-form-row">
					<label class="ui-form-lbl">Username:</label>
					<d-input class="ui-form-val" name="username" value="${username}" placeholder="Enter username" v-rules="required" ></d-input>
				</div>
				${pwdClearHtml}
			</div>
		</div>
		
		<button slot="footer" class="do-cancel">CANCEL</button>
		<button slot="footer" class="do-ok medium">OK</button>
	`;
}
