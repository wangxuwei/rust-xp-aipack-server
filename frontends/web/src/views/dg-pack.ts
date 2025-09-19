import { packDco } from 'dcos.js';
import { adoptStyleSheets, css, customElement, onEvent, pull } from 'dom-native';
import { DgDialog } from '../dialog/dg-dialog.js';

const _compCss = css`
	::slotted(.dialog-content) {
		display: grid;
		grid-auto-flow: row;
		grid-auto-rows: min-content; 
		grid-gap: 1rem;
		padding: 0.5rem;
	}
`;

@customElement('dg-pack')
export class DgPack extends DgDialog {
	#packId?: number;
	#packNameError: string | null = null;
	#versionError: string | null = null;
	#fileError: string | null = null;

	#formDataCache: any = {};
	#cachedFileName: string = '';
	set packId(v: number | undefined) {
		this.#packId = v;
		this.refresh();
	}

	constructor() {
		super();
		adoptStyleSheets(this, _compCss);
	}

	//#region    ---------- Events ---------- 
	@onEvent('pointerup', '.do-ok')
	async doOk() {
		const formData = pull(this);
		this.#formDataCache = { ...formData };
		let hasError = false;

		if (!formData.pack_name.trim()) {
			this.#packNameError = 'Pack name is required';
			hasError = true;
		}

		if (!formData.version.trim()) {
			this.#versionError = 'Pack version is required';
			hasError = true;
		}
		
		const fileInput = this.querySelector('input[type="file"]') as HTMLInputElement;
		if ((!fileInput.files || fileInput.files.length === 0) && !this.#cachedFileName) {
			this.#fileError = 'Pack file is required';
			hasError = true;
			}else if (fileInput.files && fileInput.files.length > 0){
				this.#cachedFileName = fileInput.files[0].name;
			}
			if (hasError) {
				this.refresh();
				return;
			}

		const file = fileInput.files![0];
		formData['file'] = file;

		try {
			await packDco.savePack(formData);
			this.close();
		} catch (error: any) {
			if (error?.message === 'PACK_VERSION_ALREADY_EXISTS') {
				this.#versionError = 'Pack version already exists';
			} else {
				// Generic error for other cases
				this.#fileError = error?.message || 'Upload failed';
			}
			this.refresh();
		}
	}
	
	@onEvent('change', 'input[type="file"]')
	onFileSelect(evt: Event) {
		const input = evt.target as HTMLInputElement;
		const fileName = input.files?.[0]?.name || '';
		const fileNameDisplay = this.querySelector('.file-name') as HTMLElement;
		fileNameDisplay.textContent = fileName;
			
		this.#cachedFileName = fileName;
		// Clear file error when a new file is selected
		if (this.#fileError) {
			this.#fileError = null;
			this.refresh();
		}
	}

	@onEvent('input', 'd-input[name="pack_name"]')
	onPackNameInput(evt: Event) {
		if (this.#packNameError) {
			this.#packNameError = null;
			const input = evt.target as HTMLInputElement;
			this.#formDataCache.pack_name = input.value;
			this.refresh();
		}
	}
	
	@onEvent('input', 'd-input[name="version"]')
	onVersionInput(evt: Event) {
		if (this.#versionError) {
			this.#versionError = null;
			const input = evt.target as HTMLInputElement;
			this.#formDataCache.version = input.value;
			this.refresh();
		}
	}

	@onEvent('input', 'd-textarea[name="changelog"]')
	onChangelogInput(evt: Event) {
		const textarea = evt.target as HTMLTextAreaElement;
		this.#formDataCache.changelog = textarea.value;
	}
	//#endregion ---------- /Events ---------- 

	//#region    ---------- Lifecycle ---------- 
	async refresh() {
		this.innerHTML = _render(this.#packId, this.#packNameError, this.#versionError, this.#fileError,this.#formDataCache, this.#cachedFileName);
	}
	//#endregion ---------- /Lifecycle ---------- 
}

function _render(packId?: number, packNameError?: string | null, versionError?: string | null, fileError?: string | null, formDataCache?: any, cachedFileName?: string) {
	const title = 'Add New Pack';
	const cachedPackName = formDataCache?.pack_name || '';
	const cachedVersion = formDataCache?.version || '';
	const cachedChangelog = formDataCache?.changelog || '';
	const displayFileName = cachedFileName || '';
	const packNameField = packId ? '' : `
		<div class="ui-form-row">
			<label class="ui-form-lbl">Name:</label>
			<d-input class="ui-form-val" name="pack_name" placeholder="Enter pack name" value="${cachedPackName}"></d-input>
		</div>
	`;

	return `
		<div slot="title">${title}</div>

		<div class="dialog-content">
			<div class="ui-form">
				${packNameField}
				<div class="ui-form-row">
					<label class="ui-form-lbl">Version:</label>
					<d-input class="ui-form-val" type="version" name="version" placeholder="Enter version (e.g., 1.0.0)" value="${cachedVersion}" ></d-input>
				</div>
				<div class="ui-form-row">
					<label class="ui-form-lbl">Changelog:</label>
					<d-textarea class="ui-form-val" name="changelog" placeholder="Enter changelog notes">${cachedChangelog}</d-textarea>
				</div>
				<div class="ui-form-row">
					<label class="ui-form-lbl">File:</label>
					<div class="file-input-container">
						<input id="file-upload" type="file" name="file" accept=".aip">
						<label for="file-upload" class="file-input-label">Choose File</label>
						<span class="file-name">${displayFileName}</span>
					</div>
				</div>
				<div class="ui-form-row">
					<label class="ui-form-lbl"></label>
					<div class="file-input-container">
						${packNameError ? `<div class="error-message">${packNameError}</div>` : ''}
						${versionError ? `<div class="error-message">${versionError}</div>` : ''}
						${fileError ? `<div class="error-message">${fileError}</div>` : ''}
 					</div>
 				</div>
			</div>
		</div>
		
		<button slot="footer" class="do-cancel">CANCEL</button>
		<button slot="footer" class="do-ok medium">OK</button>
	`;
}
