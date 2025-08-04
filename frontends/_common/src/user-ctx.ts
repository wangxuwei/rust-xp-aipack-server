import { webGet, webPost } from './web-request.js';

export interface UserContext {
	id: number;
	name: string;
	username: string;
}

export async function login(username: string, pwd: string) {
	const r = await webPost('/api/login', { body: { username, pwd } });
	return r;
}

export async function logoff() {
	const r = await webPost('/api/logoff', {body: {logoff: true}});
	return r;
}

export async function getUserContext(): Promise<UserContext | null> {
	const ucResult = await webGet('/api/user-context');
	return (ucResult && ucResult.result) ? ucResult.result.user: null;
}