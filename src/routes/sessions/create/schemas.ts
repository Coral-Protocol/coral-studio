import type { PublicRegistryAgent } from '$lib/threads';
import { registry, z } from 'zod/v4';

const formSchema = z.object({
	applicationId: z.string().nonempty(),
	privacyKey: z.string().nonempty(),
	agents: z.array(
		z.object({
			id: z.object({
				name: z.string().nonempty(),
				version: z.string().nonempty()
			}),
			name: z.string().nonempty(),
			provider: z.discriminatedUnion('type', [
				z.object({
					type: z.literal('local'),
					runtime: z.union([z.literal('executable'), z.literal('docker')])
				})
			]),
			systemPrompt: z.string().optional(),
			customToolAccess: z.set(z.string()),
			blocking: z.boolean(),
			options: z.record(
				z.string(),
				z.discriminatedUnion('type', [
					z.object({ type: z.literal('string'), value: z.string() }),
					z.object({ type: z.literal('secret'), value: z.string() }),
					z.object({ type: z.literal('number'), value: z.number() })
				])
			)
		})
	),
	groups: z.array(z.array(z.string()))
});

export const makeFormSchema = (registryAgents: { [agent: string]: PublicRegistryAgent }) =>
	formSchema.superRefine((data, ctx) => {
		data.agents.forEach((agent, i) => {
			const regAgent = registryAgents[`${agent.id.name}${agent.id.version}`];
			if (!regAgent) {
				ctx.addIssue({
					code: 'custom',
					path: ['agent', i, 'agentName'],
					message: `Agent name ${agent.id.name}@${agent.id.version} not found in registry.`
				});
				return;
			}
			if (regAgent.runtimes.indexOf(agent.provider.runtime) === -1) {
				ctx.addIssue({
					code: 'custom',
					path: ['agent', i, 'provider', 'runtime'],
					message: `Runtime ${agent.provider.runtime} not available for this agent.`
				});
			}
			const options = Object.entries(regAgent.options ?? {});
			for (const [name, opt] of options) {
				if ('default' in opt && opt.default !== undefined) continue;
				const val = agent.options[name];
				if (!val || (val.type === 'string' && val.value.length === 0)) {
					ctx.addIssue({
						code: 'custom',
						path: ['agents', i, 'options', name],
						message: `Missing required option: ${name}`
					});
				}
			}
		});
	});

export type FormSchema = typeof formSchema;
