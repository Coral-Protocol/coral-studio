<script lang="ts">
	import type { components } from "$generated/api";
	import type { Session } from "$lib/session.svelte";
	import Input from "../ui/input/input.svelte";
  import * as Select from "$lib/components/ui/select/index.js";
	import Button from "../ui/button/button.svelte";
	import { appContext } from "$lib/context";
	import { toast } from "svelte-sonner";
	import ThreadPicker from "../thread-picker.svelte";
  
  let ctx = appContext.get();

  const {
    agent,
    session
  }: {
    agent: components["schemas"]["SessionAgentState"],
    session: Session
  } = $props();

  let openThreads: Session['threads']['string'][] = $derived(
		Object.values(session.threads).filter((thread) => thread.state.state === 'open')
	);

  let summary = $state('');
	let selectedId: string | undefined = $state();

  function closeThread() {
    if (selectedId === undefined)
     return;

		ctx.server.closeThread(session.sessionId, agent.name, {
      summary: summary,
      threadId: selectedId
		});

		toast.success('Thread closed');
    selectedId = undefined;
    summary = '';
  }
</script>

<p>Thread:</p>
<ThreadPicker bind:selectedId threads={openThreads} />

<p>Thread summary:</p>
<Input placeholder="Enter summary..." bind:value={summary} />

<Button disabled={summary === ""} onclick={closeThread}>Close thread</Button>