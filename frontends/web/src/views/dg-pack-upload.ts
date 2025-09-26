import { Pack } from "bindings/Pack.js";
import { packDco } from "dcos.js";
import { adoptStyleSheets, css, customElement, onEvent, pull } from "dom-native";
import { showValidateError, validateValues } from "validate.js";
import { DgDialog } from "../dialog/dg-dialog.js";

const _compCss = css`
	::slotted(.dialog-content) {
		display: grid;
		grid-auto-flow: row;
		grid-auto-rows: min-content;
		grid-gap: 1rem;
		padding: 0.5rem;
	}
`;

@customElement("dg-pack-upload")
export class DgPackUpload extends DgDialog {
	#packId?: number;
	#pack?: Pack;

	set packId(v: number | undefined) {
		this.#packId = v;
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
		const message = validateValues(this);
		if (!message) {
			formData.pack_name = this.#pack?.name;

			const fileInput = this.querySelector('input[type="file"]') as HTMLInputElement;

			const file = fileInput.files![0];
			formData["file"] = file;

			try {
				await packDco.uploadPack(formData);
				this.close();
			} catch (error: any) {
				console.log(error);
			}
		} else {
			showValidateError(this, message);
		}
	}

	@onEvent("change", 'input[type="file"]')
	onFileSelect(evt: Event) {
		const input = evt.target as HTMLInputElement;
		const fileName = input.files?.[0]?.name || "";
		const fileNameDisplay = this.querySelector(".file-name") as HTMLElement;
		fileNameDisplay.textContent = fileName;
	}
	//#endregion ---------- /Events ----------

	//#region    ---------- Lifecycle ----------
	async refresh() {
		if (this.#packId) {
			this.#pack = await packDco.get(this.#packId);
		}
		this.innerHTML = _render(this.#pack?.name);
	}
	//#endregion ---------- /Lifecycle ----------
}

function _render(packName?: string) {
	const title = "Upload Pack Version";

	return `
		<div slot="title">${title}</div>

		<div class="dialog-content">
			<div class="ui-form">
				<div class="ui-form-row">
					<label class="ui-form-lbl">Pack:</label>
					<div class="ui-form-val">${packName}</div>
				</div>
				<div class="ui-form-row">
					<label class="ui-form-lbl">Version:</label>
					<d-input class="ui-form-val" type="version" name="version"  v-rules="required" placeholder="Enter version (e.g., 1.0.0)" value="" ></d-input>
				</div>
				<div class="ui-form-row">
					<label class="ui-form-lbl">Changelog:</label>
					<d-textarea class="ui-form-val" name="changelog"  v-rules="required" placeholder="Enter changelog notes"></d-textarea>
				</div>
				<div class="ui-form-row">
					<label class="ui-form-lbl">File:</label>
					<div class="file-input-container">
						<input id="file-upload" type="file" name="file" v-rules="required" accept=".aip">
						<label for="file-upload" class="file-input-label">Choose File</label>
						<span class="file-name"></span>
					</div>
				</div>
			</div>
		</div>
		
		<button slot="footer" class="do-cancel">CANCEL</button>
		<button slot="footer" class="do-ok medium">OK</button>
	`;
}
