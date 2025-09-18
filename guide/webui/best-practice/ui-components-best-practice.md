## UI common components Best Practices

These are the best practices for ui components

### common components only with css

when we need to common component, which dont have logic with typescript, then we just use pcss to style dom elemnts

### common components with typescript and css

- when we need to common component, but also need to typescript, create a view component like views best practice
- when the component do not need custom service data (single ui component), means not use have http request event just provide params, and we can use another way
like below

```
import { adoptStyleSheets, BaseHTMLElement, css, customElement, html } from 'dom-native';
const { assign } = Object;

//// CSS
const _compCss = css`
	:host{
		--ico-fill: black;
		text-transform: none; 
		padding: 0;
		margin: 0;
		width: 1rem;
		height: 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
		user-select: none;
	}
	
	svg{
		width: 100%;
		height: 100%;
		fill: var(--ico-fill);		
	}
`;


@customElement('c-ico')
class IcoElement extends BaseHTMLElement {
	static _BASE_URL_: string = '/svg/sprite.svg';

	get src() { return this.getAttribute('src') ?? '' };

	constructor() {
		super();
		this.attachShadow({ mode: 'open' }).append(_renderShadow(this.src));
		adoptStyleSheets(this, _compCss);
	}

}



//// Shadow Render
function _renderShadow(src: string) {

	const href = src.startsWith('#') ? `${IcoElement._BASE_URL_}${src}` : src;
	const content = html`
	<svg class="symbol">
	<use xlink:href="${href}" aria-hidden="true"></use>
	</svg>`;

	return content;
}
```

then we can use like 
```
	<c-ico class="do-close" src="#ico-close"></c-ico>
```