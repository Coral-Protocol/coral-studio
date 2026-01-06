import type { CustomTool } from './threads';

export const tools = {
	'user-input-request': {
		transport: {
			type: 'http',
			url: '/api/mcp-tools/user-input-request'
		},
		schema: {
			name: 'request-question',
			description: 'Request a question from the user. Hangs until input is received.',
			inputSchema: {
				type: 'object',
				properties: {
					//@ts-ignore // FIXME: upstream typing
					message: { type: 'string', description: 'Message to show to the user.' }
				}
			}
		}
	},
	'user-input-respond': {
		transport: {
			type: 'http',
			url: '/api/mcp-tools/user-input-respond'
		},
		schema: {
			name: 'answer-question',
			description:
				'Answer the last question you requested from the user. You can only respond once, and will have to request more input later.',
			inputSchema: {
				type: 'object',
				properties: {
					//@ts-ignore // FIXME: upstream typing
					response: { type: 'string', description: 'Answer to show to the user.' }
				},
				required: ['response']
			}
		}
	}
} satisfies { [name: string]: CustomTool };
