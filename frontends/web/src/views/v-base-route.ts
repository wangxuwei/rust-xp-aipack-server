import { pathAt, paths } from "common/route.js";
import { BaseViewElement } from "common/v-base.js";
import { first, onHub } from "dom-native";
import { isNotEmpty } from "utils-min";

export abstract class BaseRouteView extends BaseViewElement {
  //#region    ---------- Path ----------
  // current paths
  private currentPaths?: string[];

  /** Returns the path at the index if it has changed from last called. */
  hasPathChanged(idx: number) {
    let changed = false;
    let newPaths = paths();
    // first init check, if not, should always change
    if (this.currentPaths) {
      let startChangedIndex = -1;
      for (let i = 0; i <= idx; i++) {
        if (newPaths[i] != this.currentPaths[i]) {
          startChangedIndex = i;
          break;
        }
      }

      // changed
      if (startChangedIndex > -1 && startChangedIndex == idx) {
        changed = true;
      }
    } else {
      changed = true;
    }

    this.currentPaths = newPaths;
    return changed;
  }

  //#endregion    ---------- /Path ----------

  protected get routeCtnEl(): HTMLElement {
    return first(this, ".ui-route")!;
  }

  protected abstract levelPath(): number;

  protected abstract getTagByPath(urlPath: string): string;

  //#region    ---------- Events ----------

  //#endregion ---------- /Events ----------

  //#region    ---------- Hub Events ----------
  @onHub("routeHub", "CHANGE")
  routChange() {
    this.routeRefresh();
  }
  //#endregion ---------- /Hub Events ----------

  //#region    ---------- Lifecycle ----------
  init() {
    super.init();
  }

  protected routeRefresh() {
    if (this.hasPathChanged(this.levelPath())) {
      const newPath = pathAt(this.levelPath());
      const name = isNotEmpty(newPath) ? newPath : "";
      const tagName = this.getTagByPath(name);
      this.routeCtnEl.innerHTML = `<${tagName}></${tagName}>`;
    }
  }
  //#endregion ---------- /Lifecycle ----------

  //#region    ---------- Private Functions ----------
  //#endregion ---------- /Private Functions ----------
}
