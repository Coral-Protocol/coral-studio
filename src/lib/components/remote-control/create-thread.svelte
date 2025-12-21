<script lang="ts">
	import type { components } from "$generated/api";
	import type { Session } from "$lib/session.svelte";
	import Input from "../ui/input/input.svelte";
  import * as Select from "$lib/components/ui/select/index.js";
	import Button from "../ui/button/button.svelte";
	import { appContext } from "$lib/context";
	import { toast } from "svelte-sonner";
  
  let ctx = appContext.get();

  const {
    agent,
    session
  }: {
    agent: components["schemas"]["SessionAgentState"],
    session: Session
  } = $props();

  let otherAgents = $derived(Object.values(session.agents).map(a => a.name).filter(name => name !== agent.name));

  let participantNames = $state<string[]>([]);
  let threadName = $state('');

  async function createThread() {
    try {
      await ctx.server.createThread(session.sessionId, agent.name, {
        threadName: threadName,
        participantNames
      });

      participantNames = [];
      threadName = '';

      toast.success('Thread created');
    }
    catch (e) {
      toast.error(`${e}`);
    }
  }
</script>

<p>Thread title:</p>
<Input placeholder="Enter thread name..." bind:value={threadName} />

<p>Participants:</p>
<Select.Root type="multiple" disabled={otherAgents.length === 0} bind:value={participantNames}>
  <Select.Trigger class="w-[280px]">{participantNames.length === 0 ? 'Select participants' : `Participants: ${participantNames.join(", ")}`}</Select.Trigger>

  <Select.Content>
    {#each otherAgents as participant}
      <Select.Item value={participant}>{participant}</Select.Item>
    {/each}
  </Select.Content>
</Select.Root>

<Button disabled={threadName === ""} onclick={createThread}>Create thread</Button>