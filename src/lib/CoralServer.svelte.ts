import { browser } from '$app/environment';
import { base } from '$app/paths';
import { page } from '$app/state';
import type { components, paths } from '$generated/api';
import createClient from 'openapi-fetch';
import { SvelteSet } from 'svelte/reactivity';

export type Registry =
	paths['/api/v1/registry']['get']['responses']['200']['content']['application/json'][number];
export type RegistryIdentifier = Registry['identifier'];

export type RegistryAgentIdentifier = components['schemas']['RegistryAgentIdentifier'];

export const registryIdOf = (identifier: RegistryIdentifier) =>
	`${identifier.type}${identifier.type === 'linked' ? `/${identifier.linkedServerId}` : ''}`;

export class CoralServer {
	api = $derived.by(() => {
		const token = page.url.searchParams.get('token');
		return createClient<paths>({
			baseUrl: `/${base}`,
			headers: { Authorization: token ? `Bearer ${token}` : undefined }
		});
	});

	// 0/1 local
	// 0/1 marketplace
	// 0+ linked
	catalogs: { [id: string]: Registry } = $state({});

	// TODO (alan): store Session classes here (supa svelty)
	allSessions: { [namespace: string]: string[] } = $state({});

	public alive = $state(false);
	public namespace = $state((browser && localStorage.getItem('namespace')) || 'default');
	public namespaces = $derived(Object.keys(this.allSessions));

	public sessions = $derived(this.allSessions[this.namespace] ?? []);

	constructor() {
		$effect(() => {
			browser && localStorage.setItem('namespace', this.namespace);
			this.fetchSessions(this.namespace);
		});
	}

	public addNamespace(namespace: string) {
		this.allSessions[namespace] = [];
	}

	public async fetchRegistries() {
		const res = await this.api.GET('/api/v1/registry');
		if (res.error) throw new Error(`Error fetching registries`);
		this.catalogs = Object.fromEntries(res.data.map((r) => [r.identifier, r]));
	}

	public async fetchSessions(namespace?: string) {
		if (namespace) {
			const res = await this.api.GET(`/api/v1/sessions/{namespace}`, {
				params: { path: { namespace } }
			});
			if (res.response.status === 404) {
				this.allSessions[namespace] = [];
				return;
			}
			if (res.error) throw new Error(`Error fetching sessions - ${res.error}`);
			this.allSessions[namespace] = res.data;
		} else {
			const res = await this.api.GET('/api/v1/sessions');
			if (res.error) throw new Error(`Error fetching sessions`);
			this.allSessions = Object.fromEntries(res.data.map((s) => [s.namespace, s.sessions]));
		}
	}

	public async fetchAll() {
		await Promise.all([this.fetchRegistries(), this.fetchSessions()]);
	}

	public async lookupAgent(agent: RegistryAgentIdentifier) {}
}
