import type { tools } from '$lib/mcptools';
import type { CustomTool } from '$lib/threads';
import type { Handle, RequestEvent } from '@sveltejs/kit';
import { io, Socket } from 'socket.io-client';

let questions: {
	[sessionAgentId: string]: {
		id: string;
		sessionId: string;
		agentId: string;
		agentRequest: string;
		userQuestion?: string;
		agentAnswer?: string;
	};
} = {};

type MaybePromise<T> = Promise<T> | T;
const toolCalls: {
	[K in keyof typeof tools]: ({
		event,
		sessionId,
		agentId
	}: {
		event: RequestEvent;
		sessionId: string;
		agentId: string;
		body: Record<string, unknown> | null;
		getSock: () => Socket;
	}) => MaybePromise<Response>;
} = {
	'user-input-request': ({ sessionId, agentId, getSock, body }) => {
		const sock = getSock();
		const id = crypto.randomUUID();
		const q = {
			id,
			sessionId,
			agentId,
			agentRequest: body?.message as string,
			userQuestion: undefined,
			agentAnswer: undefined,
			timestamp: Date.now()
		};

		questions[`${sessionId}-${agentId}`] = q;
		sock.emit('agent_request', q);
		return new Promise((res) => {
			sock.on('user_response', ({ id: resId, value }) => {
				questions[`${sessionId}-${agentId}`]!.userQuestion = value;
				console.log('user_response', { id, resId, value });
				if (resId !== id) return;
				res(new Response(value));
			});
		});
	},
	'user-input-respond': ({ sessionId, agentId, getSock, body }) => {
		const q = questions[`${sessionId}-${agentId}`];
		if (!q)
			return new Response(
				'Cannot respond to the last question, since no user question has been asked!',
				{
					status: 404
				}
			);
		q.agentAnswer = body?.response as string;
		const sock = getSock();
		sock.emit('agent_answer', { id: q.id, answer: q.agentAnswer });
		return new Response(q.agentAnswer);
	}
};

export const handle: Handle = async ({ event }) => {
	const [tool, sessionId, agentId, ...extra] = event.url.pathname
		.split('/')
		.slice(3)
		.reduce((acc, part) => (part.length > 0 ? [...acc, part] : acc), [] as string[]);
	console.log('svelte side handle', { tool, sessionId, agentId, extra });

	const body = await event.request.json().catch((err) => {
		console.error('Failed to parse JSON body:', err);
		return null;
	});
	if (!tool || !sessionId || !agentId || extra.length > 0)
		return new Response('Not found', { status: 404 });

	if (!(tool in toolCalls)) return new Response(`Tool '${tool}' not found.`, { status: 404 });
	const getSock = () => {
		const uri = `${event.url.origin.replace('https', 'http')}/socket.io/${tool}`;
		return io(uri, {
			auth: { secret: (globalThis as any).socketSecret, tool }
		});
	};
	return toolCalls[tool as keyof typeof toolCalls]({ event, sessionId, agentId, getSock, body });
};
