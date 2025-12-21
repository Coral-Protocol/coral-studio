<script lang="ts">
	import type { components } from "$generated/api";
  import * as Accordion from '$lib/components/ui/accordion'
	import type { Session } from "$lib/session.svelte";
	import AddThreadParticipant from "./remote-control/add-thread-participant.svelte";
	import CloseThread from "./remote-control/close-thread.svelte";
	import CreateThread from "./remote-control/create-thread.svelte";
	import KillAgent from "./remote-control/kill-agent.svelte";
	import RemoveThreadParticipant from "./remote-control/remove-thread-participant.svelte";
	import SendMessage from "./remote-control/send-message.svelte";

	const {
    agent,
    session
  }: {
    agent: components["schemas"]["SessionAgentState"],
    session: Session
  } = $props();
</script>

<SendMessage {agent} {session} />

<Accordion.Root type="single" class="w-full sm:max-w-[70%]" value="sendMessage">
  <Accordion.Item value="sendMessage">
    <Accordion.Trigger>Send message in thread</Accordion.Trigger>
    <Accordion.Content class="flex flex-col gap-4 text-balance">
      <SendMessage {agent} {session} />
    </Accordion.Content>
  </Accordion.Item>

  <Accordion.Item value="createThread">
    <Accordion.Trigger>Create thread</Accordion.Trigger>
    <Accordion.Content class="flex flex-col gap-4 text-balance">
      <CreateThread {agent} {session} />
    </Accordion.Content>
  </Accordion.Item>

  <Accordion.Item value="closeThread">
    <Accordion.Trigger>Close thread</Accordion.Trigger>
    <Accordion.Content class="flex flex-col gap-4 text-balance">
      <CloseThread {agent} {session} />
    </Accordion.Content>
  </Accordion.Item>

  <Accordion.Item value="addThreadParticipant">
    <Accordion.Trigger>Add thread participant</Accordion.Trigger>
    <Accordion.Content class="flex flex-col gap-4 text-balance">
      <AddThreadParticipant {agent} {session} />
    </Accordion.Content>
  </Accordion.Item>

  <Accordion.Item value="removeThreadParticipant">
    <Accordion.Trigger>Remove thread participant</Accordion.Trigger>
    <Accordion.Content class="flex flex-col gap-4 text-balance">
      <RemoveThreadParticipant {agent} {session} />
    </Accordion.Content>
  </Accordion.Item>

  <Accordion.Item value="killAgent">
    <Accordion.Trigger>Kill agent</Accordion.Trigger>
    <Accordion.Content class="flex flex-col gap-4 text-balance">
      <KillAgent {agent} {session} />
    </Accordion.Content>
  </Accordion.Item>
</Accordion.Root>
