import { pathAt } from 'common/route.js';
import { BaseViewElement } from 'common/v-base.js';
import { all, customElement, onHub } from 'dom-native';
import { Wks } from '../bindings/entities.js';

@customElement('v-nav')
export class NavView extends BaseViewElement {

	//#region    ---------- Events---------- 
	//#endregion ---------- /Events---------- 

	//#region    ---------- Hub Events ---------- 
	@onHub('routeHub', 'CHANGE')
	routChange() {
		this.refresh()
	}
	//#endregion ---------- /Hub Events ---------- 


	init() {
		super.init();
		this.refresh();
	}

	async refresh() {
		this.innerHTML = _render();
		const idx = 0;
		let urlName = pathAt(0) ?? 'users';

		for (const a of all(this, 'a')) {
			let href = a.getAttribute('href');
			let linkName = href?.split('/')[1] ?? ''; // has an extra / at start
			if (linkName === urlName) {
				a.classList.add('sel');
			} else if (a.classList.contains('sel')) {
				a.classList.remove('sel');
			}
		}
	}
}

//// HTMLs

function _render(wksList: Wks[] = []) {
	let html = `
			<a class="nav-item" href="/users">Users</a>
			<a class="nav-item" href="/orgs">Organizations</a>`;

	return html;

}



