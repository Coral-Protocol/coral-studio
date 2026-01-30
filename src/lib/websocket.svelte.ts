import { browser } from '$app/environment';
import { config } from '$lib/config';

export const createWebsocket = (path: `/ws/${string}`) => {
	if (!browser) return null;
	let url = config.PUBLIC_API_PATH;
	if (url[0] === '/') {
		url = `${window.location.protocol == 'https:' ? 'wss' : 'ws'}://${window.location.host}${url.replace(/\/$/, '')}`;
	} else if (url[0] === 'h') {
		url = url.replace(/^http/, 'ws').replace(/\/$/, '');
	} else {
		console.error('Bad PUBLIC_API_PATH!', { path: config.PUBLIC_API_PATH });
	}
	return new WebSocket(url + path);
};
