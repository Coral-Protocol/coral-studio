import { browser, building } from '$app/environment';
import { base } from '$app/paths';
import { page } from '$app/state';
import type { components, paths } from '$generated/api';
import createClient, { type Client } from 'openapi-fetch';

import { config } from '$lib/config';
import { createWebsocket } from './websocket.svelte';
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

export type NamespaceData = Omit<components['schemas']['SessionNamespaceState'], 'sessions'> & {
	sessions: {
		[sessionId: string]: components['schemas']['SessionStateBase'];
	};
};

export class CoralServer {
	/** Unwrapped API Client. DO NOT use this without good reason - if the wrapped `api` is missing a method then add it there. **/
	public rawApi = $derived.by(() => {
		const token = building ? '' : page.url.searchParams.get('token');
		return createClient<paths>({
			baseUrl: `${(config.PUBLIC_API_PATH || base) ?? '/'}`,
			headers: { Authorization: token ? `Bearer ${token}` : undefined }
		});
	});

	public onNoAuth = () => {
		console.warn('onNoAuth has not been set!');
	};

	/** Wrapper around our openapi-fetch API client **/

	public api: { GET: APIClient['GET']; POST: APIClient['POST']; DELETE: APIClient['DELETE'] } = {
		GET: async (url, ...init) => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const res = await this.rawApi.GET(url, ...(init as any));
			switch (res.response.status) {
				case 401: {
					this.alive = false;
					this.onNoAuth();
					throw new Error('Invalid auth token!');
				}

				case 200: {
					this.alive = true;
					break;
				}
			}
			return res;
		},
		POST: this.rawApi.POST,
		DELETE: this.rawApi.DELETE
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
	allSessions: {
		[namespace: string]: NamespaceData;
	} = $state({});

	// TODO (alan): better server state repr
	public alive = $state(false);
	public namespace = $state((browser && localStorage.getItem('namespace')) || 'default');
	public namespaces = $derived(Object.keys(this.allSessions));

	public sessions = $derived(this.allSessions[this.namespace]?.sessions ?? {});

	public lsmSock = $derived(
		createWebsocket(`/ws/v1/events/lsm?namespaceFilter=${encodeURIComponent(this.namespace)}`)
	);

	constructor() {
		$effect(() => {
			if (browser) localStorage.setItem('namespace', this.namespace);
			this.fetchSessions(this.namespace);
		});
		$effect(() => {
			console.log('catalogs: ', $state.snapshot(this.catalogs));
		});

		const onmessage = (msg: MessageEvent) => {
			let data;
			try {
				data = JSON.parse(msg.data) as components['schemas']['LocalSessionManagerEvent'];
			} catch {
				toast.warning(`Bad LSM Event: '${msg.data}'`);
				return;
			}
			switch (data.type) {
				case 'namespace_created':
					this.allSessions[data.namespace] = this.allSessions[data.namespace] ?? {
						name: data.namespace,
						annotations: data.namespaceAnnotations,
						// TODO: more data from server please
						deleteOnLastSessionExit: false,
						sessions: {}
					};
					break;
				case 'session_created':
					this.allSessions[data.namespace] = this.allSessions[data.namespace] ?? {
						name: data.namespace,
						annotations: data.namespaceAnnotations,
						// TODO: more data from server please
						deleteOnLastSessionExit: false,
						sessions: {}
					};
					this.allSessions[data.namespace]!.sessions[data.sessionId] = {
						id: data.sessionId,
						namespace: data.namespace,
						timestamp: data.timestamp,
						// TODO: more data from server please
						annotations: {},
						status: { type: 'pending_execution' }
					};
					break;
				case 'session_closing':
					if (!this.allSessions[data.namespace]?.sessions[data.sessionId]) return;
					// TODO: more data from server please
					// this.allSessions[data.namespace]!.sessions[data.sessionId]!.base.status = {
					// 	type: 'closing'
					// };
					break;
				case 'session_closed':
					if (!this.allSessions[data.namespace]?.sessions[data.sessionId]) return;
					// TODO: more data from server please
					break;
				default:
					break;
			}
			if (data.namespace !== this.namespace) {
				console.warn(`skipping event on namespace we care not for (${data.namespace})`);
				return;
			}
		};
		const onopen = () => {
			this.alive = true;
		};
		const onerror = (e: Event) => {
			this.alive = false;
			console.log('LSM sock error', e);
		};
		const onclose = (e: CloseEvent) => {
			this.alive = false;
			console.log('LSM sock closed', e);
		};
		$effect(() => {
			if (!this.lsmSock) return;
			console.debug('rehooking new ws');
			this.lsmSock.onopen = onopen;
			this.lsmSock.onmessage = onmessage;
			this.lsmSock.onerror = onerror;
			this.lsmSock.onclose = onclose;
		});
	}

	public addNamespace(namespace: string) {
		this.allSessions[namespace] = {
			name: namespace,
			annotations: {},
			deleteOnLastSessionExit: false,
			sessions: {}
		};
	}

	public async fetchRegistries() {
		const res = await this.api.GET('/api/v1/registry');
		if (res.error) throw new Error(`Error fetching registries`);
		this.catalogs = Object.fromEntries(
			res.data.map((r) => [
				registryIdOf(r.identifier),
				{
					name: r.name,
					identifier: r.identifier,
					timestamp: r.timestamp,
					agents: Object.fromEntries(r.agents.map((a) => [a.name, a]))
				}
			])
		);
	}

