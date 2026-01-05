<script lang="ts">
	import type { components } from "$generated/api";
	import type { Session } from "$lib/session.svelte";
	import Input from "../ui/input/input.svelte";
  import * as Select from "$lib/components/ui/select/index.js";
	import Button from "../ui/button/button.svelte";
	import { appContext } from "$lib/context";
	import { toast } from "svelte-sonner";
	import ThreadPicker from "../thread-picker.svelte";
	import { SvelteSet } from "svelte/reactivity";
	import Error from "../../../routes/+error.svelte";
  
  let ctx = appContext.get();

  const {
    agent,
    session,
    remove
  }: {
    agent: components["schemas"]["SessionAgentState"],
    session: Session,
    remove: boolean
  } = $props();

  let openThreads: Session['threads']['string'][] = $derived(
		Object.values(session.threads).filter((thread) => thread.state.state === 'open')
	);

  let availableParticipants = $derived.by(() => {
    if (selectedThread === undefined)
      return [];

    if (remove) {
      return selectedThread.participants;
    }
    else {
      return Object.values(session.agents)
        .map(a => a.name)
        .filter(name => !selectedThread.participants.has(name));
    }
  });

	let selectedId: string | undefined = $state();
  let selectedThread = $derived(openThreads.find((thread) => thread.id === selectedId));
  let participantName: string | undefined = $state(undefined);

  async function manageParticipant() {
    if (selectedId === undefined || participantName === undefined)
     return;

    try { 
      if (remove) {
        await ctx.server.removeThreadParticipant(session.sessionId, agent.name, {
          threadId: selectedId,
          participantName: participantName,
        });
      } 
      else {
        await ctx.server.addThreadParticipant(session.sessionId, agent.name, {
          threadId: selectedId,
          participantName: participantName,
        });
      }

      toast.success('Participant ' + (remove ? 'removed' : 'added'));

      selectedId = undefined;
      participantName = undefined;
    } 
    catch (e) {
      toast.error(`${e}`);
    }
  }
</script>

<p>Thread:</p>
<ThreadPicker bind:selectedId threads={openThreads} />

<p>Participant:</p>
<Select.Root type="single" disabled={selectedId === undefined} bind:value={participantName}>
  <Select.Trigger class="w-[280px]">{participantName === '' ? 'Select participant' : participantName}</Select.Trigger>

  <Select.Content>
    {#each availableParticipants as participant}
      <Select.Item value={participant}>{participant}</Select.Item>
    {/each}
  </Select.Content>
</Select.Root>

<Button disabled={selectedId === undefined || participantName === undefined} onclick={manageParticipant}>{remove ? 'Remove participant' : 'Add participant'}</Button>