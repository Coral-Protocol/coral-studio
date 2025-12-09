import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type ViteDevServer } from 'vite';

import { Server } from 'socket.io';
import injectSocketIO from './socketio';

(globalThis as any).socketSecret = crypto.randomUUID();

export const webSocketServer = {
	name: 'webSocketServer',
	configureServer(server: ViteDevServer) {
		if (!server.httpServer) return;
		const io = new Server(server.httpServer, { path: '/socket.io' });
		injectSocketIO(io);
	}
};

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()]
});
