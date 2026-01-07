import { browser } from '$app/environment';
import { PUBLIC_API_PATH } from '$env/static/public';

export const createWebsocket = (path: `/ws/${string}`) => {
	if (!browser) return null;
	let url = PUBLIC_API_PATH;
	if (url[0] === '/') {
		url = `${window.location.protocol == 'https:' ? 'wss' : 'ws'}://${window.location.host}${url}`;
	} else if (url[0] === 'h') {
		url = url.replace(/^http/, 'ws');
	} else {
		console.error('Bad PUBLIC_API_PATH!', { path: PUBLIC_API_PATH });
	}
	return new WebSocket(url + path);
};
