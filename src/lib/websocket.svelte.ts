import { browser } from '$app/environment';
import { PUBLIC_API_PATH } from '$env/static/public';

export const createWebsocket = (path: `ws/${string}`) => {
	if (!browser) return null;
	return new WebSocket(
		`${window.location.protocol == 'https:' ? 'wss' : 'ws'}://${window.location.host}${PUBLIC_API_PATH}${path}`
	);
};
