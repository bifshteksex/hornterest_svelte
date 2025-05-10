<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { user } from '../stores/user';

	interface Tag {
		title_en: string;
		title_ru: string;
	}

	interface SearchResult {
		id: number;
		title: string;
		description: string;
		path: string;
		type: string;
		tags: Tag[];
	}

	let searchQuery = '';
	let searchResults: SearchResult[] = [];
	let suggestedTags: Tag[] = [];
	let searchTimeout: number | undefined;
	let isSearching = false;

	let isAuthenticated = false;
	let logoutButton: HTMLButtonElement | null = null;

	let searchInput: HTMLInputElement;
	let searchOverlay: HTMLDivElement;
	let searchDropdown: HTMLDivElement;

	onMount(() => {
		// Проверяем наличие токена при монтировании компонента
		isAuthenticated = localStorage.getItem('authToken') !== null;

		if (searchInput && searchOverlay && searchDropdown) {
			searchInput.addEventListener('focus', () => {
				searchOverlay.classList.remove('hidden');
				searchDropdown.classList.remove('hidden');
			});

			searchOverlay.addEventListener('click', () => {
				searchOverlay.classList.add('hidden');
				searchDropdown.classList.add('hidden');
				searchInput.blur();
			});
		}

		// Слушаем событие storage, чтобы реагировать на изменения токена в других вкладках
		window.addEventListener('storage', () => {
			isAuthenticated = localStorage.getItem('authToken') !== null;
		});
	});

	$: if (isAuthenticated && logoutButton) {
		logoutButton.addEventListener('click', logout);
	}

	function logout() {
		localStorage.removeItem('authToken');
		isAuthenticated = false;
		console.log('Выход из профиля выполнен');
		window.location.href = '/';
	}

	async function handleSearch(event: Event) {
		const query = (event.target as HTMLInputElement).value;
		searchQuery = query;

		if (searchTimeout) {
			clearTimeout(searchTimeout);
		}

		if (!query.trim()) {
			suggestedTags = [];
			isSearching = false;
			return;
		}

		searchTimeout = setTimeout(async () => {
			isSearching = true;
			try {
				// Используем новый эндпоинт для поиска тегов
				const response = await fetch(
					`http://localhost:8080/api/tags/search?q=${encodeURIComponent(query)}`
				);
				if (!response.ok) {
					throw new Error('Search failed');
				}
				const data = await response.json();
				suggestedTags = data.tags;
			} catch (error) {
				console.error('Search error:', error);
				suggestedTags = [];
			} finally {
				isSearching = false;
			}
		}, 300);
	}

	async function handleSearchSubmit(event: Event) {
		event.preventDefault();
		if (searchQuery.trim()) {
			window.location.href = `/?q=${encodeURIComponent(searchQuery.trim())}`;

			hideSearch();
		}
	}

	async function hideSearch() {
		if (searchOverlay && searchDropdown && searchInput) {
			searchOverlay.classList.add('hidden');
			searchDropdown.classList.add('hidden');
			searchInput.blur();
		}
	}
</script>

<!-- ========== HEADER ========== -->
<header
	class="sticky inset-x-0 top-0 z-[48] hidden w-full flex-wrap border-b bg-gray-900 py-2.5 text-sm md:flex md:flex-nowrap md:justify-start dark:border-neutral-700 dark:bg-neutral-950"
