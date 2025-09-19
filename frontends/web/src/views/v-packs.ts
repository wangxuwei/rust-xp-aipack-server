import { BaseViewElement } from "common/v-base.js";
import { packDco } from "dcos.js";
import { OnEvent, customElement, onEvent, onHub } from "dom-native";
import { asNum, isEmpty } from "utils-min";
import { Pack } from "../bindings/Pack.js";
import { DgPackUpload } from "./dg-pack-upload.js";
import { DgPackVersions } from "./dg-pack-versions.js";
import { DgPack } from "./dg-pack.js";

@customElement("v-packs")
export class PacksView extends BaseViewElement {
  //#region    ---------- Events ----------
  @onEvent("click", ".btn-upload")
  onUpload(evt: MouseEvent & OnEvent) {
    const rowEl = evt.selectTarget.closest(".row") as HTMLElement;
    const packId = asNum(rowEl.dataset.id);
    if (!isEmpty(packId)) {
      this.showPackUploadDialog(packId!);
    }
  }

  @onEvent("click", ".btn-edit")
  onEditClick(evt: MouseEvent & OnEvent) {
    const rowEl = evt.selectTarget.closest(".row") as HTMLElement;
    const packId = asNum(rowEl.dataset.id);
    if (!isEmpty(packId)) {
      this.showPackDialog(packId!);
    }
  }

  @onEvent("click", ".btn-delete")
  onDeleteClick(evt: MouseEvent & OnEvent) {
    const rowEl = evt.selectTarget.closest(".row") as HTMLElement;
    const packId = asNum(rowEl.dataset.id);
    if (!isEmpty(packId)) {
      packDco.delete(packId!);
    }
  }

  @onEvent("click", "button.add")
  onAddClick() {
    this.showPackDialog();
  }

  @onEvent("click", ".btn-details")
  onDetailsClick(evt: MouseEvent & OnEvent) {
    const rowEl = evt.selectTarget.closest(".row") as HTMLElement;
    const packId = asNum(rowEl.dataset.id);
    if (!isEmpty(packId)) {
      this.showPackVersionsDialog(packId!);
    }
  }
  //#endregion ---------- /Events ----------

  //#region    ---------- Hub Events ----------
  @onHub("dcoHub", "pack", "create,update,delete")
  onPackChange() {
    this.refresh();
  }
  //#endregion ---------- /Hub Events ----------

  //#region    ---------- Lifecycle ----------
  init() {
    super.init();
    this.refresh();
  }

  async refresh() {
    const packs = await packDco.list();
    this.innerHTML = _render(packs);
  }
  //#endregion ---------- /Lifecycle ----------

  //#region    ---------- Private Functions ----------
  private showPackDialog(packId?: number) {
    const dialog = document.createElement("dg-pack") as DgPack;
    dialog.packId = packId;
    this.appendChild(dialog);
  }

  private showPackUploadDialog(packId: number) {
    const dialog = document.createElement("dg-pack-upload") as DgPackUpload;
    dialog.packId = packId;
    this.appendChild(dialog);
  }

  private showPackVersionsDialog(packId: number) {
    const dialog = document.createElement("dg-pack-versions") as DgPackVersions;
    dialog.packId = packId;
    this.appendChild(dialog);
  }
  //#endregion ---------- /Private Functions ----------
}

function _render(packs: Pack[]) {
  const rows = packs
    .map(
      (pack) => `
        <div class="row" data-id="${pack.id}">
            <div class="cell">
                <div class="pack-name">${pack.name}</div>
            </div>
            <div class="cell actions">
                <button class="btn-upload">Upload new version</button>
                <button class="btn-details">Details</button>
                <button class="btn-edit prime">Edit</button>
                <button class="btn-delete danger">Delete</button>
            </div>
        </div>
    `
    )
    .join("");

  return `
        <div class="header">
            <button class="add">Add New Pack</button>
        </div>
        <div class="table-container">
            <div class="table">
                <div class="thead row">
                    <div class="cell">Pack</div>
                    <div class="cell">Actions</div>
                </div>
                <div class="tbody">
                    ${rows}
                </div>
            </div>
        </div>
    `;
}
