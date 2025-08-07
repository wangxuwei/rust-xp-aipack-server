import { adoptStyleSheets, css, customElement, onEvent, pull } from 'dom-native';
import { isEmpty } from 'utils-min';
import { Org } from '../bindings/Org.js';
import { orgDco } from '../dcos.js';
import { DgDialog } from '../dialog/dg-dialog.js';

const _compCss = css`
	::slotted(.dialog-content) {
		display: grid;
		grid-auto-flow: row;
		grid-auto-rows: min-content; 
		grid-gap: 1rem;
	}
`;

@customElement('dg-org')
export class DgOrg extends DgDialog {
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
	@onEvent('pointerup', '.do-ok')
	async doOk() {
		const formData = pull(this);
		let org;
		if (this.#orgId) {
			org = await orgDco.update(this.#orgId, formData);
		} else {
			org = await orgDco.create(formData);
		}
		super.doOk();
	}
	//#endregion ---------- /Events ---------- 

	//#region    ---------- Lifecycle ---------- 
	async refresh() {
		const org = !isEmpty(this.#orgId) ? await orgDco.get(this.#orgId!) : undefined;
		this.innerHTML = _render(org);
	}
	//#endregion ---------- /Lifecycle ---------- 
}

function _render(org?: Org) {
	const title = org ? 'Update Organization' : 'Add Organization';
	const name = org?.name ?? '';
	const kind = org?.kind ?? 'Personal';

	return `
		<div slot="title">${title}</div>

		<div class="dialog-content">
			<div class="ui-form">
				<div class="ui-form-row">
					<label class="ui-form-lbl">Name:</label>
					<d-input class="ui-form-val" name="name" value="${name}" placeholder="Enter organization name" ></d-input>
				</div>
				<div class="ui-form-row">
					<label class="ui-form-lbl">Kind:</label>
					<d-select class="ui-form-val" name="kind" value="${kind}">
						<option value="Personal">Personal</option>
						<option value="Corporate">Corporate</option>
					</d-select>
				</div>
			</div>
		</div>
		
		<button slot="footer" class="do-cancel">CANCEL</button>
		<button slot="footer" class="do-ok medium">OK</button>
	`;
}
