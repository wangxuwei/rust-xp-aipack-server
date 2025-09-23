import { DgDialog } from "dialog/dg-dialog.js";
import { adoptStyleSheets, css, customElement } from "dom-native";

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
  constructor() {
    super();
    adoptStyleSheets(this, _compCss);
  }

  //#region    ---------- Events ----------
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
					<c-search-select class="ui-form-val" name="name"  placeholder="Enter user name" ></c-search-select>
				</div>
			</div>
		</div>
		
		<button slot="footer" class="do-cancel">CANCEL</button>
		<button slot="footer" class="do-ok medium">OK</button>
	`;
}
