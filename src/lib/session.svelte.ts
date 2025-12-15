import type { Agent, Message, Thread } from './threads';
import { toast } from 'svelte-sonner';

import type { components } from '../generated/api';

export class Session {
	private socket: WebSocket;
	public connected = $state(false);

	readonly host: string;
	readonly appId: string;
	readonly privKey: string;
	readonly session: string;

	public agentId: string | null = $state(null);

	public agents: { [id: string]: Agent } = $state({});
	public threads: {
		[id: string]: Omit<Thread, 'messages'> & { messages: undefined; unread: number };
	} = $state({});
	public messages: { [thread: string]: Message[] } = $state({});

	constructor({
		host,
		appId,
		privacyKey,
		session
	}: {
		host: string;
		appId: string;
		privacyKey: string;
		session: string;
	}) {
		this.host = host;
		this.appId = appId;
		this.privKey = privacyKey;
		this.session = session;
		this.socket = new WebSocket(
			`ws://${host}/ws/v1/debug/${appId}/${privacyKey}/${session}/?timeout=10000`
		);

		this.socket.onopen = () => {
			toast.success('Connected to session.');
			this.connected = true;
		};
		this.socket.onerror = () => {
			toast.error(`Error connecting to session.`);
			this.connected = false;
			this.socket.close();
		};
		this.socket.onclose = (e) => {
			if (this.connected)
				toast.info(`Session connection closed${e.reason ? ` - ${e.reason}` : '.'}`);
			this.threads = {};
			this.agents = {};
			this.connected = false;
		};
		this.socket.onmessage = (ev) => {
			let data = null;
			try {
				data = JSON.parse(ev.data) as components['schemas']['']; // FIXME: oub???
			} catch (e) {
				toast.warning(`ws: '${ev.data}'`);
				return;
			}

			switch (data.type) {
				case 'debug_agent_registered':
					this.agentId = data.id;
					break;
				case 'thread_list':
					for (const thread of data.threads) {
						this.messages[thread.id] = thread.messages ?? [];
						this.threads[thread.id] = {
							...thread,
							messages: undefined,
							unread: 0
						};
					}
					break;
				case 'agent_list':
					for (const agent of data.sessionAgents) {
						this.agents[agent.id] = agent;
					}
					break;
				case 'session':
					switch (data.event.type) {
						case 'agent_state_updated':
							this.agents[data.event.agentId]!.state = data.event.state;
							break;
						case 'thread_created':
							console.log('new thread');
							this.threads[data.event.id] = {
								id: data.event.id,
								name: data.event.name,
								participants: data.event.participants,
								summary: data.event.summary,
								creatorId: data.event.creatorId,
								isClosed: false,
								messages: undefined,
								unread: 0
							};
							this.messages[data.event.id] = [];
							break;
						case 'message_sent':
							if (data.event.threadId in this.messages) {
								console.log('message setn');
								this.messages[data.event.threadId]!.push(data.event.message);
								this.threads[data.event.threadId]!.unread += 1;
							} else {
								console.warn('uh oh', { data: data, messages: this.messages });
							}
							break;
					}
					break;
				case undefined:
				case null:
					toast.error('WS with empty message type! Please report this to the team.');
					console.error('ws type == null', { data });
					break;
				default:
					console.warn('WS data type an expected value', { data });
					break;
			}
		};
	}

	public close() {
		this.socket.close();
	}
}
