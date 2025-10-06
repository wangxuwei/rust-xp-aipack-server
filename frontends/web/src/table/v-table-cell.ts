import { BaseViewElement } from "common/v-base.js";
import { adoptStyleSheets, css, customElement, html, onEvent, setAttr, trigger } from "dom-native";
import { isNotEmpty } from "utils-min";

//// CSS
const _compCss = css`
	:host {
		display: flex;
	}
	:host .col-name {
		color: var(--txt-light);
	}

	:host .order {
		display: flex;
		flex-direction: column;
		margin-left: 0.5rem;
	}

	:host .order c-ico {
		width: 0.75rem;
		height: 0.75rem;
	}

	:host .order c-ico {
		position: relative;
		top: 2px;
	}

	:host .order c-ico.down {
		position: relative;
		top: -2px;
	}

	:host .order c-ico::part(symbol) {
		fill: var(--clr-gray-500);
	}

	:host .order[sort-type="asc"] c-ico.up::part(symbol) {
		fill: var(--clr-gray-700);
	}

	:host .order[sort-type="desc"] c-ico.down::part(symbol) {
		fill: var(--clr-gray-700);
	}
`;

@customElement("v-table-cell")
export class TableCell extends BaseViewElement {
	#orderEl: HTMLElement | undefined;

	//#region    ---------- Element & Hub Events ----------
	@onEvent("click")
	onClick(evt: MouseEvent) {
		if (!this.sortColumn) {
			return;
		}
		let type = this.sortType;
		if (!type) {
			type = "asc";
		} else {
			type = type == "asc" ? "desc" : "asc";
		}

		setAttr(this, "sort-type", type);
		trigger(this, "SORT_CHANGE", {
			detail: { sortColumn: this.sortColumn, sortType: this.sortType },
			cancelable: false,
		});
	}
	//#endregion    ---------- /Element & Hub Events ----------

	//#region    ---------- Lifecycle ----------
	static get observedAttributes(): string[] {
		return ["sort-type", "sort-column"];
	}

	constructor() {
		super();
		const shadowEl = _renderShadow(isNotEmpty(this.sortColumn));
		this.attachShadow({ mode: "open" }).append(shadowEl);
		adoptStyleSheets(this, _compCss);
	}

	get sortColumn() {
		return this.getAttribute("sort-column") ?? "";
	}

	get sortType() {
		return this.getAttribute("sort-type") ?? "";
	}

	attributeChangedCallback(name: string, oldVal: any, newVal: any) {
		if (this.initialized) {
			switch (name) {
				case "sort-type":
					if (this.#orderEl) {
						setAttr(this.#orderEl!, "sort-type", newVal);
					}
					break;
				case "sort-column":
					this.refresh();
					break;
			}
		}
	}

	init() {
		super.init();
		this.classList.add("cell");
		this.refresh();
	}

	refresh() {
		if (this.sortColumn) {
			this.#orderEl = html`
				<div class="order">
					<c-ico src="#ico-t-up" class="up"></c-ico>
					<c-ico src="#ico-t-down" class="down"></c-ico>
				</div>
			`.firstElementChild as HTMLElement;
			this.shadowRoot!.append(this.#orderEl);
			setAttr(this.#orderEl!, "sort-type", this.sortType);
		} else {
			this.#orderEl?.remove();
		}
	}

	//#endregion ---------- /Lifecycle ----------

	//#region    ---------- Private Functions ----------

	//#endregion ---------- /Private Functions ----------
}

function _renderShadow(showOrder: boolean) {
	let html_tmpl = `<div class="col-name"><slot><slot></div>`;
	return html(html_tmpl);
}
