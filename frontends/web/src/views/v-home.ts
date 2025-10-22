import { BaseViewElement } from "common/v-base.js";
import { customElement } from "dom-native";
import { DgImageCrop } from "../dialog/dg_image_crop.js";

@customElement("v-home")
export class HomeView extends BaseViewElement {
	#imageCropDialog: DgImageCrop | null = null;

	//#region    ---------- Events ----------
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

	//#region    ---------- Private Methods ----------
	//#endregion ---------- /Private Methods ----------
}

function _render() {
	return `
    <div class="home-container">
      <div class="section">
        <h2>Welcome Home</h2>
      </div>
    </div>
  `;
}
