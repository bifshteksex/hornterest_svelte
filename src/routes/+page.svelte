<script lang="ts">
	import { onMount } from 'svelte';
	import { formatDuration, checkIfUserSaved } from '$lib/utils';

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
	let error: Error | null = null;
	let page = 1;
	const limit = 20;
	let hasMore = true;
	let columnCount = 2;
	let columns: Pin[][] = Array.from({ length: columnCount }, () => []);
	let newPinIds: Set<number> = new Set();
	let savedPins: Set<number> = new Set();
	let token: string | null = null;

	onMount(() => {
		if (typeof window !== 'undefined') {
			token = localStorage.getItem('authToken');
		}
		updateColumnCount();
		fetchPins();

		const handleResize = () => {
			updateColumnCount();
		};

		window.addEventListener('resize', handleResize);

		const handleScroll = () => {
			if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
				fetchPins();
			}
		};

		window.addEventListener('scroll', handleScroll);

		return () => {
			window.removeEventListener('resize', handleResize);
			window.removeEventListener('scroll', handleScroll);
		};
	});

	async function checkInitialSavedStatus(currentPins: Pin[]) {
		if (!token) {
			return;
		}

		const initiallySaved = new Set<number>(); // Временный Set для сбора ID
		for (const pin of currentPins) {
			const isSaved = await checkIfUserSaved(pin.id, token);
			if (isSaved) {
				initiallySaved.add(pin.id);
			}
		}
		savedPins = initiallySaved;
	}

	function updateColumnCount() {
		const width = window.innerWidth;
		let newColumnCount = 2;
		if (width >= 1280) {
			newColumnCount = 6;
		} else if (width >= 768) {
			newColumnCount = 4;
		} else if (width >= 640) {
			newColumnCount = 3;
		}

		if (newColumnCount !== columnCount) {
			columnCount = newColumnCount;
			distributePinsToColumns(pins);
			columns = [...columns];
		}
	}

	function distributePinsToColumns(currentPins: Pin[]) {
		columns = Array.from({ length: columnCount }, () => []);
		currentPins.forEach((pin, index) => {
			columns[index % columnCount].push(pin);
		});
	}

	function appendNewPinsToColumns(newPins: Pin[]) {
		newPins.forEach((pin) => {
			let shortestColumnIndex = 0;
			let minLength = columns[0].length;
			for (let i = 1; i < columnCount; i++) {
				if (columns[i].length < minLength) {
					minLength = columns[i].length;
					shortestColumnIndex = i;
				}
			}
			columns[shortestColumnIndex].push(pin);
			newPinIds.add(pin.id);
		});
		columns = [...columns];
	}

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
				pins = [...pins, ...uniqueNewPins].sort((a, b) => a.id - b.id);
				appendNewPinsToColumns(uniqueNewPins);
				await checkInitialSavedStatus(uniqueNewPins); // Проверяем сохраненные пины после загрузки
				console.log('Current pins:', pins);
				console.log('Current columns:', columns);
				console.log('Saved pins:', savedPins);
			}
			if (fetchedNewPins.length < limit) {
				hasMore = false;
			}
			page++;
		} catch (err) {
			error = err instanceof Error ? err : new Error('Failed to load pins');
			console.error(error);
		} finally {
			console.log('Fetch finished, loading:', loading, 'hasMore:', hasMore);
			loading = false;
		}
	}

	async function toggleSave(pinId: number) {
		if (!token) {
			console.error('Пользователь не авторизован');
			return;
		}
		const method = savedPins.has(pinId) ? 'DELETE' : 'POST';
		const endpoint = savedPins.has(pinId) ? 'unsave' : 'save';

		try {
			const response = await fetch(`http://localhost:8080/api/pins/${pinId}/${endpoint}`, {
				method: method,
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json'
				}
			});

			if (response.ok) {
				if (savedPins.has(pinId)) {
					savedPins.delete(pinId);
					console.log('Пин удален из сохраненных');
				} else {
					savedPins.add(pinId);
					console.log('Пин сохранен');
				}
				// Обновляем savedPins для реактивности
				savedPins = new Set(savedPins);
			} else {
				const errorData = await response.json();
				console.error('Ошибка при сохранении/удалении пина:', errorData);
			}
		} catch (error) {
			console.error('Ошибка при отправке запроса на сохранение/удаление:', error);
		}
	}
</script>

<svelte:head>
	<title>Hornterest</title>
	<meta name="description" content="Главная страница Hornterest" />
</svelte:head>

