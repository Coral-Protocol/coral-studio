import type { paths } from '$generated/api';
import type { Client } from 'openapi-fetch';
import { Context } from 'runed';
import type { Session } from './session.svelte';
import type { Registry } from './threads';

export type CoralClient = Client<paths, `${string}/${string}`>;

export type AppContext = {
	client: CoralClient;
	session: Session | null;
	registry: Registry | null;
	sessions: string[] | null;
};

export const appContext = new Context<AppContext>('app');
