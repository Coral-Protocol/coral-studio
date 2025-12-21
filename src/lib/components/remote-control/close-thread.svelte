<script lang="ts">
	import type { components } from "$generated/api";
	import type { Session } from "$lib/session.svelte";

  const {
    agent,
    session
  }: {
    agent: components["schemas"]["SessionAgentState"],
    session: Session
  } = $props();
</script>

<p>close thread tool</p>