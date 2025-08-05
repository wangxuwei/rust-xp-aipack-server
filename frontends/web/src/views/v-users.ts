import { BaseViewElement } from 'common/v-base.js';
import { customElement } from 'dom-native';
import { Wks } from '../bindings/entities.js';

@customElement('v-users')
export class UsersView extends BaseViewElement {

	//#region    ---------- Events---------- 
	//#endregion ---------- /Events---------- 

	//#region    ---------- Hub Events ---------- 
	//#endregion ---------- /Hub Events ---------- 


	init() {
		super.init();
		this.refresh();
	}

	async refresh() {
		this.innerHTML = _render();
	}
}

//// HTMLs

function _render(wksList: Wks[] = []) {
	let html = `Users`;

	return html;

}



