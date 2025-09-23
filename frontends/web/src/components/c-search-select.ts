import { DSelectElement } from "@dom-native/ui";
import {
  adoptStyleSheets,
  css,
  customElement,
  html,
  OnEvent,
  onEvent,
} from "dom-native";
//// CSS
const _compCss = css`
  .items-con {
    display: flex;
    cursor: default;
    .item {
      display: flex;
      align-items: center;
      border: 1px solid var(--d-field-bdr);
      background-color: var(--clr-gray-200);
      border-radius: 10px;
      padding: 0 0.3rem 0 0.5rem;
      margin-right: 0.5rem;
      .ico-close {
        cursor: pointer;
      }
    }
  }
  .ipt-con {
    flex: 1;
    .ipt-ctrl {
      border: 0;
      outline: 0;
      width: 100%;
    }
  }
`;

/**
 * UNDER REFACTORIZATION DO NOT USE
 *
 * c-search-select is a select component.
 *
 * Usage: `<c-search-select name="fieldA" value="0" popup-css="my-select-popup"><option value="0">Item 0</option></c-search-select>`
 * See:  http://localhost:8080/_spec/controls
 *
 * Attributes:
 *   - See BaseFieldElement.
 *
 * Properties:
 *   - See BaseFieldElement.
 *   - `options: Option[]` The list of options object for this field. Can be initialized with HTML content or with the DATA API.
 *
 * CSS:
 *   - See BaseFieldElement.
 *
 * Content (NOT reflective, just for initialization)
 *   - List of `<option value="1">Value 1</option>` (value must be unique, one can be non present, which === null)
 *   - or shorthand for one option `<c-search-select value="1">Value One</c-search-select>` will create one `<option` with this value/content
 *   - or shorhand for place holder `<c-search-select>Select User</c-search-select>` same as `<c-search-select placeholder="Select User"></c-search-select>`
 *
 * Events:
 *   - `CHANGE` see BaseFieldElement.
 *   - `DATA` with `evt.detail: {sendData: (options: Option[]) => void}` that provide a data callback when the component needs the data.
 *
 */
@customElement("c-search-select")
export class CSearchSelectElement extends DSelectElement {
  #value: any;

  //// Properties
  // options: SelectOption[] = [];

  //// Property (Value)
  get value() {
    return this.#value;
  }
  set value(v: string | null) {
    // if (v == null && this.placeholder) {
    //   this.ctrlEl.part.add("placeholder");
    //   this.ctrlEl.textContent = this.placeholder;
    // } else if (v != null) {
    //   this.ctrlEl.part.remove("placeholder");
    //   this.ctrlEl.textContent = v;
    // }

    this.#value = v;
  }

  // #region    --- UI Events
  @onEvent("pointerup", ".item .ico-close")
  onClick(evt: PointerEvent & OnEvent) {
    evt.stopPropagation();
    let itemEl = evt.selectTarget.closest(".item");
    itemEl?.remove();
  }
  // #endregion --- UI Events

  // #region    --- BaseInput Implementations
  createCtrlEl(): HTMLElement {
    let el = html`
      <div>
        <div class="items-con">
          <div class="item">
            test<c-ico src="#ico-close" class="ico-close"></c-ico>
          </div>
          <div class="item">
            test<c-ico src="#ico-close" class="ico-close"></c-ico>
          </div>
        </div>
        <div class="ipt-con">
          <input name="ipt-ctrl" class="ipt-ctrl" />
        </div>
      </div>
    `;

    return el.firstElementChild as HTMLElement;
  }
  // #endregion --- BaseInput Implementations

  // #region    --- Lifecycle
  // Component initialization (will be called once by BaseHTMLElement on first connectedCallback)
  init() {
    super.init();
    this.classList.add("d-select");
    adoptStyleSheets(this, _compCss);
  }
  // #endregion --- Lifecycle
}

declare global {
  interface HTMLElementTagNameMap {
    "c-search-select": CSearchSelectElement;
  }
}
