import type { SessionAgentState } from './session.svelte';

export type AgentStateEnum = 'disconnected' | 'connecting' | 'listening' | 'busy' | 'dead';
export const agentStateOf = (agent: SessionAgentState): AgentStateEnum =>
	agent.isConnected ? (agent.isWaiting ? 'listening' : 'busy') : 'disconnected';
