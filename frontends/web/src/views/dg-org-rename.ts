import {
  adoptStyleSheets,
  css,
  customElement,
  onEvent,
  pull,
} from "dom-native";
import { showValidateError, validateValues } from 'validate.js';
import { Org } from "../bindings/Org.js";
import { orgDco } from "../dcos.js";
import { DgDialog } from "../dialog/dg-dialog.js";

const _compCss = css`
  ::slotted(.dialog-content) {
    display: grid;
    grid-auto-flow: row;
    grid-auto-rows: min-content;
    grid-gap: 2rem;
  }
`;

@customElement("dg-org-rename")
export class DgOrgRename extends DgDialog {
  #orgId?: number;

  set orgId(v: number) {
    this.#orgId = v;
    this.refresh();
  }

  constructor() {
    super();
    adoptStyleSheets(this, _compCss);
  }

  //#region    ---------- Events ----------
  @onEvent("pointerup", ".do-ok")
  async doOk() {
    const formData = pull(this);
    const message = validateValues(this);
    if(!message){
      await orgDco.renameOrg(this.#orgId!, formData.name);
      super.doOk();
    }else{
      showValidateError(this, message);
    }
  }
  //#endregion ---------- /Events ----------

  //#region    ---------- Lifecycle ----------
  async refresh() {
    const org = await orgDco.get(this.#orgId!);
    this.innerHTML = _render(org);
  }
  //#endregion ---------- /Lifecycle ----------
}

function _render(org?: Org) {
  const title = "Rename Organization";
  const name = org?.name ?? "";

  return `
		<div slot="title">${title}</div>

		<div class="dialog-content">
			<div class="ui-form">
				<div class="ui-form-row">
					<label class="ui-form-lbl">Name:</label>
					<d-input class="ui-form-val" name="name" value="${name}" v-rules="required" placeholder="Enter organization name" ></d-input>
				</div>
			</div>
		</div>
		
		<button slot="footer" class="do-cancel">CANCEL</button>
		<button slot="footer" class="do-ok medium">OK</button>
	`;
}
