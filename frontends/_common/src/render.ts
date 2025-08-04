// <origin src="https://raw.githubusercontent.com/BriteSnow/cloud-starter/master/frontends/web/src/ts/render.ts" />
// (c) 2019 BriteSnow, inc - This code is licensed under MIT license (see LICENSE for details)

import { html } from 'dom-native';
import * as Handlebars from "handlebars";



export function render(templateName: string, data?: any): DocumentFragment {

	// call the function and return the result
	return html(renderAsString(templateName, data));
}

export function renderAsString(templateName: string, data?: any) {
	var tmpl = Handlebars.templates[templateName];

	// if not found, throw an error
	if (!tmpl) {
		throw "Not template found in pre-compiled and in DOM for " + templateName;
	}

	return tmpl(data);
}