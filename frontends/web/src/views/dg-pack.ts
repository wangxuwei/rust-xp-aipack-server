import { Pack } from "bindings/Pack.js";
import { packDco } from "dcos.js";
import {
  adoptStyleSheets,
  css,
  customElement,
  onEvent,
  pull,
} from "dom-native";
import { showValidateError, validateValues } from 'validate.js';
import { DgDialog } from "../dialog/dg-dialog.js";

const _compCss = css`
  ::slotted(.dialog-content) {
    display: grid;
    grid-auto-flow: row;
    grid-auto-rows: min-content;
    grid-gap: 1rem;
    padding: 0.5rem;
  }
`;

@customElement("dg-pack")
export class DgPack extends DgDialog {
  #packId?: number;
  #pack?: Pack;

  set packId(v: number | undefined) {
    this.#packId = v;
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
    let message = validateValues(this);
    if(!message){
      try {
        if (this.#packId) {
          await packDco.update(this.#packId, formData);
        } else {
          await packDco.create(formData);
        }
        this.close();
      } catch (error: any) {
        console.log(error);
      }
    }else{
      showValidateError(this, message);
    }
  }
  //#endregion ---------- /Events ----------

  //#region    ---------- Lifecycle ----------
  async refresh() {
    if (this.#packId) {
      this.#pack = await packDco.get(this.#packId);
    }
    this.innerHTML = _render(this.#packId, this.#pack);
  }
  //#endregion ---------- /Lifecycle ----------
}

function _render(packId?: number, pack?: Pack, packNameError?: string | null) {
  const title = packId ? "Edit New Pack" : "Add New Pack";
  const packName = pack?.name ?? "";

  return `
		<div slot="title">${title}</div>

		<div class="dialog-content">
			<div class="ui-form">
				<div class="ui-form-row">
					<label class="ui-form-lbl">Name:</label>
					<d-input class="ui-form-val" name="name" placeholder="Enter pack name" v-rules="required" value="${packName}"></d-input>
				</div>
				<div class="ui-form-row">
					<label class="ui-form-lbl"></label>
 				</div>
			</div>
		</div>
		
		<button slot="footer" class="do-cancel">CANCEL</button>
		<button slot="footer" class="do-ok medium">OK</button>
	`;
}
