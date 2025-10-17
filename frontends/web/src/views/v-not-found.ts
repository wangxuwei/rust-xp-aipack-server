import { BaseViewElement } from "common/v-base.js";
import { customElement, onEvent } from "dom-native";

@customElement("v-not-found")
export class NotFoundView extends BaseViewElement {
	//#region    ---------- Events ----------
	@onEvent("click", ".btn-go-home")
	onGoHomeClick() {
		window.location.href = "/";
	}
	//#endregion ---------- /Events ----------

	//#region    ---------- Lifecycle ----------
	init() {
		super.init();
		this.refresh();
	}

	refresh() {
		this.innerHTML = _render();
	}
	//#endregion ---------- /Lifecycle ----------
}

function _render() {
	return `
		<div class="not-found-container">
			<div class="not-found-box">
				<c-ico src="#ico-info" class="info-icon"></c-ico>
				<div class="not-found-text">Page not found.</div>
				<button class="btn-go-home prime">Go to home page</button>
			</div>
		</div>
	`;
}
