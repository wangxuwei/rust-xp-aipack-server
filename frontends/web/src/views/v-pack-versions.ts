import { pathAsNum } from "common/route.js";
import { packDco } from "dcos.js";
import { OnEvent, customElement, first, onEvent, onHub } from "dom-native";
import { download } from "file.js";
import { PaginationView } from "pagination/v-pagination.js";
import { formatDateTime } from "utils-date.js";
import { asNum, isNotEmpty } from "utils-min";
import { formatFileSize } from "utils.js";
import { Pack } from "../bindings/Pack.js";
import { PackVersion } from "../bindings/PackVersion.js";
import { APP_DATE_FORMAT } from "./conf.js";
import { DgPackUpload } from "./dg-pack-upload.js";
import { BaseRouteView } from "./v-base-route.js";
import { BaseLeafRoute } from "./v-leaf-route.js";

@customElement("v-pack-versions")
export class PackVersionsView extends BaseLeafRoute {
	#pageIndex: number = 0;
	#pageSize: number = 3;
	#packId: number | null = null;

	//// Key elements
	private get paginationEl(): PaginationView {
		return first(this, "v-pagination") as PaginationView;
	}

	protected get leafLevel() {
		return 2;
	}

	//#region    ---------- Events ----------
	@onEvent("click", "button.add")
	onAddClick() {
		this.showPackUploadDialog();
	}

	@onEvent("click", ".btn-download")
	async onDownloadClick(evt: MouseEvent & OnEvent) {
		const rowEl = evt.selectTarget.closest(".row") as HTMLElement;
		const versionId = asNum(rowEl.dataset.id);
		if (versionId) {
			this.downloadPackVersion(versionId);
		}
	}

	@onEvent("click", ".btn-delete")
	onDeleteClick(evt: MouseEvent & OnEvent) {
		const rowEl = evt.selectTarget.closest(".row") as HTMLElement;
		const versionId = asNum(rowEl.dataset.id);
		if (isNotEmpty(versionId) && this.#packId) {
			// Remove version from pack
			packDco.deletePackVersion(versionId).then(() => this.refresh());
		}
	}

	@onEvent("PAGE_CHANGE")
	onPageChange(evt: OnEvent) {
		this.#pageIndex = evt.detail.pageIndex;
		this.#pageSize = evt.detail.pageSize;
		this.refresh();
	}
	//#endregion ---------- /Events ----------

	//#region    ---------- Hub Events ----------
	@onHub("dcoHub", "pack", "upload_pack_version,delete_pack_version")
	onPackVersionChange() {
		this.refresh();
	}
	//#endregion ---------- /Hub Events ----------

	//#region    ---------- Lifecycle ----------
	init() {
		super.init();
		this.#packId = pathAsNum(2);
		this.refresh();
	}

	async refresh() {
		if (this.#packId) {
			let pack;
			try {
				pack = await packDco.get(this.#packId);
			} catch (e) {}
			if (!pack) {
				const routeView = this.closest(".ui-route") as BaseRouteView;
				routeView.showNotFound();
				return;
			}
			const [versions, count] = await packDco.listPackVersions(this.#packId, {
				list_options: { offset: this.#pageIndex * this.#pageSize, limit: this.#pageSize },
			});
			this.innerHTML = _render(pack, versions);
			const paginationEl = this.paginationEl;
			paginationEl.refreshInfo(this.#pageIndex, count);
		} else {
			const routeView = this.closest(".ui-route") as BaseRouteView;
			routeView.showNotFound();
		}
	}
	//#endregion ---------- /Lifecycle ----------

	private async downloadPackVersion(versionId: number) {
		try {
			download(`/api/download_pack/${versionId}`);
		} catch (error) {
			console.error("Failed to download pack:", error);
			alert("Failed to download pack. Please try again.");
		}
	}

	private showPackUploadDialog() {
		const view = document.createElement("dg-pack-upload") as DgPackUpload;
		(view as any).packId = this.#packId;
		this.appendChild(view);
	}
}

function _render(pack: Pack, versions: PackVersion[]) {
	const rows =
		versions.length > 0
			? versions
					.map(
						(v) => `
			<div class="row" data-id="${v.id}">
				<div class="cell">${v.version}</div>
				<div class="cell">${formatFileSize(Number(v.file_size))}</div>
				<div class="cell">${v.changelog || "-"}</div>
				<div class="cell">${formatDateTime(v.mtime, APP_DATE_FORMAT)}</div>
				<div class="cell actions">
					<button class="btn-download small prime">Download</button>
					<button class="btn-delete small danger">Delete</button>
				</div>
			</div>
		`
					)
					.join("")
			: '<div class="no-rows">No versions of this pack.</div>';

	return `
		<div class="ui-breadcrumbs">
			<div class="breadcrumb-item"><a href="/orgs">Packs</a></div>
			<div class="breadcrumb-item">Versions</div>
		</div>
		<div class="info-main">
			<div class="pack-info-section">
				<div class="card">
					<div class="header">
						<h3>Pack</h3>
					</div>
					<section>
						<div class="info-item">
							<span class="label">Name:</span>
							<span class="value">${pack.name}</span>
						</div>
					</section>
				</div>
			</div>
			<div class="versions-table-section">
				<div class="section-header">
					<h3>Versions</h3>
				</div>
				<div class="actions">
					<button class="add default">Add Version</button>
				</div>
				<div class="table-container">
					<div class="ui-table">
						<div class="thead row">
							<div class="cell">Version</div>
							<div class="cell">Size</div>
							<div class="cell">Changelog</div>
							<div class="cell">Time</div>
							<div class="cell actions">Actions</div>
						</div>
						<div class="tbody">
							${rows}
						</div>
						<div class="tfoot">
							<v-pagination></v-pagination>
						</div>
					</div>
				</div>
			</div>
		</div>
	`;
}
