<script lang="ts">
	import { pickTextColor } from '$lib/color';
	import { cn } from '$lib/utils';

	let {
		color,
		name,
		disabled = false
	}: { color: string; name: string; disabled?: boolean } = $props();
</script>

<span
	class={cn(
		'text-primary-foreground rounded-md px-1.5 py-0',
		pickTextColor(color),
		disabled && 'opacity-50'
	)}
	style={`background-color: ${color}`}
>
	{name}
</span>
