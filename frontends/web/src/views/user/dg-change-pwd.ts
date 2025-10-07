import { DgDialog } from "dialog/dg-dialog.js";
import { adoptStyleSheets, css, customElement, first, onEvent, pull } from "dom-native";
import { userDco } from "ts/dcos";
import { showValidateError, validateValues } from "ts/validate";

const _compCss = css`
	::slotted(.dialog-content) {
		display: grid;
		grid-auto-flow: row;
		grid-auto-rows: min-content;
		grid-gap: 1rem;
	}
`;

@customElement("dg-change-pwd")
export class DgChangePwd extends DgDialog {
	#userId?: number;

	set userId(v: number | undefined) {
		this.#userId = v;
	}

	constructor() {
		super();
		adoptStyleSheets(this, _compCss);
	}

	@onEvent("pointerup", ".do-ok")
	async doOk() {
		const formData = pull(this);
		const message = validateValues(this);

		if (!message) {
			try {
				await userDco.updatePwd(this.#userId!, formData.pwd, formData.repeat_pwd, formData.current_pwd);
				super.doOk();
			} catch (error) {
				console.log(error);
			}
		} else {
			showValidateError(this, message);
		}
	}

	init() {
		this.innerHTML = _render();
	}

	postDisplay() {
		first(this, '[name="current_pwd"]')?.focus();
	}
}

function _render() {
	return `
			<div slot="title">Change Password</div>

			<div class="dialog-content">
				<div class="ui-form">
					<div class="ui-form-row">
						<label class="ui-form-lbl">Current Password:</label>
						<d-input type="password" class="ui-form-val dx" name="current_pwd" v-rules="required" placeholder="Enter current password" ></d-input>
					</div>
					<div class="ui-form-row">
						<label class="ui-form-lbl">New Password:</label>
						<d-input type="password" class="ui-form-val dx" name="pwd" v-rules="required" placeholder="Enter new password" ></d-input>
					</div>
					<div class="ui-form-row">
						<label class="ui-form-lbl">Repeat Password:</label>
						<d-input type="password" class="ui-form-val dx" name="repeat_pwd" v-rules="required;equal" v-equal-depends-on="n-pwd"  placeholder="Repeat new password" ></d-input>
					</div>
				</div>
			</div>
			
			<button slot="footer" class="do-cancel">CANCEL</button>
			<button slot="footer" class="do-ok medium">OK</button>
		`;
}