>
	<nav
		class="mx-auto flex w-full basis-full items-center px-4 sm:px-6 md:grid md:grid-cols-3 md:gap-x-1 lg:px-8"
	>
		<div class="hs-tooltip me-5 [--placement:bottom]">
			<!-- Logo -->
			<a
				class="hs-tooltip-toggle inline-block flex-none rounded-md text-2xl font-semibold text-neutral-200 focus:opacity-80 focus:outline-none"
				href="/"
				aria-label="Hornterest"
			>
				Hornterest
			</a>
			<!-- End Logo -->
			<span
				class="hs-tooltip-content hs-tooltip-shown:opacity-100 hs-tooltip-shown:visible shadow-2xs invisible absolute z-10 inline-block rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white opacity-0 transition-opacity dark:bg-neutral-700"
				role="tooltip"
			>
				Перейти на Главную
			</span>
		</div>

		<div class="flex items-center gap-x-5">
			<!-- Search Input -->
			<form class="w-full" on:submit={handleSearchSubmit}>
				<div class="relative w-full">
					<div class="pointer-events-none absolute inset-y-0 start-0 z-20 flex items-center ps-3.5">
						<svg
							class="size-4 shrink-0 text-gray-400 dark:text-white/60"
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<circle cx="11" cy="11" r="8" />
							<path d="m21 21-4.3-4.3" />
						</svg>
					</div>
					<input
						bind:this={searchInput}
						bind:value={searchQuery}
						on:input={handleSearch}
						id="searchInput"
						type="text"
						class="block w-full rounded-lg border-gray-700 bg-transparent py-2 pe-16 ps-10 text-sm focus:border-gray-600 focus:outline-none focus:ring-0 disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder:text-neutral-400 dark:focus:border-neutral-600"
						placeholder="Поиск"
					/>
					<div
						class="pointer-events-none absolute inset-y-0 end-0 z-20 flex hidden items-center pe-1"
					>
						<button
							type="button"
							class="inline-flex size-6 shrink-0 items-center justify-center rounded-full text-gray-500 hover:text-blue-600 focus:text-blue-600 focus:outline-none dark:text-neutral-500 dark:hover:text-blue-500 dark:focus:text-blue-500"
							aria-label="Close"
						>
							<span class="sr-only">Close</span>
							<svg
								class="size-4 shrink-0"
								xmlns="http://www.w3.org/2000/svg"
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<circle cx="12" cy="12" r="10" />
								<path d="m15 9-6 6" />
								<path d="m9 9 6 6" />
							</svg>
						</button>
					</div>
					<div
						class="pointer-events-none absolute inset-y-0 end-0 z-20 flex items-center pe-3 text-gray-400"
					>
						<svg
							class="size-3 shrink-0 text-gray-400 dark:text-white/60"
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
						</svg>
						<span class="mx-1">
							<svg
								class="size-3 shrink-0 text-gray-400 dark:text-white/60"
								xmlns="http://www.w3.org/2000/svg"
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path d="M5 12h14" />
								<path d="M12 5v14" />
							</svg>
						</span>
						<span class="text-xs">/</span>
					</div>
				</div>
			</form>
			<!-- End Search Input -->

			{#if isAuthenticated}
				<a
					href="/create"
					class="relative flex items-center justify-center overflow-hidden whitespace-nowrap rounded-lg border border-dashed px-10 py-2 text-neutral-200 before:pointer-events-none before:absolute before:inset-0 before:z-0 before:h-full
		 before:w-[150%] before:translate-x-[-100%] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:transition-transform before:duration-500 hover:before:translate-x-[100%] dark:border-neutral-400 dark:bg-neutral-900 dark:text-neutral-400 hover:dark:border-neutral-200 hover:dark:text-neutral-200"
				>
					<span class="relative z-10">+ Создать</span>
				</a>
			{:else}
				<button
					type="button"
					class="relative flex items-center justify-center overflow-hidden whitespace-nowrap rounded-lg border border-dashed px-10 py-2 text-neutral-200 before:pointer-events-none before:absolute before:inset-0 before:z-0 before:h-full
	 before:w-[150%] before:translate-x-[-100%] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:transition-transform before:duration-500 hover:before:translate-x-[100%] dark:border-neutral-400 dark:bg-neutral-900 dark:text-neutral-400 hover:dark:border-neutral-200 hover:dark:text-neutral-200"
					aria-haspopup="dialog"
					aria-expanded="false"
					aria-controls="hs-modal-signin"
					data-hs-overlay="#hs-modal-signin"
				>
					<span class="relative z-10">+ Создать</span>
				</button>
			{/if}
		</div>

		<div class="flex flex-1 flex-row items-center justify-end gap-1">
			<!-- Collapse -->
			<div class="md:hidden">
				<button
					type="button"
					class="hs-collapse-toggle relative inline-flex size-[38px] items-center justify-center gap-x-2 rounded-full border border-transparent text-sm font-semibold text-white hover:bg-white/10 focus:bg-white/10 focus:outline-none disabled:pointer-events-none disabled:opacity-50"
					id="hs-secondaru-navbar-collapse"
					aria-expanded="false"
					aria-controls="hs-secondaru-navbar"
					aria-label="Toggle navigation"
					data-hs-collapse="#hs-secondaru-navbar"
				>
					<svg
						class="hs-collapse-open:hidden size-4"
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<line x1="3" x2="21" y1="6" y2="6" />
						<line x1="3" x2="21" y1="12" y2="12" />
						<line x1="3" x2="21" y1="18" y2="18" />
					</svg>
					<svg
						class="hs-collapse-open:block hidden size-4 shrink-0"
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M18 6 6 18" />
						<path d="m6 6 12 12" />
					</svg>
					<span class="sr-only">Toggle navigation</span>
				</button>
			</div>
			<!-- End Collapse -->

			<button
				type="button"
				class="relative inline-flex size-[38px] items-center justify-center gap-x-2 rounded-full border border-transparent text-sm font-semibold text-white hover:bg-white/10 focus:bg-white/10 focus:outline-none disabled:pointer-events-none disabled:opacity-50 md:hidden"
			>
				<svg
					class="size-4 shrink-0"
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<circle cx="11" cy="11" r="8" />
					<path d="m21 21-4.3-4.3" />
				</svg>
				<span class="sr-only">Search</span>
			</button>

			<button
				type="button"
				class="hs-dark-mode-active:hidden hs-dark-mode block rounded-full font-medium text-neutral-200 hover:bg-white/10 focus:bg-gray-200 focus:bg-white/10 focus:outline-none"
				data-hs-theme-click-value="dark"
			>
				<span class="group inline-flex size-9 shrink-0 items-center justify-center">
					<svg
						class="size-4 shrink-0"
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
					</svg>
				</span>
			</button>
			<button
				type="button"
				class="hs-dark-mode-active:block hs-dark-mode hidden rounded-full font-medium text-gray-800 hover:bg-gray-200 focus:bg-gray-200 focus:outline-none dark:text-neutral-200 dark:hover:bg-neutral-800 dark:focus:bg-neutral-800"
				data-hs-theme-click-value="light"
			>
				<span class="group inline-flex size-9 shrink-0 items-center justify-center">
					<svg
						class="size-4 shrink-0"
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<circle cx="12" cy="12" r="4"></circle>
						<path d="M12 2v2"></path>
						<path d="M12 20v2"></path>
						<path d="m4.93 4.93 1.41 1.41"></path>
						<path d="m17.66 17.66 1.41 1.41"></path>
						<path d="M2 12h2"></path>
						<path d="M20 12h2"></path>
						<path d="m6.34 17.66-1.41 1.41"></path>
						<path d="m19.07 4.93-1.41 1.41"></path>
					</svg>
				</span>
			</button>

			{#if isAuthenticated}
				<button
					type="button"
					class="relative inline-flex size-[38px] items-center justify-center gap-x-2 rounded-full border border-transparent text-sm font-semibold text-white hover:bg-white/10 focus:bg-white/10 focus:outline-none disabled:pointer-events-none disabled:opacity-50"
				>
					<svg
						class="size-4 shrink-0"
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
						<path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
					</svg>
					<span class="sr-only">Notifications</span>
				</button>

				<a
					href="/{$user.nickname}"
					type="button"
					class="inline-flex size-[38px] items-center justify-center gap-x-2 rounded-full border border-transparent bg-neutral-900 text-sm font-semibold text-gray-800 focus:outline-none disabled:pointer-events-none disabled:opacity-50 dark:text-white"
				>
					<svg
						class="size-[38px] shrink-0 p-1"
						width="72"
						height="68"
						viewBox="0 0 72 68"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M8.37009 10.7148C8.22559 8.1757 11.1078 6.61987 13.1512 8.13391L19.1376 12.5694C20.9027 13.8772 20.7098 16.5762 18.7766 17.6198L13.2136 20.6227C11.2804 21.6663 8.9182 20.3465 8.79339 18.1533L8.37009 10.7148Z"
							fill="#242424"
						/>
						<path
							d="M62.8816 12.2244C63.2038 9.70164 60.4377 7.94753 58.2932 9.31456L52.0105 13.3194C50.1581 14.5002 50.1612 17.2061 52.0164 18.3826L57.3552 21.7683C59.2104 22.9448 61.6594 21.794 61.9377 19.6148L62.8816 12.2244Z"
							fill="#242424"
						/>
						<path
							d="M49.5834 47.1667C52.6875 44.125 55.8334 40.4792 55.8334 35.7083C55.8334 32.6694 54.6261 29.7549 52.4773 27.6061C50.3284 25.4572 47.414 24.25 44.375 24.25C40.7084 24.25 38.125 25.2917 35 28.4167C31.875 25.2917 29.2917 24.25 25.625 24.25C22.5861 24.25 19.6716 25.4572 17.5228 27.6061C15.3739 29.7549 14.1667 32.6694 14.1667 35.7083C14.1667 40.5 17.2917 44.1458 20.4167 47.1667L35 61.75L49.5834 47.1667Z"
							stroke="#242424"
							stroke-width="8.33333"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				</a>

				<button
					bind:this={logoutButton}
					type="button"
					class="relative inline-flex size-[38px] items-center justify-center gap-x-2 rounded-full border border-transparent text-sm font-semibold text-white hover:bg-white/10 focus:bg-white/10 focus:outline-none disabled:pointer-events-none disabled:opacity-50"
				>
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
						class="lucide lucide-log-out-icon lucide-log-out size-4 shrink-0"
						><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline
							points="16 17 21 12 16 7"
						/><line x1="21" x2="9" y1="12" y2="12" /></svg
					>
					<span class="sr-only">Exit</span>
				</button>
			{:else}
				<button
					type="button"
					class="inline-flex items-center gap-x-2 rounded-lg border border-transparent bg-[#ab1dff] px-4 py-2 text-sm font-medium text-white hover:bg-[#8500d3] focus:bg-[#8500d3] focus:outline-none disabled:pointer-events-none disabled:opacity-50"
					aria-haspopup="dialog"
					aria-expanded="false"
					aria-controls="hs-modal-signin"
					data-hs-overlay="#hs-modal-signin"
				>
					Войти
				</button>
			{/if}
		</div>
	</nav>
</header>
<!-- ========== END HEADER ========== -->

<!-- Backdrop (затемнение фона) -->
<div
	bind:this={searchOverlay}
	id="searchOverlay"
	class="fixed inset-0 z-40 hidden bg-black/60 backdrop-blur-sm"
	aria-hidden="true"
></div>

<!-- Dropdown окно для поиска -->
<div
	bind:this={searchDropdown}
	id="searchDropdown"
	class="min-w-2xl absolute left-1/2 top-20 z-50 hidden -translate-x-1/2 rounded-lg bg-white p-5 shadow-lg dark:bg-neutral-950"
>
	{#if isSearching}
		<div class="flex justify-center py-4">
			<div
				class="h-8 w-8 animate-spin rounded-full border-4 border-neutral-300 border-t-[#ab1dff]"
			></div>
		</div>
	{:else if searchQuery}
		<ul class="min-w-[300px] space-y-1">
			<li class="rounded-xl font-semibold text-neutral-200 transition-colors hover:bg-neutral-900">
				<a
					class="flex h-full w-full items-center gap-x-2 px-3 py-2"
					href="/?q={encodeURIComponent(searchQuery)}"
					on:click={hideSearch}
					data-sveltekit-preload-data="off"
				>
					{searchQuery}
				</a>
			</li>

			{#if suggestedTags.length > 0}
				{#each suggestedTags as tag}
					<li
						class="rounded-xl font-semibold text-neutral-200 transition-colors hover:bg-neutral-900"
					>
						<a
							class="flex h-full w-full items-center gap-x-2 px-3 py-2"
							href="/?q={encodeURIComponent(tag.title_ru || tag.title_en)}"
							on:click={hideSearch}
							data-sveltekit-preload-data="off"
						>
							<svg
								class="size-4 shrink-0 text-neutral-400"
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path
									d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"
								/>
								<path d="M7 7h.01" />
							</svg>
							{tag.title_ru || tag.title_en}
						</a>
					</li>
				{/each}
			{/if}
		</ul>
	{:else}
		<div class="flex flex-col gap-y-5">
			<div class="flex flex-col gap-y-3">
				<h3 class="font-semibold text-neutral-200">Недавние поисковые запросы</h3>
				<div class="flex flex-wrap gap-2">
					<span
						class="inline-flex items-center gap-x-1.5 rounded-full bg-blue-100 py-1.5 pe-2 ps-3 text-xs font-medium text-blue-800 dark:bg-blue-800/30 dark:text-blue-500"
					>
						Порна
						<button
							type="button"
							class="inline-flex size-4 shrink-0 items-center justify-center rounded-full hover:bg-blue-200 focus:bg-blue-200 focus:text-blue-500 focus:outline-none dark:hover:bg-blue-900"
						>
							<span class="sr-only">Remove badge</span>
							<svg
								class="size-3 shrink-0"
								xmlns="http://www.w3.org/2000/svg"
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path d="M18 6 6 18"></path>
								<path d="m6 6 12 12"></path>
							</svg>
						</button>
					</span>

					<span
						class="inline-flex items-center gap-x-1.5 rounded-full bg-blue-100 py-1.5 pe-2 ps-3 text-xs font-medium text-blue-800 dark:bg-blue-800/30 dark:text-blue-500"
					>
						Многа порна
						<button
							type="button"
							class="inline-flex size-4 shrink-0 items-center justify-center rounded-full hover:bg-blue-200 focus:bg-blue-200 focus:text-blue-500 focus:outline-none dark:hover:bg-blue-900"
						>
							<span class="sr-only">Remove badge</span>
							<svg
								class="size-3 shrink-0"
								xmlns="http://www.w3.org/2000/svg"
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path d="M18 6 6 18"></path>
								<path d="m6 6 12 12"></path>
							</svg>
						</button>
					</span>
				</div>
			</div>

			<div class="flex flex-col gap-y-3">
				<h3 class="font-semibold text-neutral-200">Рекомендовано для вас</h3>
				<div class="flex flex-wrap gap-2">
					<div class="flex h-32 w-64 items-center rounded-lg bg-neutral-900 text-neutral-200">
						<div class="h-full w-[40%]">
							<img
								class="h-full w-full rounded-l-lg object-cover"
								src="https://i.redd.it/fgafxnegf8he1.jpeg"
							/>
						</div>
						<p class="px-4 font-medium">Альтушки</p>
					</div>

					<div class="flex h-32 w-64 items-center rounded-lg bg-neutral-900 text-neutral-200">
						<div class="h-full w-[40%]">
							<img
								class="h-full w-full rounded-l-lg object-cover"
								src="https://i.redd.it/l32snusutihe1.jpeg"
							/>
						</div>
						<p class="px-4 font-medium">Большие груди</p>
					</div>

					<div class="flex h-32 w-64 items-center rounded-lg bg-neutral-900 text-neutral-200">
						<div class="h-full w-[40%]">
							<img
								class="h-full w-full rounded-l-lg object-cover"
								src="https://i.redd.it/2b7w97l91ehe1.jpeg"
							/>
						</div>
						<p class="px-4 font-medium">Косплей</p>
					</div>
				</div>
			</div>

			<div class="flex flex-col gap-y-3">
				<h3 class="font-semibold text-neutral-200">Популярно на Hornterest</h3>
				<div class="flex flex-wrap gap-2">
					<div class="flex h-32 w-64 items-center rounded-lg bg-neutral-900 text-neutral-200">
						<div class="h-full w-[40%]">
							<img
								class="h-full w-full rounded-l-lg object-cover"
								src="https://i.redd.it/iapl67kcvrhe1.jpeg"
							/>
						</div>
						<p class="px-4 font-medium">Sweetie Fox</p>
					</div>

					<div class="flex h-32 w-64 items-center rounded-lg bg-neutral-900 text-neutral-200">
						<div class="h-full w-[40%]">
							<img
								class="h-full w-full rounded-l-lg object-cover"
								src="https://i.redd.it/214g2kz8zige1.jpeg"
							/>
						</div>
						<p class="px-4 font-medium">Хентай</p>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<!-- ========== MOBILE HEADER ========== -->
<header
	class="fixed inset-x-0 bottom-0 z-[48] w-full flex-wrap border-b bg-gray-900 py-2.5 text-sm md:hidden md:flex-nowrap md:justify-start dark:border-neutral-700 dark:bg-neutral-950"
>
	<nav class="mx-auto flex w-full basis-full items-center justify-between px-4 sm:px-6 lg:px-8">
		<svg
			class="lucide lucide-house size-8 shrink-0 text-gray-400 dark:text-white/60"
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="#ffffff"
			stroke-width="1.5"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
			<path
				d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
			/>
		</svg>

		<svg
			class="lucide lucide-search size-8 shrink-0 text-gray-400 dark:text-white/60"
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="#ffffff"
			stroke-width="1.5"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<circle cx="11" cy="11" r="8" />
			<path d="m21 21-4.3-4.3" />
		</svg>

		<svg
			class="lucide lucide-badge-plus size-8 shrink-0 text-gray-400 dark:text-white/60"
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="#ffffff"
			stroke-width="1.5"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path
				d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
			/>
			<line x1="12" x2="12" y1="8" y2="16" />
			<line x1="8" x2="16" y1="12" y2="12" />
		</svg>

		<svg
			class="lucide lucide-bell size-8 shrink-0 text-gray-400 dark:text-white/60"
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="#ffffff"
			stroke-width="1.5"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path d="M10.268 21a2 2 0 0 0 3.464 0" />
			<path
				d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"
			/>
		</svg>

		<button
			id="hs-dropdown-account"
			type="button"
			class="inline-flex size-[38px] items-center justify-center gap-x-2 rounded-full border border-transparent text-sm font-semibold text-gray-800 focus:outline-none disabled:pointer-events-none disabled:opacity-50 dark:text-white"
			aria-haspopup="menu"
			aria-expanded="false"
			aria-label="Dropdown"
		>
			<img
				class="size-[38px] shrink-0 rounded-full"
				src="https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=facearea&facepad=2&w=320&h=320&q=80"
				alt="Avatar"
			/>
		</button>
	</nav>
</header>
<!-- ========== END MOBILE HEADER ========== -->
