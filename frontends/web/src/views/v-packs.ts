import { BaseViewElement } from "common/v-base.js";
import { packDco } from "dcos.js";
import { OnEvent, customElement, first, onEvent, onHub } from "dom-native";
import { PaginationView } from "pagination/v-pagination.js";
import { asNum, isEmpty } from "utils-min";
import { Pack } from "../bindings/Pack.js";
import { DgPackUpload } from "./dg-pack-upload.js";
import { DgPack } from "./dg-pack.js";

@customElement("v-packs")
export class PacksView extends BaseViewElement {
	#pageIndex: number = 0;
	#pageSize: number = 3;

	//// Key elements
	private get paginationEl(): PaginationView {
		return first(this, "v-pagination") as PaginationView;
	}

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

	@onEvent("PAGE_CHANGE")
	onPageChange(evt: OnEvent) {
		this.#pageIndex = evt.detail.pageIndex;
		this.#pageSize = evt.detail.pageSize;
		this.refresh();
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
		const [packs, count] = await packDco.listAndCount({
			list_options: { offset: this.#pageIndex * this.#pageSize, limit: this.#pageSize },
		});
		this.innerHTML = _render(packs);
		const paginationEl = this.paginationEl;
		paginationEl.refreshInfo(this.#pageIndex, count);
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
	//#endregion ---------- /Private Functions ----------
}

function _render(packs: Pack[]) {
	const rows = packs
		.map(
			(pack) => `
        <div class="row" data-id="${pack.id}">
            <div class="cell">
							<a href="/packs/versions/${pack.id}">${pack.name}</a>				
            </div>
            <div class="cell actions">
                <button class="btn-upload default">Upload new version</button>
                <button class="btn-edit prime">Edit</button>
                <button class="btn-delete danger">Delete</button>
            </div>
        </div>
    `
		)
		.join("");

	return `
				<div class="ui-breadcrumbs">
					<div class="breadcrumb-item">Packs</div>
				</div>
        <div class="header">
            <button class="add default">Add New Pack</button>
        </div>
        <div class="table-container">
            <div class="ui-table">
                <div class="thead row">
                    <div class="cell">Pack</div>
                    <div class="cell">Actions</div>
                </div>
                <div class="tbody">
                    ${rows}
                </div>
								<div class="tfoot">
									<v-pagination></v-pagination>
								</div>
            </div>
        </div>
    `;
}
