import { orgDco } from 'dcos';
import { DgDialog } from "dialog/dg-dialog.js";
import { adoptStyleSheets, css, customElement, OnEvent, onEvent, pull } from "dom-native";
import { asNum, isNotEmpty } from 'utils-min';

const _compCss = css`
  ::slotted(.dialog-content) {
    display: grid;
    grid-auto-flow: row;
    grid-auto-rows: min-content;
    grid-gap: 1rem;
    padding: 0.5rem;
  }
`;
@customElement("dg-org-user-add")
export class DgOrgUserAdd extends DgDialog {
	#orgId: number | null = null;

  constructor() {
    super();
    adoptStyleSheets(this, _compCss);
  }

	set orgId(v: number | null) {
		this.#orgId = v;
	}
  //#region    ---------- Events ----------

	@onEvent("D-DATA", "c-search-select")
	async onUserData(evt: OnEvent) {
		const detail = evt.detail;
		const users = await orgDco.searchUsersForOrg(this.#orgId!, detail.input);
		detail.sendData(
			users.map((u) => {
				return { content: u.username, value: u.id.toString() };
			})
		);
	}

	@onEvent("pointerup", ".do-ok")
	async doOk() {
		const formData = pull(this);
		const userIds = formData.userIds.split(",").map((v:string) => asNum(v)).filter((v:number) => v != null);
		if(isNotEmpty(userIds)){
			await orgDco.addUsersToOrg(this.#orgId!, userIds);
		}
		super.doOk();
	}
  //#endregion ---------- /Events ----------

  //#region    ---------- Lifecycle ----------
  init() {
    super.init();
    this.innerHTML = _render();
  }

	
  //#endregion ---------- /Lifecycle ----------
}

function _render() {
  return `
		<div slot="title">Add User to Organization</div>

		<div class="dialog-content">
			<div class="ui-form">
				<div class="ui-form-row">
					<label class="ui-form-lbl">Name:</label>
					<c-search-select class="ui-form-val" name="userIds"  placeholder="Enter user name" ></c-search-select>
				</div>
			</div>
		</div>
		
		<button slot="footer" class="do-cancel">CANCEL</button>
		<button slot="footer" class="do-ok medium">OK</button>
	`;
}
