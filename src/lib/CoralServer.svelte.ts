import { browser, building } from '$app/environment';
import { base } from '$app/paths';
import { page } from '$app/state';
import type { components, paths } from '$generated/api';
import createClient, { type Client } from 'openapi-fetch';
import { toast } from 'svelte-sonner';

export type Registry =
	paths['/api/v1/registry']['get']['responses']['200']['content']['application/json'][number];

export type RegistryAgent = components['schemas']['RegistryAgent'];

export type RegistryIdentifier = Registry['identifier'];

export type RegistryAgentIdentifier = components['schemas']['RegistryAgentIdentifier'];

export const registryIdOf = (identifier: RegistryIdentifier) =>
	`${identifier.type}${identifier.type === 'linked' ? `/${identifier.linkedServerId}` : ''}`;

export const agentIdOf = (agentId: RegistryAgentIdentifier) =>
	`${registryIdOf(agentId.registrySourceId)}/${agentId.name}:${agentId.version}`;

type APIClient = Client<paths, `${string}/${string}`>;
export class CoralServer {
	/** Unwrapped API Client. DO NOT use this without good reason - if the wrapped `api` is missing a method then add it there. **/
	public rawApi = $derived.by(() => {
		const token = building ? '' : page.url.searchParams.get('token');
		return createClient<paths>({
			baseUrl: `${base ?? '/'}`,
			headers: { Authorization: token ? `Bearer ${token}` : undefined }
		});
	});

	/** Wrapper around our openapi-fetch API client **/
	public api: { GET: APIClient['GET']; POST: APIClient['POST'] } = {
		GET: async (url, ...init) => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const res = await this.rawApi.GET(url, ...(init as any));
			switch (res.response.status) {
				case 401: {
					toast.error('Invalid auth token!');
					this.alive = false;
					throw new Error('Invalid auth token!');
				}
				case 200: {
					this.alive = true;
				}
			}
			return res;
		},
		POST: this.rawApi.POST
	};

	// 0/1 local
	// 0/1 marketplace
	// 0+ linked
	catalogs: {
		[id: string]: Omit<Registry, 'agents'> & {
			agents: { [name: string]: components['schemas']['RegistryAgentCatalog'] };
		};
	} = $state({});

	// TODO (alan): store Session classes here (supa svelty)
	allSessions: { [namespace: string]: string[] } = $state({});

	// TODO (alan): better server state repr
	public alive = $state(false);
	public namespace = $state((browser && localStorage.getItem('namespace')) || 'default');
	public namespaces = $derived(Object.keys(this.allSessions));

	public sessions = $derived(this.allSessions[this.namespace] ?? []);

	constructor() {
		$effect(() => {
			if (browser) localStorage.setItem('namespace', this.namespace);
			this.fetchSessions(this.namespace);
		});
		$effect(() => {
			console.log('catalogs: ', $state.snapshot(this.catalogs));
		});
	}

	public addNamespace(namespace: string) {
		this.allSessions[namespace] = [];
	}

	public async fetchRegistries() {
		const res = await this.api.GET('/api/v1/registry');
		if (res.error) throw new Error(`Error fetching registries`);
		this.catalogs = Object.fromEntries(
			res.data.map((r) => [
				registryIdOf(r.identifier),
				{
					identifier: r.identifier,
					timestamp: r.timestamp,
					agents: Object.fromEntries(r.agents.map((a) => [a.name, a]))
				}
			])
		);
	}

	public async fetchSessions(namespace?: string) {
		if (namespace) {
			const res = await this.api.GET(`/api/v1/sessions/{namespace}`, {
				params: { path: { namespace } }
			});
			if (res.response.status === 404) {
				// wrapped GET normally handles this, but 404 usually does not mean good things,
				// so we have to manually mark ourselves alive
				this.alive = true;
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

	private detailedRegistry: {
		[catalog: string]: { [id: string]: Awaited<ReturnType<CoralServer['lookupAgentInner']>> };
	} = {};
	public async lookupAgent(agentId: RegistryAgentIdentifier) {
		const catId = registryIdOf(agentId.registrySourceId);
		if (!(catId in this.detailedRegistry)) {
			this.detailedRegistry[catId] = {};
		}
		const agentKey = `${agentId.name}/${agentId.version}`;
		if (!(agentKey in this.detailedRegistry[catId]!)) {
			const res = await this.lookupAgentInner(agentId);
			this.detailedRegistry[catId]![agentKey] = res;
		}
		// Safety: must exist because of above guards
		return this.detailedRegistry[catId]![agentKey]!;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	private async lookupAgentInner(agent: RegistryAgentIdentifier) {
		switch (agent.registrySourceId.type) {
			case 'local': {
				const res = await this.api.GET('/api/v1/registry/local/{agentName}/{agentVersion}', {
					params: { path: { agentName: agent.name, agentVersion: agent.version } }
				});
				if (res.error) throw new Error(`Could not fetch agent details - ${res.error.message}`);
				return res.data;
			}
			case 'marketplace': {
				const res = await this.api.GET('/api/v1/registry/marketplace/{agentName}/{agentVersion}', {
					params: { path: { agentName: agent.name, agentVersion: agent.version } }
				});
				if (res.error) throw new Error(`Could not fetch agent details - ${res.error.message}`);
				return res.data;
			}
			case 'linked': {
				const res = await this.api.GET(
					'/api/v1/registry/linked/{linkedServerName}/{agentName}/{agentVersion}',
					{
						params: {
							path: {
								linkedServerName: agent.registrySourceId.linkedServerId,
								agentName: agent.name,
								agentVersion: agent.version
							}
						}
					}
				);
				if (res.error) throw new Error(`Could not fetch agent details - ${res.error.message}`);
				return res.data;
			}
		}
	}
}
