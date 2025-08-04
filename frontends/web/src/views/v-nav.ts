import { pathAt } from 'common/route.js';
import { BaseViewElement } from 'common/v-base.js';
import { all, customElement, onHub } from 'dom-native';

const defaultPath = '';

@customElement('v-nav')
export class NavView extends BaseViewElement {

	//#region    ---------- Element & Hub Events ---------- 
	@onHub('routeHub', 'CHANGE')
	routeChange() {
		this.refresh();
	}
	//#endregion ---------- /Element & Hub Events ---------- 

	init() {
		super.init();
		this.innerHTML = _render();
		this.refresh();
	}

	refresh() {
		const idx = 1; // path ind
		let urlName = pathAt(idx) ?? 'videos';

		for (const a of all(this, 'a')) {
			let href = a.getAttribute('href');
			let linkName = href?.split('/')[idx + 1] ?? ''; // has an extra / at start
			if (linkName === urlName) {
				a.classList.add('sel');
			} else if (a.classList.contains('sel')) {
				a.classList.remove('sel');
			}
		}
	}

}

//// HTML
function _render() {
	return `<a href="images"><span class='bar'></span><d-ico name="ico-images"></d-ico><label>Images</label></a>
			<a href="/videos"><span class='bar'></span><d-ico name="ico-videos"></d-ico><label>Videos</label></a>
			<a href="/timelines"><span class='bar'></span><d-ico name="ico-videos"></d-ico><label>Timelines</label></a>
			`;
}