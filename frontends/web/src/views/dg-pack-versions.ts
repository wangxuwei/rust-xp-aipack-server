import { adoptStyleSheets, css, customElement, OnEvent, onEvent } from 'dom-native';
import { Pack } from '../bindings/Pack.js';
import { PackVersion } from '../bindings/PackVersion.js';
import { packDco } from '../dcos.js';
import { DgDialog } from '../dialog/dg-dialog.js';
import { download } from '../file.js';
import { formatFileSize } from '../utils.js';

const _compCss = css`
	:host{
		.dialog{
			width:38rem;
		}
	}

	::slotted(.dialog-content) {
		padding: 0rem;
		display: grid;
		grid-auto-flow: row;
		grid-gap: 0.5rem;
	}
		
	::slotted([slot="title"]) {
		width: 25rem;
		height: 2rem;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}
`;

@customElement('dg-pack-versions')
export class DgPackVersions extends DgDialog {
	#packId?: number;
	#pack?: Pack;
	#versions: PackVersion[] = [];
	
	set packId(v: number | undefined) {
		this.#packId = v;
		this.refresh();
	}

	constructor() {
		super();
		adoptStyleSheets(this, _compCss);
	}

	//#region    ---------- Events ---------- 
	@onEvent('click', '.btn-download')
	async onDownloadClick(evt: MouseEvent & OnEvent) {
		const versionId = this.getVersionIdFromEvent(evt);
		if (versionId) {
			this.downloadPackVersion(versionId);
		}
	}

	@onEvent('click', '.btn-delete')
	async onDeleteClick(evt: Event) {
		const versionId = this.getVersionIdFromEvent(evt);
		if (versionId) {
			await this.deletePackVersion(versionId);
		}
	}
	//#endregion ---------- /Events ---------- 

	//#region    ---------- Lifecycle ---------- 
	async refresh() {
	if(this.#packId){
		this.#pack = await packDco.get(this.#packId);
		this.#versions = await packDco.listPackVersions(this.#packId);
		this.innerHTML = _render(this.#pack, this.#versions);
		}
	}
	//#endregion ---------- /Lifecycle ---------- 

	//#region    ---------- Private Methods ---------- 
	private getVersionIdFromEvent(evt: Event): number | undefined {
		const target = evt.target as HTMLElement;
		const row = target.closest('.tbody .row');
		return row instanceof HTMLElement ? parseInt(row.dataset.versionId || '') : undefined;
		
	}

	private async downloadPackVersion(versionId: number) {
		try {
			download(`/api/download_pack/${versionId}`);
		} catch (error) {
			console.error('Failed to download pack:', error);
			alert('Failed to download pack. Please try again.');
		}
	}

	private async deletePackVersion(versionId: number) {
		await packDco.deletePackVersion(versionId);
		this.refresh();
	}
	//#endregion ---------- /Private Methods ---------- 
}

function _render(pack: Pack, versions: PackVersion[]) {
	const title = `Pack Details: ${pack.name}`;
	const versionsRows = versions.length > 0 
		? versions.map(v => `
			<div class="row" data-version-id="${v.id}">
				<div class="cell">${v.version}</div>
				<div class="cell">${formatFileSize(Number(v.file_size))}</div>
				<div class="cell">${v.changelog || '-'}</div>
				<div class="cell actions">
					<button class="btn-download small">Download</button>
					<button class="btn-delete small danger">Delete</button>
				</div>
			</div>
		`).join('')
		: '<div class="no-versions">No versions of this pack.</div>';

	return `
		<div slot="title">${title}  (total:${versions.length})</div>
		<div class="dialog-content">
			<div class="table-container">
				<div class="table details">
					<div class="thead row">
						<div class="cell">Version</div>
						<div class="cell">Size</div>
						<div class="cell">Changelog</div>
						<div class="cell actions">Actions</div>
					</div>
					<div class="tbody">
						${versionsRows}
					</div>
				</div>
			</div>
		</div>
		
		<button slot="footer" class="do-cancel">CLOSE</button>
	`;
}
