<script lang="ts">
	import type { components } from '$generated/api';
	import type { Session } from '$lib/session.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import Textarea from '../ui/textarea/textarea.svelte';
	import Checkbox from '../ui/checkbox/checkbox.svelte';
	import Label from '../ui/label/label.svelte';
	import { appContext } from '$lib/context';
	import { toast } from 'svelte-sonner';
	import ThreadPicker from '../thread-picker.svelte';
  import * as Select from "$lib/components/ui/select/index.js";
	import { SvelteSet } from 'svelte/reactivity';

	let ctx = appContext.get();

	const {
		agent,
		session
	}: {
		agent: components['schemas']['SessionAgentState'];
		session: Session;
	} = $props();

	let messageContent = $state('');
	let selectedId: string | undefined = $state();

	let mentions = $state<string[]>([]);
	let openThreads: Session['threads']['string'][] = $derived(
		Object.values(session.threads).filter((thread) => thread.state.state === 'open')
	);

	let selectedThread = $derived(openThreads.find((thread) => thread.id === selectedId));
  let otherParticipants = $derived.by(() => {
    let set = selectedThread?.participants;
    if (!set)
      return new SvelteSet<string>();

    // can't mention self
    set.delete(agent.name);
    return set;
  });

	async function sendMessage() {
		if (selectedId === undefined) return;

    try {
      await ctx.server.sendMessage(session.sessionId, agent.name, {
        threadId: selectedId,
        content: messageContent,
        mentions: mentions
      });

      toast.success('Message sent');
    }
    catch (e) {
      toast.error(`${e}`);
    }
	}
</script>

<p>Message:</p>
<Textarea placeholder="Type your message..." bind:value={messageContent} />

<p>Thread:</p>
<ThreadPicker bind:selectedId threads={openThreads} />

<p>Mentions:</p>
<Select.Root type="multiple" disabled={otherParticipants.size === 0} bind:value={mentions}>
  <Select.Trigger class="w-[280px]">{mentions.length === 0 ? 'Select mentions' : `Mentioning ${mentions.join(", ")}`}</Select.Trigger>

  <Select.Content>
    {#each otherParticipants as participant}
      <Select.Item value={participant}>{participant}</Select.Item>
    {/each}
  </Select.Content>
</Select.Root>

<Button disabled={selectedThread === undefined} onclick={sendMessage}>Send message</Button>

