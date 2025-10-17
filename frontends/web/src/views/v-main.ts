import { position } from "@dom-native/draggable";
import { getRouteOrgId, pathAt } from "common/route";
import { ORG_BASE_PATHS, pathOrgedAt } from "common/route-orged.js";
import { getUserContext, logoff, UserContext } from "common/user-ctx.js";
import { getCurrentOrgId, getUserOrgContext } from "common/user-org-ctx";
import { DgAlert } from "dialog/dg-alert";
import { append, customElement, first, html, on, onEvent, push } from "dom-native";
import { orgDco, userDco } from "ts/dcos";
import { BaseRouteView } from "./route/v-base-route";
import { OrgSelector } from "./v-org-selector";

const tagNameByPath: { [name: string]: string } = {
	"": "v-home",
	users: "v-users",
	orgs: "v-org-route",
	packs: "v-pack-route",
};

@customElement("v-main")
export class MainView extends BaseRouteView {
	private _userContext?: UserContext;

	//// Key elements
	private get mainEl(): HTMLElement {
		return first(this, "main")!;
	}
	private get headerAsideEl(): HTMLElement {
		return first(this, "header aside")!;
	}
	private get orgSelector(): OrgSelector {
		return first(this, "v-org-selector") as OrgSelector;
	}

	protected get routeCtnEl(): HTMLElement {
		return this.mainEl;
	}

	//#region    ---------- Data Setters ----------
	set userContext(v: UserContext) {
		this._userContext = v;
		push(this.headerAsideEl, { name: this._userContext.name });
	}
	//#endn pregion ---------- /Data Setters ----------

	//#region    ---------- Element & Hub Events ----------
	@onEvent("pointerup", ".toogle-user-menu")
	showMenu(evt: PointerEvent) {
		if (first(`#user-menu-123`) == null) {
			const [menu] = append(
				document.body,
				html(`
			<c-menu id='user-menu-123'>
				<li class="do-change-pwd">Change password</li>
				<li class="do-logoff">Logoff</li>
			</c-menu>
			`)
			);

			position(menu, this.headerAsideEl, { at: "bottom", align: "right" });

			on(menu, "pointerup", "li.do-logoff", async (evt) => {
				await logoff();
				window.location.href = "/";
			});

			on(menu, "pointerup", "li.do-change-pwd", async (evt) => {
				const user = await getUserContext();
				await userDco.prlink(user?.id!);
				const dialog = document.createElement("dg-alert") as DgAlert;
				this.appendChild(dialog);
				dialog.message = "Sent a reset link to your email account, please check.";
			});
		}
	}
	//#endregion ---------- /Element & Hub Events ----------

	protected getTagByPath(urlPath: string): string {
		let urlLevelPath = pathOrgedAt(this.levelPath()) ?? "";
		return tagNameByPath[urlLevelPath!];
	}

	public levelPath(): number {
		// top level
		return 0;
	}

	async init() {
		super.init();
		const userPromise = getUserContext();
		const orgPrmise = orgDco
			.getDefaultOrg(getRouteOrgId()!)
			.then((defaultOrg) => {
				if (defaultOrg) {
					return getUserOrgContext(defaultOrg.id);
				}
				return null;
			})
			.catch(() => {
				return null;
			});

		const [user, orgCtx] = await Promise.all([userPromise, orgPrmise]);
		this.innerHTML = _render(user!.username);
		if (!this.checkAndRedirectOrgScopedUrl()) {
			const orgSelector = this.orgSelector;
			orgSelector.selectedOrgId = orgCtx?.id!;
			this.routeRefresh();
		}
	}

	private checkAndRedirectOrgScopedUrl() {
		const startPath = pathAt(0);
		if (startPath && ORG_BASE_PATHS.includes(startPath)) {
			const url = new URL(window.location.href);
			const orgId = getCurrentOrgId();
			if (orgId) {
				window.location.href = "/" + orgId + url.pathname + url.search;
			} else {
				this.showNotFound();
				return true;
			}
		}
		return false;
	}
}

//// HTML
function _render(username: string) {
	return `
	<header>
		<d-ico name="ico-menu">menu</d-ico>
		<a href='/'><h3>AIPACK</h3></a>
		<v-nav></v-nav>
		<v-org-selector></v-org-selector>
		<aside class="toogle-user-menu">
			<c-ico>user</c-ico>
			<div class="dx dx-name">${username}</div>
		</aside>
	</header>

	<main class="ui-route-con">
	</main>
	<div class="__version__">${window.__version__}</div>
	`;
}
