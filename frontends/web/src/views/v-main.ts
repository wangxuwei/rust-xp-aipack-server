import { position } from '@dom-native/draggable';
import { pathAt } from 'common/route.js';
import { getUserContext, logoff, UserContext } from 'common/user-ctx.js';
import { BaseViewElement } from 'common/v-base.js';
import { append, customElement, first, html, on, onEvent, onHub, push } from 'dom-native';
import { isNotEmpty } from 'utils-min';

const defaultPath = "";

const tagNameByPath: { [name: string]: string } = {
	"": 'v-home',
	"users": 'v-users',
	"orgs": 'v-orgs',
	"packs": 'v-packs', 
};


@customElement('v-main')
export class MainView extends BaseViewElement {
	private _userContext?: UserContext;


	//// Key elements
	private get mainEl():HTMLElement { return first(this, 'main')! };
	private get headerAsideEl():HTMLElement { return first(this, 'header aside')! }

	//#region    ---------- Data Setters ---------- 
	set userContext(v: UserContext) {
		this._userContext = v;
		push(this.headerAsideEl, { name: this._userContext.name });
	}
	//#endn pregion ---------- /Data Setters ---------- 


	//#region    ---------- Element & Hub Events ---------- 
	@onEvent('pointerup', '.toogle-user-menu')
	showMenu(evt: PointerEvent) {
		if (first(`#user-menu-123`) == null) {
			const [menu] = append(document.body, html(`
			<c-menu id='user-menu-123'>
				<li class="do-logoff">Logoff</li>
			</c-menu>
			`));

			position(menu, this.headerAsideEl, { at: 'bottom', align: 'right' });

			on(menu, 'pointerup', 'li.do-logoff', async (evt) => {
				await logoff();
				window.location.href = '/';
			});
		}
	}


	@onHub('routeHub', 'CHANGE')
	routChange() {
		this.refresh()
	}
	//#endregion ---------- /Element & Hub Events ----------

	init() {
		super.init();
		getUserContext().then((user:UserContext | null) => {
			this.innerHTML = _render(user!.username);
			this.refresh();
		});
	}

	refresh() {
		if (this.hasPathChanged(0)) {
			const newPath = pathAt(0);
			const name = isNotEmpty(newPath) ? newPath : '';
			const tagName = tagNameByPath[name];
			this.mainEl.innerHTML = `<${tagName}></${tagName}>`;
		}

	}

}

//// HTML
function _render(username: string) {
	return `
	<header>
		<d-ico name="ico-menu">menu</d-ico>
		<a href='/'><h3>AIPACK</h3></a>
		<v-nav></v-nav>
		<aside class="toogle-user-menu">
			<c-ico>user</c-ico>
			<div class="dx dx-name">${username}</div>
		</aside>
	</header>

	<main>
	</main>
	<div class="__version__">${window.__version__}</div>
	`
}
