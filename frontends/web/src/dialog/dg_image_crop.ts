import { adoptStyleSheets, css, customElement, first, onEvent, OnEvent, style } from "dom-native";
import { DgDialog } from "./dg-dialog.js";

interface CropInfo {
	x: number;
	y: number;
	width: number;
	height: number;
	imageWidth: number;
	imageHeight: number;
}

export type ImageCropCallback = (data: Blob | null) => void;

//// CSS
const _compCss = css`
	.dialog {
		width: auto;
	}
`;
@customElement("dg-image-crop")
export class DgImageCrop extends DgDialog {
	#image: HTMLImageElement | null = null;
	#imageUrl: string | null = null;
	#imageWidth: number = 0;
	#imageHeight: number = 0;
	#cropX: number = 50;
	#cropY: number = 50;
	#cropSize: number = 100;
	#ratio: number = 1;
	#dragStartX: number = 0;
	#dragStartY: number = 0;
	#callback: ImageCropCallback | null = null;
	#isDragging = false;

	//// key elements
	get imgEl(): HTMLElement {
		return first(this, ".img") as HTMLElement;
	}
	get cropEl(): HTMLElement {
		return first(this, ".crop-circle") as HTMLElement;
	}

	constructor() {
		super();
		adoptStyleSheets(this, _compCss);
	}

	//#region    ---------- Public API ----------
	set callback(cb: ImageCropCallback | null) {
		this.#callback = cb;
	}

	reset() {
		this.#imageUrl = null;
		this.#imageWidth = 0;
		this.#imageHeight = 0;
		this.#cropX = 50;
		this.#cropY = 50;
		this.#cropSize = 100;
		this.refresh();
	}
	//#endregion ---------- /Public API ----------

