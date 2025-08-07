## UI dialog Best Practices

These are the best practices for UI dialog


### 
````ts
import { adoptStyleSheets, css, customElement, first, onEvent, pull, trigger } from 'dom-native';
import { DgDialog } from '../dialog/dg-dialog.js';
import { userDco } from 'dcos.js';
const { assign } = Object;


const _compCss = css`
	::slotted(.dialog-content) {
		display: grid;
		grid-auto-flow: row;
		grid-auto-rows: min-content; 
		grid-gap: 1rem;
	}
`;


@customElement('dg-user-add')
export class DgUserAdd extends DgDialog {
	#userId?: number;

	set userId(v: number | undefined) {
		this.#userId = v;
		this.refresh();
	}

	constructor() {
		super();
		adoptStyleSheets(this, _compCss);
	}

	@onEvent('pointerup', '.do-ok')
	doOk() {
		super.doOk();
		const detail = pull(this);
		if(this.#userId){
			await userDco.create(detail);
		}else{
			await userDco.update(this.#userId, detail);
		}
	}


	init() {
		// add the content to be slotted
		this.innerHTML = `
			<div slot="title">Add User</div>

			<div class="dialog-content">
				<div class="ui-form">
					<div class="ui-form-row">
							<label class="ui-form-lbl">Name:</label>
							<d-input class="ui-form-val" placeholder="Enter name" ></d-input>
						</div>
					</div>
				</div>
			</div>
			
			<button slot="footer" class="do-cancel">CANCEL</button>
			<button slot="footer" class="do-ok medium">OK</button>
		`;
	}

	postDisplay() {
		first(this, 'd-input')?.focus();
	}
}


````
- this is example for to add an user
- use slot to add dialog header, content and footer
- use _compCss to style slot elements
- for button, if there is a ui-form, bind .do-ok event do prcess form to pull all form data and trigger event _ADD with subffix
- the dialog view file name should have dg- as prefix
- then name "dg-user-add" in ```@customElement('dg-user-add')```, should be start with "dg-"
- the view name for the class should have Dg as prefix
