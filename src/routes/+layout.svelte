<script lang="ts">
	import Header from './Header.svelte';
	import { afterNavigate } from '$app/navigation';
	import '../app.css';
	import Modals from './Modals.svelte';
	import Alerts from './Alerts.svelte';

	afterNavigate(() => {
		window.HSStaticMethods.autoInit();
	});

	let { children } = $props();
</script>

<div class="app">
	<Alerts />
	<Modals />
	<Header />

	<main>
		{@render children()}
	</main>
</div>
