import { Context } from 'runed';
import type { Session } from './session.svelte';
import type { components, operations, paths } from '../generated/api';
import type { Client } from 'openapi-fetch';

export type Message = any; // components['schemas']['']; // FIXME: oub??

export type Thread = any; // components['schemas']['ResolvedThread']; // FIXME: oub??

export type AgentOption = {
	name: string;
	description?: string;
	value: string | undefined;
} & ({ type: 'string'; default: string | null } | { type: 'number'; default: number | null });

export type Agent = any; //components['schemas']['SessionAgent']; // FIXME: oub??
export type PublicRegistryAgent = components['schemas']['PublicRegistryAgent'];
export type Registry =
	operations['getRegistryAgents']['responses']['200']['content']['application/json'];

export const idAsKey = (id: PublicRegistryAgent['id']): string => `${id.name}${id.version}`;

export type GraphAgentRequest = components['schemas']['GraphAgentRequest'];

export type ToolTransport = {
	type: 'http';
	url: string;
};

export type CustomTool = components['schemas']['CustomTool'];

export const sessionCtx = new Context<{
	client: Client<paths, `${string}/${string}`> | null;
	session: Session | null;
	registry: Registry | null;
	sessions: string[] | null;
	connection: { host: string; appId: string; privacyKey: string } | null;
}>('sessionCtx');
