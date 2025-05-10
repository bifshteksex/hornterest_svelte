<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { formatDuration, checkIfUserSaved } from '$lib/utils';
	import type { Pin } from '$lib/types/pin';

	// Props
	export let pins: Pin[] = [];
	export let loading = false;
	export let hasMore = true;
	export let onFetchMore: () => void;

	// Internal state
	let columnCount = 2;
	let columns: Pin[][] = Array.from({ length: columnCount }, () => []);
	let newPinIds: Set<number> = new Set();
	let savedPins: Set<number> = new Set();
	let token: string | null = null;
	let prevPinsLength = 0;

	onMount(() => {
		console.log('🔄 MasonryGrid mounted');
		if (typeof window !== 'undefined') {
			token = localStorage.getItem('authToken');
		}
		updateColumnCount();

		// Распределяем начальные пины, если они есть
		if (pins.length > 0) {
			console.log('📌 Initial pins distribution');
			distributePinsToColumns(pins);
			if (token) {
				checkInitialSavedStatus(pins);
			}
		}
		onFetchMore();

		const handleResize = () => {
			updateColumnCount();
		};

		const handleScroll = () => {
			if (
				hasMore &&
				!loading &&
				window.innerHeight + window.scrollY >= document.body.offsetHeight - 200
			) {
				console.log('📜 Triggering infinite scroll');
				onFetchMore();
			}
		};

		window.addEventListener('resize', handleResize);
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

		const initiallySaved = new Set<number>();
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
			// При изменении количества колонок перераспределяем все пины
			distributePinsToColumns(pins);
		}
	}

	function distributePinsToColumns(currentPins: Pin[]) {
		console.log('📊 Distributing pins:', {
			pinsCount: currentPins.length,
			columnCount
		});

		// Пересоздаем массив колонок
		columns = Array.from({ length: columnCount }, () => []);

		// Распределяем пины по колонкам
		currentPins.forEach((pin, index) => {
			columns[index % columnCount].push(pin);
		});

		// Обновляем реактивно
		columns = [...columns];

		console.log('✅ Distribution completed:', {
			inputPins: currentPins.length,
			columns: columns.map((col) => col.length),
			totalPinsInColumns: columns.reduce((sum, col) => sum + col.length, 0)
		});
	}

	function appendNewPinsToColumns(newPins: Pin[]) {
		console.log('📥 Appending new pins:', {
			count: newPins.length,
			currentColumns: columns.map((col) => col.length)
		});

		newPins.forEach((pin) => {
			// Находим самую короткую колонку
			let shortestColumnIndex = 0;
			let minLength = columns[0].length;
			for (let i = 1; i < columnCount; i++) {
				if (columns[i].length < minLength) {
					minLength = columns[i].length;
					shortestColumnIndex = i;
				}
			}

			// Добавляем пин в колонку
			columns[shortestColumnIndex].push(pin);
			// Отмечаем пин как новый для анимации
			newPinIds.add(pin.id);
		});

		// Обновляем columns для реактивности
		columns = [...columns];

		setTimeout(() => {
			newPins.forEach((pin) => {
				newPinIds.delete(pin.id);
			});
			// Обновляем Set для реактивности
			newPinIds = new Set(newPinIds);
		}, 1000);

		console.log('✅ Append completed:', {
			newPinIds: Array.from(newPinIds),
			columns: columns.map((col) => col.length)
		});
	}

	$: {
		console.log('📌 Pins changed in MasonryGrid:', {
			newPinsLength: pins.length,
			prevPinsLength,
			columns: columns.map((col) => col.length)
		});

		if (pins.length > 0) {
			// Если это первая загрузка или количество пинов уменьшилось (смена вкладки)
			if (prevPinsLength === 0 || pins.length < prevPinsLength) {
				console.log('🔄 First load or tab switch - redistributing all pins');
				distributePinsToColumns(pins);
				if (token) {
					checkInitialSavedStatus(pins);
				}
			}
			// Если добавились новые пины (бесконечная прокрутка)
			else if (pins.length > prevPinsLength) {
				console.log('➕ Appending new pins');
				const newPins = pins.slice(prevPinsLength);
				appendNewPinsToColumns(newPins);
				if (token) {
					checkInitialSavedStatus(newPins);
				}
			}
			prevPinsLength = pins.length;
		} else {
			// Если пинов нет, очищаем колонки
			console.log('🧹 Clearing columns due to empty pins');
			columns = Array.from({ length: columnCount }, () => []);
			newPinIds = new Set(); // Очищаем также Set с ID новых пинов
			prevPinsLength = 0;
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

<div class="mx-auto px-4 pb-10 pt-3 sm:px-6 md:py-10 lg:px-6 lg:py-8">
	<div class={`grid grid-cols-${columnCount} gap-3`}>
		{#each columns as column}
			<div class="space-y-5">
				{#each column as pin (pin.id)}
					<a
						class="group relative block overflow-hidden"
						href="/pin/{pin.id}"
						on:click|preventDefault={(e) => {
							e.preventDefault();
							if (window.location.pathname.startsWith('/pin/')) {
								window.location.href = `/pin/${pin.id}`;
							} else {
								goto(`/pin/${pin.id}`);
							}
						}}
					>
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
										on:click|stopPropagation|preventDefault={() => {
											if (pin.original) {
												window.open(pin.original, '_blank');
											}
										}}
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
