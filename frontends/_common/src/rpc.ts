import { deepFreeze } from "utils-min";
import { apiPrx as defaultApiPrx } from "./conf";
import { getCurrentOrgId } from "./user-org-ctx";
import { randomString } from "./utils";
import { webPost } from "./web-request";

export async function rpc_invoke(
	method: string,
	params?: object,
	id?: any,
	orgScoped?: boolean,
	apiPrx?: string
): Promise<any> {
	let orgId = orgScoped ? "/" + getCurrentOrgId() : "";
	apiPrx = apiPrx ?? `${defaultApiPrx}/rpc${orgId}`;
	const data = { id: id ?? randomString(), method, params, jsonrpc: "2.0" };

	const response: any = await webPost(`${apiPrx}`, { body: data });
	if (response.error != null) {
		console.log("ERROR - rpc_invoke - rpc_invoke error", response);
		throw response.error;
	} else {
		return deepFreeze(response.result);
	}
}

export async function request_upload(method: string, params?: { [name: string]: any }): Promise<any> {
	const data = new FormData();
	params = params || {};
	data.append("id", randomString());
	data.append("jsonrpc", "2.0");
	for (const k in params) {
		data.append(k, params[k]);
	}
	const response: any = await webPost(`${defaultApiPrx}/${method}`, { body: data });
	if (response.error != null) {
		console.log("ERROR - request_upload - request_upload error", response);
		throw response.error;
	} else {
		return deepFreeze(response.result);
	}
}