<section>
	<div class="mx-auto px-4 pb-10 pt-3 sm:px-6 md:py-10 lg:px-6 lg:py-8">
		<div class={`grid grid-cols-${columnCount} gap-3`}>
			{#each columns as column}
				<div class="space-y-5">
					{#each column as pin (pin.id)}
						<a class="group relative block overflow-hidden" href="/pin/{pin.id}">
							{#if pin.type == 'image'}
								<img
									class={`h-auto w-full rounded-xl bg-gray-100 object-cover dark:bg-neutral-800 ${
										newPinIds.has(pin.id) ? 'fade-in' : ''
									}`}
									src={pin.path}
									alt={pin.description || 'Изображение'}
								/>
							{:else if pin.type == 'video'}
								<video
									class={`h-auto w-full rounded-xl bg-gray-100 object-cover dark:bg-neutral-800 ${
										newPinIds.has(pin.id) ? 'fade-in' : ''
									}`}
									src={pin.path}
									loop
									playsinline
									autoplay
									muted
								></video>
							{/if}

							<div
								class="absolute top-0 h-full w-full rounded-xl bg-black/50 p-2 opacity-0 transition group-hover:opacity-100"
							>
								<div class="flex h-full flex-col justify-between">
									<div class="flex items-center justify-between">
										<div class="flex items-center gap-x-3">
											{#if pin.type == 'video' && formatDuration(pin.duration)}
												<div
													class="dark:bg-gray/70 flex items-center gap-x-1 rounded-lg bg-gray-500/30 px-3 py-2 text-gray-800 dark:text-neutral-200"
												>
													<svg
														xmlns="http://www.w3.org/2000/svg"
														width="24"
														height="24"
														viewBox="0 0 24 24"
														fill="none"
														stroke="#ffffff"
														stroke-width="2.5"
														stroke-linecap="round"
														stroke-linejoin="round"
														class="lucide lucide-play-icon lucide-play size-3.5"
														><polygon points="6 3 20 12 6 21 6 3" /></svg
													>
													<span class="text-sm font-semibold">{formatDuration(pin.duration)}</span>
												</div>
											{/if}

											{#if pin.type == 'gif'}
												<div
													class="dark:bg-gray/70 flex items-center gap-x-1 rounded-lg bg-gray-500/30 px-3 py-2 text-gray-800 dark:text-neutral-200"
												>
													<span class="text-sm font-semibold">GIF</span>
												</div>
											{/if}

											{#if pin.ai}
												<div
													class="dark:bg-gray/70 flex items-center gap-x-1 rounded-lg bg-gray-500/30 px-3 py-2 text-gray-800 dark:text-neutral-200"
												>
													<span class="text-sm font-semibold">AI</span>
												</div>
											{/if}
										</div>

										<button
											on:click|stopPropagation|preventDefault={() => toggleSave(pin.id)}
											class="flex items-center gap-x-1 rounded-lg bg-white px-3 py-2 text-gray-800 {savedPins.has(
												pin.id
											)
												? 'border dark:bg-transparent'
												: 'dark:bg-[#ab1dff]'} dark:text-neutral-200"
										>
											<span class="font-semibold"
												>{savedPins.has(pin.id) ? 'Сохранено' : 'Сохранить'}</span
											>
										</button>
									</div>

									{#if pin.original}
										<button
											type="button"
											on:click|stopPropagation|preventDefault={() =>
												window.open(pin.original, '_blank')}
											class="dark:bg-gray/70 flex w-fit items-center gap-x-1 rounded-lg bg-gray-500/30 px-3 py-2 text-gray-800 dark:text-neutral-200"
										>
											<span class="flex items-center gap-x-1 text-sm font-semibold">
												<svg
													xmlns="http://www.w3.org/2000/svg"
													width="24"
													height="24"
													viewBox="0 0 24 24"
													fill="none"
													stroke="#ffffff"
													stroke-width="2"
													stroke-linecap="round"
													stroke-linejoin="round"
													class="lucide lucide-arrow-up-right-icon lucide-arrow-up-right"
													><path d="M7 7h10v10" /><path d="M7 17 17 7" /></svg
												> Источник</span
											>
										</button>
									{/if}
								</div>
							</div>
						</a>

						{#if pin.title}
							<div class="flex flex-col gap-y-2 text-xs text-neutral-200 md:text-sm">
								<p class="font-semibold">{pin.title}</p>
							</div>
						{/if}
					{/each}
				</div>
			{/each}
		</div>
	</div>
</section>

<style>
	.fade-in {
		animation: fadeIn 0.3s ease-in-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
</style>
