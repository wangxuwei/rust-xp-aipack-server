import { customElement } from "dom-native";
import { BaseRouteView } from "../route/v-base-route.js";

const tagNameByPath: { [name: string]: string } = {
	"": "v-orgs",
	users: "v-org-users",
};

@customElement("v-org-route")
export class OrgRouteView extends BaseRouteView {
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
