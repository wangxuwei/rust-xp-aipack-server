import { BaseViewElement } from "common/v-base";
import { append, customElement, onEvent, OnEvent, trigger } from "dom-native";

/**
 * Attributes:
 * support-count, record label
 */
@customElement("v-pagination")
export class PaginationView extends BaseViewElement {
	#pageSize: number = 3;
	#pageIndex: any;
	#count: number = 0;
	#recordLabel: string = "record";
	#supportCount: boolean = true;

	#nextToken: string = "";
	#lastTokens: string[] = [];
	#hasNext: boolean = false;
	initData?: any;

	static get observedAttributes(): string[] {
		return ["support-count", "record-label", "count", "has-next"];
	}

	attributeChangedCallback(attrName: string, oldVal: any, newVal: any) {
		switch (attrName) {
			case "support-count":
				this.supportCount = newVal == "false" ? false : true;
				break;
			case "record-label":
				this.recordLabel = newVal;
		}
	}

	set recordLabel(val: string) {
		this.#recordLabel = val || "record";
	}

	set supportCount(val: boolean) {
		this.#supportCount = val;
	}

	set pageSize(val: number) {
		this.#pageSize = val || 200;
	}

	set pageIndex(val: number) {
		this.#pageSize = val;
	}

	set count(val: number) {
		this.#count = val || 0;
	}

	set nextPageToken(val: string) {
		this.#nextToken = val;
	}

	refreshInfo(pageIndex: any, countOrToken: any, hasNext?: boolean) {
		this.#pageIndex = pageIndex;
		if (this.#supportCount) {
			this.#count = countOrToken;
		} else {
			this.#nextToken = countOrToken;
			this.#hasNext = hasNext!;
		}
		this.refresh();
	}

	//#region    ---------- Element & Hub Events ----------

	@onEvent("click", ".action.next:not(.disabled)")
	clickToNext(evt: MouseEvent) {
		if (this.#supportCount) {
			this.#pageIndex++;
			this.checkPageIndex();
		} else {
			this.#lastTokens.push(this.#pageIndex);
			this.#pageIndex = this.#nextToken;
		}
		this.process();
	}

	@onEvent("click", ".action.prev:not(.disabled)")
	clickToPrev(evt: MouseEvent) {
		if (this.#supportCount) {
			this.#pageIndex--;
			this.checkPageIndex();
		} else {
			this.#nextToken = this.#pageIndex;
			this.#pageIndex = this.#lastTokens.pop();
		}
		this.process();
	}

	@onEvent("keyup", "input[name='numOfPages']")
	keyupOnInput(evt: MouseEvent & OnEvent) {
		const inputEl = evt.selectTarget as HTMLInputElement;
		if (evt.which == 13) {
			if (this.#supportCount) {
				const num = parseInt(inputEl.value);
				if (!isNaN(num)) {
					this.#pageIndex = num - 1;
					this.checkPageIndex();
				}
				this.process();
			}
		}
	}
	//#endregion ---------- /Element & Hub Events ----------

	//#region ---------- LifeCyle methods ----------
	init() {
		super.init();
		this.refresh();
	}

	refresh() {
		const plural = this.#count == 1 ? false : true;
		let totalPages = Math.ceil(this.#count / this.#pageSize);
		if (totalPages <= 0) {
			totalPages = 1;
		}

		let prevDisable = true;
		let nextDisable = true;
		this.#pageIndex = this.#pageIndex || 0;
		if (this.#supportCount) {
			prevDisable = this.#pageIndex <= 0 ? true : false;
			nextDisable = this.#pageIndex >= totalPages - 1 ? true : false;
		} else {
			prevDisable = this.#lastTokens.length == 0 ? true : false;
			nextDisable = !this.#nextToken && !this.#hasNext ? true : false;
		}

		const obj = {
			numberOfPages: this.#pageIndex + 1,
			totalPages: totalPages,
			totalCount: this.#count,
			plural: plural,
			nextDisable: nextDisable,
			prevDisable: prevDisable,
			recordLabel: this.#recordLabel,
			showCount: this.#supportCount,
		};
		append(this, _renderInfo(obj), "empty");
	}

	//#endregion ---------- / Lifecyle methods ----------

	//#region ---------- Private Methods ----------

	private checkPageIndex() {
		if (this.#pageIndex < 0) {
			this.#pageIndex = 0;
		}

		const totalPages = Math.floor(this.#count / this.#pageSize);
		if (this.#pageIndex > totalPages) {
			this.#pageIndex = totalPages;
		}
	}

	private process() {
		trigger(this, "PAGE_CHANGE", {
			detail: { pageIndex: this.#pageIndex, pageSize: this.#pageSize },
			cancelable: false,
		});
	}

	//#endregion ---------- / Private Methods ----------
}

function _renderInfo(obj: any) {
	let html = `
		<div class="page-section">
			<div class="action prev ${obj.prevDisable ? "disabled" : ""}">&lt;&lt;&nbsp;Prev</div>
			<span class="number-info">`;
	if (obj.showCount) {
		html += `
				<input class="ctl" name="numOfPages" value="${obj.numberOfPages}" autocomplete="off"/>
				<span class="sep">/</span>
				<span class="total-pages">${obj.totalPages}</span>`;
	}
	html += `
			</span>
			<div class="action next ${obj.nextDisable ? "disabled" : ""}">Next&nbsp;&gt;&gt;</div>
		</div>`;
	if (obj.showCount) {
		html += `
		<div class="count-section">
			<span class="count">Total ${obj.totalCount} ${obj.recordLabel}${obj.plural ? "s" : ""}</span>
		</div>
			`;
	}
	return html;
}
