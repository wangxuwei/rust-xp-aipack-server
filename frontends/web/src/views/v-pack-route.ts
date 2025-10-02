import { customElement } from "dom-native";
import { BaseRouteView } from "./v-base-route.js";

const tagNameByPath: { [name: string]: string } = {
	"": "v-packs",
	versions: "v-pack-versions",
};

@customElement("v-pack-route")
export class PackRouteView extends BaseRouteView {
	public levelPath(): number {
		return 1;
	}

	protected getTagByPath(urlPath: string): string {
		return tagNameByPath[urlPath];
	}

	//#region    ---------- Lifecycle ----------
	init() {
		super.init();
		this.innerHTML = _render();
		this.routeRefresh();
	}
	//#endregion ---------- /Lifecycle ----------
}

function _render() {
	return `
		<div class="ui-route-con">
		</div>
	`;
}
