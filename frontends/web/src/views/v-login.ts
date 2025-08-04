import { login } from 'common/user-ctx.js';
import { BaseViewElement } from 'common/v-base.js';
import { customElement, first, onEvent, OnEvent, pull } from 'dom-native';

@customElement('v-login')
export class LoginView extends BaseViewElement {

	//// some dom element that will be used in this component view
	private get fieldset():HTMLElement { return first(this, 'section.content')! };
	private get footerMessage():HTMLElement { return first(this, 'footer .message')! };

	private set message(txt: string | null) {
		if (txt != null) {
			this.footerMessage.textContent = txt;
			this.classList.add('has-message');
		} else {
			if (this.classList.contains('has-message')) {
				this.footerMessage.textContent = '';
				this.classList.remove('has-message');
			}
		}
	}

	//#region    ---------- Element Events ---------- 
	//> In this section put all of the @onEvent bindings, which is event bound to the `this` element.
	@onEvent('click', 'button.do')
	headerClicked(evt: MouseEvent & OnEvent) {
		this.doLogin();
	}

	@onEvent('keyup', 'input')
	_keyup(evt: KeyboardEvent & OnEvent) {
		this.message = null;
		if ('Enter' === evt.key) {
			this.doLogin();
		}
	}

	//#endregion ---------- /Element Events ----------

	//#region    ---------- Lifecycle ---------- 
	init() {
		super.init();
		this.innerHTML = _render();
	}

	async postDisplay() {
	}
	//#endregion ---------- /Lifecycle ---------- 

	private async doLogin() {
		const data = pull(this.fieldset);
		try {
			const result = await login(data.username, data.pwd);
			if (result.result.success) {
				window.location.href = '/';
				return;
			} else {
				this.message = result.error.code;
			}

		} catch (ex: any) {
			this.message = ex.error.code;
		}
	}

}



// <div class="LoginView login-mode">

function _render() {
	return `
	<div class="dialog">
		<header>CLOUD-STARTER</header>
		<section class="content">
			<d-input name="username" placeholder="username"></d-input>
			<d-input name="pwd" password placeholder="password" ico-trail="d-ico-visible"></d-input>
			<div></div>
			<button class="do high">Login</button>
		</section>
		<footer>
			<div class="message"></div>
		</footer>
	</div>`;
}