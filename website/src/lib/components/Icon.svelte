<script lang="ts">
	interface Props {
		name: string;
		fill?: boolean;
		size?: number;
		class?: string;
	}
	const { name, fill = false, size = 24, class: cls = '' }: Props = $props();
</script>

<span
	class="msym {fill ? 'fill' : ''} {cls}"
	style="font-size: {size}px"
	aria-hidden="true">{name}</span
>
