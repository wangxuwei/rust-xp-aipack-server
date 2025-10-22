import { adoptStyleSheets, BaseHTMLElement, css, customElement, getAttr } from "dom-native";

//// CSS
const _compCss = css`
	:host {
		display: inline-block;
		min-width: 1rem;
		min-width: 1rem;
		border-radius: 50%;
		overflow: hidden;
		background: var(--clr-gray-200);
		position: relative;
	}

	:host img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	:host .default-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
	}
	:host .default-icon c-ico {
		width: 60%;
		height: 60%;
	}
	:host .default-icon c-ico::part(symbol) {
		fill: var(--clr-gray-500);
	}
`;

@customElement("c-avatar")
export class AvatarElement extends BaseHTMLElement {
	#url: string | null = null;
	#defaultIcon: string = "#ico-personal";

	//#region    ---------- Getters / Setters ----------
	static get observedAttributes() {
		return ["url", "default-ico"];
	}

	set url(url: string) {
		this.#url = url;
		this.refresh();
	}

	//#endregion ---------- /Getters / Setters ----------

	constructor() {
		super();
		adoptStyleSheets(this.attachShadow({ mode: "open" }), _compCss);
	}

	//#region    ---------- Lifecycle ----------
	connectedCallback() {
		super.connectedCallback();
		this.#url = getAttr(this, "url");
		this.#defaultIcon = getAttr(this, "default-icon") ?? this.#defaultIcon;
		this.refresh();
	}

	attributeChangedCallback(name: string, oldVal: any, newVal: any) {
		if (this.initialized) {
			switch (name) {
				case "url":
					this.#url = newVal;
					this.refresh();
					break;
				case "default-ico":
					this.#defaultIcon = newVal;
					this.refresh();
					break;
			}
		}
	}

	refresh() {
		if (this.#url) {
			// Try to load the image
			const img = new Image();
			img.onload = () => {
				// Image loaded successfully
				this.shadowRoot!.innerHTML = `<img src="${this.#url}" alt="Avatar" />`;
			};
			img.onerror = () => {
				// Image failed to load (404 or other error)
				this.showDefaultIcon();
			};
			img.src = this.#url;
		} else {
			// No URL provided, show default icon
			this.showDefaultIcon();
		}
	}

	private showDefaultIcon() {
		if (this.#defaultIcon) {
			this.shadowRoot!.innerHTML = `<div class="default-icon"><c-ico src="${this.#defaultIcon}"></c-ico></div>`;
		}
	}
	//#endregion ---------- /Lifecycle ----------
}
