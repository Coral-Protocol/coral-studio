import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		[
			sveltekit(),
			{
				name: 'cors',
				configureServer: (server) => {
					server.middlewares.use((_, res, next) => {
						res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
						res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
						next();
					});
				}
			}
		]
	],
	server: {
		proxy: {
			'/api': { target: 'http://localhost:5555', changeOrigin: true },
			'/sse': { target: 'http://localhost:5555', changeOrigin: true },
			'/ws': { target: 'http://localhost:5555', changeOrigin: true }
		}
	}
});