	public async fetchSessions(namespace?: string) {
		if (namespace) {
			const res = await this.api.GET(`/api/v1/local/namespace/{namespace}`, {
				params: { path: { namespace } }
			});
			if (res.response.status === 404) {
				// wrapped GET normally handles this, but 404 usually does not mean good things,
				// so we have to manually mark ourselves alive
				this.alive = true;
				this.addNamespace(namespace);
				return;
			}
			if (res.error) throw new Error(`Error fetching sessions - ${res.error.message}`);

			this.allSessions[namespace] = {
				name: namespace,
				// TODO: more data from server please
				annotations: {},
				deleteOnLastSessionExit: false,
				sessions: Object.fromEntries(res.data.map((s) => [s.id, s]))
			};
		} else {
			const res = await this.api.GET('/api/v1/local');
			if (res.error) throw new Error(`Error fetching sessions`);

			// FIXME: oub
			this.allSessions = Object.fromEntries(
				res.data.map((s) => [
					s.name,
					{
						name: s.name,
						annotations: s.annotations,
						deleteOnLastSessionExit: s.deleteOnLastSessionExit,
						sessions: Object.fromEntries(s.sessions.map((s) => [s.id, s]))
					}
				])
			);
		}
	}

	public async fetchAll() {
		await Promise.all([this.fetchRegistries(), this.fetchSessions()]);
	}

	private detailedRegistry: {
		[catalog: string]: { [id: string]: ReturnType<CoralServer['lookupAgentInner']> };
	} = {};
	public async lookupAgent(agentId: RegistryAgentIdentifier) {
		const catId = registryIdOf(agentId.registrySourceId);
		if (!(catId in this.detailedRegistry)) {
			this.detailedRegistry[catId] = {};
		}
		const agentKey = `${agentId.name}/${agentId.version}`;
		if (!(agentKey in this.detailedRegistry[catId]!)) {
			const res = this.lookupAgentInner(agentId);
			this.detailedRegistry[catId]![agentKey] = res;
		}
		// Safety: must exist because of above guards
		return await this.detailedRegistry[catId]![agentKey]!;
	}

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

	public async createThread(
		sessionId: string,
		puppetAgentName: string,
		input: components['schemas']['CreateThreadInput']
	): Promise<components['schemas']['CreateThreadOutput']> {
		const res = await this.api.POST('/api/v1/puppet/{namespace}/{sessionId}/{agentName}/thread', {
			params: {
				path: { namespace: this.namespace, sessionId: sessionId, agentName: puppetAgentName }
			},
			body: input
		});

		if (res.error) throw new Error(`Error creating thread - ${res.error.message}`);

		return res.data;
	}

	public async closeThread(
		sessionId: string,
		puppetAgentName: string,
		input: components['schemas']['CloseThreadInput']
	) {
		const res = await this.api.DELETE('/api/v1/puppet/{namespace}/{sessionId}/{agentName}/thread', {
			params: {
				path: { namespace: this.namespace, sessionId: sessionId, agentName: puppetAgentName }
			},
			body: input
		});

		if (res.error) throw new Error(`Error closing thread - ${res.error.message}`);

		return res.data;
	}

	public async sendMessage(
		sessionId: string,
		puppetAgentName: string,
		input: components['schemas']['SendMessageInput']
	): Promise<components['schemas']['SendMessageOutput']> {
		const res = await this.api.POST(
			'/api/v1/puppet/{namespace}/{sessionId}/{agentName}/thread/message',
			{
				params: {
					path: { namespace: this.namespace, sessionId: sessionId, agentName: puppetAgentName }
				},
				body: input
			}
		);

		if (res.error) throw new Error(`Error sending message - ${res.error.message}`);

		return res.data;
	}

	public async addThreadParticipant(
		sessionId: string,
		puppetAgentName: string,
		input: components['schemas']['AddParticipantInput']
	) {
		const res = await this.api.POST(
			'/api/v1/puppet/{namespace}/{sessionId}/{agentName}/thread/participant',
			{
				params: {
					path: { namespace: this.namespace, sessionId: sessionId, agentName: puppetAgentName }
				},
				body: input
			}
		);

		if (res.error) throw new Error(`Error adding participant - ${res.error.message}`);
	}

	public async removeThreadParticipant(
		sessionId: string,
		puppetAgentName: string,
		input: components['schemas']['RemoveParticipantInput']
	) {
		const res = await this.api.DELETE(
			'/api/v1/puppet/{namespace}/{sessionId}/{agentName}/thread/participant',
			{
				params: {
					path: { namespace: this.namespace, sessionId: sessionId, agentName: puppetAgentName }
				},
				body: input
			}
		);

		if (res.error) throw new Error(`Error removing participant - ${res.error.message}`);
	}

	public async killAgent(sessionId: string, puppetAgentName: string) {
		const res = await this.api.DELETE('/api/v1/puppet/{namespace}/{sessionId}/{agentName}', {
			params: {
				path: { namespace: this.namespace, sessionId: sessionId, agentName: puppetAgentName }
			}
		});

		if (res.error) throw new Error(`Error removing participant - ${res.error.message}`);
	}
}
