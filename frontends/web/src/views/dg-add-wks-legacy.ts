import { customElement, html, onEvent, pull, trigger } from 'dom-native';
import { Wks } from '../bindings/entities.js';
import { BaseDialog } from '../dialog/dg-base-dialog.js';



@customElement('dg-add-wks')
class AddWksDialog extends BaseDialog {

	//#region    ---------- Element Events ---------- 
	@onEvent('OK')
	onOK() {
		const data = pull(this.contentEl) as Partial<Wks>;
		trigger(this, 'ADD_WKS', { detail: data });
	}
	//#endregion ---------- /Element Events ---------- 

	init() {
		super.init();
		this.title = 'Add Workspace';
		this.content = html('<d-input name="name" label="Workspace Name"></d-input>');
		this.footer = { ok: 'Add Workspace', cancel: true };
	}

}