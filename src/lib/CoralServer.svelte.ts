import { base } from '$app/paths';
import { page } from '$app/state';
import type { components, paths } from '$generated/api';
import createClient from 'openapi-fetch';

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

	public alive = $state(false);

	// there is guaranteed local catalog?
	// only one local/marketplace catalog?

	catalogs: { [id: string]: Registry } = $state({});

	// TODO (alan): store Session classes here (supa svelty)
	sessions: { [namespace: string]: string[] } = $state({});

	public async fetchRegistries() {
		const res = await this.api.GET('/api/v1/registry');
		if (res.error) throw new Error(`Error fetching registries`);
		this.catalogs = Object.fromEntries(res.data.map((r) => [r.identifier, r]));
	}

	public async fetchSessions(namespace?: string) {
		const res = await (namespace
			? this.api.GET(`/api/v1/sessions/{namespace}`, { params: { path: { namespace } } })
			: this.api.GET('/api/v1/sessions'));
		if (res.error) throw new Error(`Error fetching sessions - ${res.error}`);
		if (namespace) {
			this.sessions[namespace] = res.data;
		} else {
			//this.sessions = res.data; // FIXME: oub please make list all sessions include the namespace
		}
	}

	public async fetchAll() {
		await Promise.all([this.fetchRegistries(), this.fetchSessions()]);
	}

	public async lookupAgent(agent: RegistryAgentIdentifier) {}
}
