<script lang="ts">
	import type { components } from "$generated/api";
	import { appContext } from "$lib/context";
	import type { Session } from "$lib/session.svelte";
	import { toast } from "svelte-sonner";
	import Button from "../ui/button/button.svelte";

  let ctx = appContext.get();

  const {
    agent,
    session
  }: {
    agent: components["schemas"]["SessionAgentState"],
    session: Session
  } = $props();

  function killAgent() {
    try {
      ctx.server.killAgent(session.sessionId, agent.name);
      toast.success('Agent killed');
    }
    catch (e) {
      toast.error(`${e}`);
    }
  }

</script>

<!-- todo: disable if the agent is not running -->
<Button variant="danger" onclick={killAgent}>Kill agent</Button>