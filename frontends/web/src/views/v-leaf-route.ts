import { paths } from "common/route";
import { BaseViewElement } from "common/v-base.js";
import { BaseRouteView } from "./v-base-route";

export abstract class BaseLeafRoute extends BaseViewElement {
	protected get leafLevel(): number {
		return 1;
	}

	//#region    ---------- Lifecycle ----------
	init() {
		super.init();
		this.routeRefresh();
	}

	protected routeRefresh() {
		const routeView = this.closest(".ui-route") as BaseRouteView;
		const level = routeView.levelPath();
		const nextLevel = level + this.leafLevel;
		const allPaths = paths();
		if (allPaths.length >= nextLevel + 1) {
			console.log(allPaths, nextLevel);
			routeView.showNotFound();
		}
	}

	//#endregion ---------- /Lifecycle ----------

	//#region    ---------- Private Functions ----------
	//#endregion ---------- /Private Functions ----------
}
