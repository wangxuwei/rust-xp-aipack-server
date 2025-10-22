## Views like dg-*.ts or v-*.ts Best Practices

These are the best practices for dg-*.ts or v-*.ts

### v-*.ts

Here is an example of a view 

````ts
import { BaseViewElement } from 'common/v-base.js';
import { customElement, onHub, OnEvent } from 'dom-native';
import { Wks } from '../bindings/entities.js';

@customElement('v-users')
export class UsersView extends BaseViewElement {
  #userContext:UserContext;

	//// Key elements
	private get buttonEl():HTMLElement { return first(this, 'button.do')! };

	//#region    ---------- Data Setters ---------- 
	set userContext(v: UserContext) {
		this.#userContext = v;
	}
	//#endn pregion ---------- /Data Setters ---------- 

	//#region    ---------- Events---------- 
  @onEvent('click', 'btn-do')
	headerClicked(evt: MouseEvent & OnEvent) {
		this.doLogin();
	}
	//#endregion ---------- /Events---------- 

	//#region    ---------- Hub Events ---------- 
	@onHub('routeHub', 'CHANGE')
	routChange() {
		this.refresh()
	}
	//#endregion ---------- /Hub Events ---------- 


	//#region    ---------- Data Event ---------- 
	@onHub('dcoHub', 'user', 'create,update,delete')
	onUserChange() {
		this.refresh();
	}
	//#endregion ---------- /Data Event ---------- 


	//#region ---------- Lifecycle ---------- 
	init() {
		super.init();
		this.refresh();
	}

	async refresh() {
		this.innerHTML = _render();
	}
	//#endregion ---------- /Lifecycle ---------- 

	//#region ---------- Private functions ---------- 
  otherFunc(){

  }
	//#endregion ---------- /Private functions ---------- 
}

//// HTMLs

function _render(wksList: Wks[] = []) {
	let html = `
    <div>demo codes here</div>
    <button class="btn-do">click me</button>
  `;

	return html;

}
````

- the name for @customElement('v-users') to regist, it will be use like "<v-users></v-users>", should be kebab case and start with v- or dg-
- the UsersView is view class name, which should be pascal case which extends Base view element
- @onEvent, which bind a dom event, the first param is event type, and section is child selector
- @onHub, which bind a hub event, the first param is Hub name, the section is custom event name, which should be upper snake case
- init() and refresh() methods which is lifecycle for the view.
- the _render() will return the html codes which be rendered to the view
- for the event binding, the ```@onEvent('click', 'button.do')``` will be triggered when the "click me" clicked
- for the hub event ```@onHub('routeHub', 'CHANGE')```, will be triggered when call ```hub("routeHub").pub("Change", { some_data: {}})```
- the key elements can be some child dom object, and should be at top, unless there are some private views, do not have this part if not need
- for private fields, should be start with #, and it is camel case
- all codes should be organized with region comments by itself
- for ````//// Key elements```` is only start tag and place it before the key elements function
- all views should be in views/, or views/subfolder../
- the dcoHub event is for some objects change
- if the pcss file name match a view for examples, v-users.pcss match the name v-users.ts, all css codes with pcss best practice will wrote in the pcss file, make sure when create a view component, create the pcss file

- when bind event, should always follow the rules the like onEvent, onHub
- for the _render() should always define outside the view, and return html
- the priviate methods should not startWith "#"
- better to use "pointer" events than "mouse" events



### tips:
when bind event for document use @onDoc instead of @onEvent
like:
```
	@onDoc("click")
	onDocumentClick(evt: Event) {
		if (this.#isDropdownOpen && !this.contains(evt.target as Node)) {
			this.#isDropdownOpen = false;
			this.refresh();
		}
	}
```


