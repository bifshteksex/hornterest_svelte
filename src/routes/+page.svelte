<script lang="ts">
	import MasonryGrid from '$lib/components/MasonryGrid.svelte';
	import type { Pin } from '$lib/types/pin';
	import { page } from '$app/stores';

	let pins: Pin[] = [];
	let loading = false;
	let hasMore = true;
	let pageNumber = 1;
	const limit = 20;

	let allPinIds: number[] = []; // Добавим для хранения всех ID пинов из поиска
	let totalPins = 0;

	$: {
		const searchQuery = $page.url.searchParams.get('q');
		const tagQuery = $page.url.searchParams.get('tag');

		// Сбрасываем состояние при изменении параметров поиска
		pins = [];
		pageNumber = 1;
		hasMore = true;

		// Запускаем первоначальную загрузку
		fetchPins();
	}

	async function fetchPins() {
		if (loading || !hasMore) return;
		loading = true;

		try {
			const searchQuery = $page.url.searchParams.get('q');

			// Если это первая загрузка и есть поисковый запрос
			if (pageNumber === 1 && searchQuery) {
				// Сначала получаем все ID пинов через поиск
				const searchResponse = await fetch(
					`http://localhost:8080/api/search?q=${encodeURIComponent(searchQuery)}`
				);
				if (!searchResponse.ok) {
					throw new Error(`Search failed: ${searchResponse.status}`);
				}
				const searchData = await searchResponse.json();
				allPinIds = searchData.pin_ids;
				totalPins = searchData.total;

				if (allPinIds.length === 0) {
					hasMore = false;
					loading = false;
					return;
				}
			}

			// Формируем URL для получения пинов
			let url = `http://localhost:8080/api/pins?page=${pageNumber}&limit=${limit}`;

			// Если есть поисковый запрос, добавляем отфильтрованные ID для текущей страницы
			if (searchQuery && allPinIds.length > 0) {
				const pageIds = allPinIds.slice((pageNumber - 1) * limit, pageNumber * limit);
				url += `&ids=${JSON.stringify(pageIds)}`;
			}

			console.log('Fetching pins:', { url, pageNumber });
			const response = await fetch(url);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const fetchedPins: Pin[] = await response.json();
			console.log('Fetched pins:', fetchedPins.length);

			if (fetchedPins.length > 0) {
				if (pageNumber === 1) {
					pins = fetchedPins;
				} else {
					const uniqueNewPins = fetchedPins.filter(
						(newPin) => !pins.some((existingPin) => existingPin.id === newPin.id)
					);
					pins = [...pins, ...uniqueNewPins];
				}

				// Проверяем, есть ли ещё пины для загрузки
				if (searchQuery) {
					hasMore = pins.length < totalPins;
				} else {
					hasMore = fetchedPins.length === limit;
				}

				pageNumber++;
			} else {
				hasMore = false;
			}
		} catch (err) {
			console.error('Failed to load pins:', err);
			hasMore = false;
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
