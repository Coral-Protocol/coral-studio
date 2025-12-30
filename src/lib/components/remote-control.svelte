<script lang="ts">
	import type { components } from "$generated/api";
  import * as Accordion from '$lib/components/ui/accordion'
	import type { Session } from "$lib/session.svelte";
	import ManageThreadParticipant from "./remote-control/manage-thread-participant.svelte";
	import CloseThread from "./remote-control/close-thread.svelte";
	import CreateThread from "./remote-control/create-thread.svelte";
	import KillAgent from "./remote-control/kill-agent.svelte";
	import SendMessage from "./remote-control/send-message.svelte";

	const {
    agent,
    session
  }: {
    agent: components["schemas"]["SessionAgentState"],
    session: Session
  } = $props();
</script>

<Accordion.Root type="single" class="w-full sm:max-w-[70%]" value="sendMessage">
  <Accordion.Item value="sendMessage">
    <Accordion.Trigger variant="compact" class="p-4">Send message in thread</Accordion.Trigger>
    <Accordion.Content class="flex flex-col gap-4 text-balance p-4">
      <SendMessage {agent} {session} />
    </Accordion.Content>
  </Accordion.Item>

  <Accordion.Item value="createThread">
    <Accordion.Trigger variant="compact" class="p-4">Create thread</Accordion.Trigger>
    <Accordion.Content class="flex flex-col gap-4 text-balance p-4">
      <CreateThread {agent} {session} />
    </Accordion.Content>
  </Accordion.Item>

  <Accordion.Item value="closeThread">
    <Accordion.Trigger variant="compact" class="p-4">Close thread</Accordion.Trigger>
    <Accordion.Content class="flex flex-col gap-4 text-balance p-4">
      <CloseThread {agent} {session} />
    </Accordion.Content>
  </Accordion.Item>

  <Accordion.Item value="addThreadParticipant">
    <Accordion.Trigger variant="compact" class="p-4">Add thread participant</Accordion.Trigger>
    <Accordion.Content class="flex flex-col gap-4 text-balance p-4">
      <ManageThreadParticipant {agent} {session} remove={false} />
    </Accordion.Content>
  </Accordion.Item>

  <Accordion.Item value="removeThreadParticipant">
    <Accordion.Trigger variant="compact" class="p-4">Remove thread participant</Accordion.Trigger>
    <Accordion.Content class="flex flex-col gap-4 text-balance p-4">
      <ManageThreadParticipant {agent} {session} remove={true} />
    </Accordion.Content>
  </Accordion.Item>

  <Accordion.Item value="killAgent">
    <Accordion.Trigger variant="compact" class="p-4">Kill agent</Accordion.Trigger>
    <Accordion.Content class="flex flex-col gap-4 text-balance p-4">
      <KillAgent {agent} {session} />
    </Accordion.Content>
  </Accordion.Item>
</Accordion.Root>
