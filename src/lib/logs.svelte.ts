import { base } from '$app/paths';
import { Context } from 'runed';

export type Log = {
	timestamp: number;
	kind: any;
	message: string;
};
export class AgentLogs {
	// private socket: WebSocket;
	public connected = $state(false);

	public logs: Log[] = $state([]);

	constructor(
		{
			session
		}: {
			session: string;
		},
		agentId: string
	) {
		// this.socket = new WebSocket(
		// 	`${base}/ws/v1/debug/` // FIXME: oub???
		// );
		// this.socket.onopen = () => {
		// 	this.connected = true;
		// };
		// this.socket.onerror = () => {
		// 	this.connected = false;
		// 	this.socket.close();
		// };
		// this.socket.onclose = (e) => {
		// 	this.logs = [];
		// 	this.connected = false;
		// };
		// this.socket.onmessage = (ev) => {
		// 	let data: Log | null = null;
		// 	try {
		// 		data = JSON.parse(ev.data);
		// 	} catch (e) {
		// 		console.log('??', e);
		// 		return;
		// 	}
		//
		// 	data && this.logs.push(data);
		// };
	}
}

export const logContext = new Context<{
	logs: { [agentId: string]: AgentLogs };
	session: string | null;
}>('agentLogs');
