import { BaseViewElement } from 'common/v-base.js';
import { customElement } from 'dom-native';
import { Wks } from '../bindings/entities.js';

@customElement('v-home')
export class wksListView extends BaseViewElement {

	//#region    ---------- Events---------- 
	//#endregion ---------- /Events---------- 

	//#region    ---------- Hub Events ---------- 
	//#endregion ---------- /Hub Events ---------- 


	async init() {
		super.init();

		// BEST-PRATICE: init() should always attempt to draw the empty state without async when possible
		//               Here we do this with `this.refresh([])` which will 
		this.refresh(); // this will execute in sync as it will not do any server request
	}

	async refresh() {
		this.innerHTML = _render();
	}
}

//// HTMLs

function _render(wksList: Wks[] = []) {
	let html = `<header><h1></h1></header>
	<section>
	`;
	html += `</section>`;

	return html;

}