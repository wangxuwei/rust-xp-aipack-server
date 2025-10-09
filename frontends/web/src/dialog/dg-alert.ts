import { adoptStyleSheets, css, customElement, first, onEvent } from "dom-native";
import { DgDialog } from "../dialog/dg-dialog.js";

const _compCss = css`
	::slotted(.dialog-content) {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
		text-align: center;
	}

	.message {
		margin-bottom: 1.5rem;
		font-size: 1rem;
		line-height: 1.5;
		color: var(--txt);
	}
`;

@customElement("dg-alert")
export class DgAlert extends DgDialog {
	constructor() {
		super();
		adoptStyleSheets(this, _compCss);
	}

	set message(msg: string) {
		let messageEl = first(this, ".message");
		if (messageEl) {
			messageEl.innerHTML = msg;
		}
	}

	@onEvent("pointerup", ".do-ok")
	doOk() {
		super.doOk();
	}

	init() {
		// Add the content to be slotted
		this.innerHTML = `
			<div slot="title">Message</div>

			<div class="dialog-content">
				<div class="message"></div>
			</div>
			
			<button slot="footer" class="do-ok medium">OK</button>
		`;
	}

	postDisplay() {
		// Focus on the OK button when dialog is displayed
		const okButton = first(this, ".do-ok");
		if (okButton) {
			(okButton as HTMLElement).focus();
		}
	}
}
