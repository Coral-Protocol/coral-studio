import type { paths } from '$generated/api';
import type { Client } from 'openapi-fetch';
import { Context } from 'runed';
import type { Session } from './session.svelte';
import type { CoralServer } from './coralServer';

export type CoralClient = Client<paths, `${string}/${string}`>;

export type AppContext = {
	server: CoralServer;
	session: Session | null;
};

export const appContext = new Context<AppContext>('app');
