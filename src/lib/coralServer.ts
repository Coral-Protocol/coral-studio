import { base } from '$app/paths';
import { page } from '$app/state';
import type { components, paths } from '$generated/api';
import createClient from 'openapi-fetch';

export type Registry =
	paths['/api/v1/registry']['get']['responses']['200']['content']['application/json'][number];
export type RegistryIdentifier = Registry['identifier'];

export type RegistryAgentIdentifier = components['schemas']['RegistryAgentIdentifier'];

export const registryIdOf = (identifier: RegistryIdentifier) =>
	`${identifier.type}${identifier.type === 'linked' ? `-${identifier.linkedServerId}` : ''}`;

export class CoralServer {
	api = $derived.by(() => {
		const token = page.url.searchParams.get('token');
		return createClient<paths>({
			baseUrl: `/${base}`,
			headers: { Authorization: token ? `Bearer ${token}` : undefined }
		});
	});

	catalogs: { [id: string]: Registry } = $state({});

	public async lookupAgent(agent: RegistryAgentIdentifier) {}
}
