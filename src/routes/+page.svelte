<script lang="ts">
	import MasonryGrid from '$lib/components/MasonryGrid.svelte';

	interface Pin {
		id: number;
		path: string;
		description: string;
		user_id: number;
		original: string;
		comment: boolean;
		ai: boolean;
		type: string | null;
		title: string | null | undefined;
		width: number | null;
		height: number | null;
		duration: number | null;
	}

	let pins: Pin[] = [];
	let loading = false;
	let hasMore = true;
	let page = 1;
	const limit = 20;

	async function fetchPins() {
		if (loading || !hasMore) return;
		loading = true;
		try {
			console.log('Fetching page:', page);
			const response = await fetch(`http://localhost:8080/api/pins?page=${page}&limit=${limit}`);
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			const fetchedNewPins: Pin[] = await response.json();
			console.log('Fetched pins:', fetchedNewPins);

			const uniqueNewPins = fetchedNewPins.filter(
				(newPin) => !pins.some((existingPin) => existingPin.id === newPin.id)
			);

			if (uniqueNewPins.length > 0) {
				pins = [...pins, ...uniqueNewPins].sort((a, b) => b.id - a.id);
			}

			if (fetchedNewPins.length < limit) {
				hasMore = false;
			}
			page++;
		} catch (err) {
			console.error('Failed to load pins:', err);
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Hornterest</title>
	<meta name="description" content="Главная страница Hornterest" />
</svelte:head>

<section>
	<MasonryGrid {pins} {loading} {hasMore} onFetchMore={fetchPins} />
</section>