	//#region    ---------- Events ----------
	@onEvent("click", ".do-upload")
	onUploadClick(evt: MouseEvent & OnEvent) {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = "image/*";
		input.onchange = (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (file) {
				const reader = new FileReader();
				reader.onload = (e) => {
					this.#imageUrl = e.target?.result as string;
					const img = (this.#image = new Image());
					img.onload = () => {
						this.#imageWidth = img.width;
						this.#imageHeight = img.height;
						this.refresh();
					};
					img.src = this.#imageUrl;
				};
				reader.readAsDataURL(file);
			}
		};
		input.click();
	}

	@onEvent("click", ".btn-ok")
	async onOkClick() {
		if (this.#callback && this.#imageUrl) {
			const container = this.querySelector(".image-container") as HTMLElement;

			// Calculate crop area relative to image
			const cropXPercent = this.#cropX / (this.#imageWidth / this.#ratio);
			const cropYPercent = this.#cropY / (this.#imageHeight / this.#ratio);
			const cropSize = this.#cropSize * this.#ratio;

			const cropInfo: CropInfo = {
				x: cropXPercent * this.#imageWidth,
				y: cropYPercent * this.#imageHeight,
				width: cropSize,
				height: cropSize,
				imageWidth: this.#imageWidth,
				imageHeight: this.#imageHeight,
			};

			const data = await this.cropAvatar(cropInfo, this.#image!);

			await this.#callback(data);
			this.close();
		}
	}

	@onEvent("pointerdown", ".crop-circle")
	onDragStart(evt: MouseEvent & OnEvent) {
		evt.preventDefault();
		this.#isDragging = true;
		this.#dragStartX = evt.pageX;
		this.#dragStartY = evt.pageY;
		const imgEl = this.imgEl;
		const cropEl = this.cropEl;

		const containerRect = imgEl.getBoundingClientRect();
		const onDragMove = (evt: MouseEvent) => {
			if (!this.#isDragging) return;

			const deltaX = evt.pageX - this.#dragStartX;
			const deltaY = evt.pageY - this.#dragStartY;

			const circleX = Math.max(0, Math.min(containerRect.width - this.#cropSize, this.#cropX + deltaX));
			const circleY = Math.max(0, Math.min(containerRect.height - this.#cropSize, this.#cropY + deltaY));

			cropEl.style.left = `${circleX}px`;
			cropEl.style.top = `${circleY}px`;
		};

		const onDragEnd = (evt: MouseEvent) => {
			this.#isDragging = false;
			const cropRect = cropEl.getBoundingClientRect();
			this.#cropX = cropRect.left - containerRect.left;
			this.#cropY = cropRect.top - containerRect.top;
			document.removeEventListener("pointerup", onDragEnd);
		};

		document.addEventListener("pointermove", onDragMove);
		document.addEventListener("pointerup", onDragEnd);
	}
	//#endregion ---------- /Events ----------

	//#region    ---------- Lifecycle ----------
	init() {
		super.init();
		this.classList.add("no-image");
		this.refresh();
	}

	refresh() {
		this.innerHTML = _render();
		const imgEl = this.imgEl;
		if (this.#imageUrl) {
			this.classList.remove("no-image");

			// set image width
			const longSize = Math.max(this.#imageWidth, this.#imageHeight);
			const baseSize = 320;
			this.#ratio = longSize / baseSize;
			const imgWidth = this.#imageWidth / this.#ratio;
			const imgHeight = this.#imageHeight / this.#ratio;
			imgEl.innerHTML = `<img src="${this.#imageUrl}">`;
			style(imgEl, {
				width: `${imgWidth}px`,
				height: `${imgHeight}px`,
			});

			// set crop position
			const smallSize = Math.min(imgWidth, imgHeight);
			this.#cropSize = smallSize;
			const cropEl = this.cropEl;
			style(cropEl, {
				width: `${this.#cropSize}px`,
				height: `${this.#cropSize}px`,
				left: `${(imgWidth - this.#cropSize) / 2}px`,
				top: `${(imgHeight - this.#cropSize) / 2}px`,
			});
			this.#cropX = (imgWidth - this.#cropSize) / 2;
			this.#cropY = (imgHeight - this.#cropSize) / 2;
		} else {
			this.classList.add("no-image");
			imgEl.innerHTML = "<div class='do-upload'></div>";
			style(imgEl, {
				width: `10rem`,
				height: `10rem`,
			});
		}
	}
	//#endregion ---------- /Lifecycle ----------

	//#region    ---------- Private Methods ----------
	cropAvatar(cropInfo: CropInfo, image: HTMLImageElement): Promise<Blob> {
		const canvas = document.createElement("canvas");

		// init canvas by dpi
		const dpr = window.devicePixelRatio || 1;
		canvas.style.width = `${cropInfo.width}px`;
		canvas.style.height = `${cropInfo.height}px`;
		canvas.width = cropInfo.width * dpr;
		canvas.height = cropInfo.height * dpr;
		const ctx = canvas.getContext("2d")!;
		ctx.scale(dpr, dpr);

		// draw crop image
		ctx.drawImage(
			image,
			cropInfo.x,
			cropInfo.y,
			cropInfo.width,
			cropInfo.height,
			0,
			0,
			cropInfo.width,
			cropInfo.height
		);

		return new Promise((res, rej) => {
			canvas.toBlob(
				async (blob: Blob | null) => {
					if (!blob) {
						rej("No Image");
					} else {
						res(blob);
					}
				},
				"image/png",
				1
			);
		});
	}

	//#endregion ---------- /Private Methods ----------
}

function _render() {
	return `
			<div slot="title">Upload image</div>
			<div class="image-container">
        <div class="img"></div>
				<div class="crop-mask">
					<div class="crop-circle"></div>
				</div>
			</div>
			<div slot="footer">
				<button class="btn-upload do-upload">Upload</button>
				<button class="btn-ok">OK</button>
				<button class="btn-cancel">Cancel</button>
			</div>
		`;
}
