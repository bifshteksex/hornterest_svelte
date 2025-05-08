<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { user } from '../../stores/user';
	import { formatDuration } from '$lib/utils';

	export let data; // Данные, переданные из +page.server.ts

	interface Pin {
		id: number;
		path: string;
		description: string;
		user_id: number;
		original: string | null;
		comment: boolean;
		ai: boolean;
		type: string | null;
		title: string | null | undefined;
		width: number | null;
		height: number | null;
		duration: number | null;
	}

	let isOwnProfile = false;
	let profileData: any = null;
	let userPins: Pin[] = []; // Массив для хранения пинов пользователя
	let loadingPins = false; // Статус загрузки пинов
	let errorPins: Error | null = null; // Ошибка при загрузке пинов
	let pageNumber = 1; // Текущая страница для пагинации
	const limit = 20; // Количество пинов на странице
	let hasMore = true; // Есть ли еще пины для загрузки
	let columnCount = 2; // Минимальное количество колонок
	let columns: Pin[][] = Array.from({ length: columnCount }, () => []); // Инициализируем columns
	let newPinIds: Set<number> = new Set();
	let activeTab: 'created' | 'saved' = 'created';

	let isSubscribed = false;
	let loading = false;
	let error = null;

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
			distributePinsToColumns(userPins);
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

	async function loadPins(username: string, tab: 'created' | 'saved', page: number) {
		if (loadingPins || !hasMore) return;
		loadingPins = true;
		errorPins = null;
		const endpoint = tab === 'created' ? 'pins' : 'saved';
		const apiUrl = `http://localhost:8080/api/users/${username}/${endpoint}?page=${page}&limit=${limit}`;

		try {
			console.log(`Fetching ${tab} pins for user: ${username}, page: ${page}`);
			const response = await fetch(apiUrl);
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			const fetchedPins: Pin[] = await response.json();
			console.log(`Fetched ${tab} pins:`, fetchedPins);

			if (fetchedPins != null && fetchedPins.length > 0) {
				const uniqueNewPins = fetchedPins.filter(
					(newPin) => !userPins.some((existingPin) => existingPin.id === newPin.id)
				);
				userPins = [...userPins, ...uniqueNewPins].sort((a, b) => a.id - b.id);
				appendNewPinsToColumns(uniqueNewPins);
			}

			if (fetchedPins != null && fetchedPins.length < limit) {
				hasMore = false;
			}
		} catch (err) {
			errorPins = err instanceof Error ? err : new Error(`Failed to load ${tab} pins`);
			console.error(errorPins);
		} finally {
			loadingPins = false;
			console.log(`Load ${tab} pins finished, loading: ${loadingPins}, hasMore: ${hasMore}`);
		}
	}

	async function loadProfile(username: string) {
		try {
			const profileResponse = await fetch(`http://localhost:8080/api/users/${username}`, {
				headers: {
					'Content-Type': 'application/json'
				}
			});

			if (profileResponse.ok) {
				profileData = await profileResponse.json();
				console.log('Profile data loaded:', profileData);
			} else {
				console.error(
					'Failed to load profile data:',
					profileResponse.status,
					await profileResponse.text()
				);
			}
		} catch (err) {
			console.error('Error loading profile:', err);
		}
	}

	async function switchTab(tab: 'created' | 'saved') {
		if (loadingPins || activeTab === tab) return;
		activeTab = tab;
		userPins = [];
		columns = Array.from({ length: columnCount }, () => []);
		pageNumber = 1;
		hasMore = true;
		loadPins($page.params.username, activeTab, pageNumber);
	}

	async function loadMorePins() {
		if (loadingPins || !hasMore) return;
		pageNumber++;
		loadPins($page.params.username, activeTab, pageNumber);
	}

	async function checkSubscription() {
		loading = true;
		error = null;
		const token = localStorage.getItem('authToken');
		if (!token) {
			loading = false;
			return; // Или перенаправить на страницу логина
		}

		try {
			const response = await fetch(`http://localhost:8080/api/users/${profileData.id}/subscribed`, {
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json'
				}
			});
			if (response.ok) {
				const result = await response.json();
				isSubscribed = result.subscribed;
			} else if (response.status === 401) {
				// Обработка неавторизованного доступа
				console.error('Unauthorized');
			} else {
				error = 'Failed to check subscription status';
				console.error(error, response);
			}
		} catch (err) {
			error = 'Network error while checking subscription';
			console.error(error, err);
		} finally {
			loading = false;
		}
	}

	async function toggleSubscribe() {
		loading = true;
		error = null;
		const token = localStorage.getItem('authToken');
		if (!token) {
			loading = false;
			return; // Или перенаправить на страницу логина
		}

		const method = isSubscribed ? 'DELETE' : 'POST';
		const endp = isSubscribed ? 'unsubscribe' : 'subscribe';
		const endpoint = `http://localhost:8080/api/users/${profileData.id}/${endp}`; // POST используется и для подписки

		try {
			const response = await fetch(endpoint, {
				method,
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json'
				}
			});
			if (response.ok) {
				isSubscribed = !isSubscribed;
			} else if (response.status === 401) {
				// Обработка неавторизованного доступа
				console.error('Unauthorized');
			} else {
				error = `Failed to ${isSubscribed ? 'unsubscribe' : 'subscribe'}`;
				console.error(error, response);
			}
		} catch (err) {
			error = `Network error while ${isSubscribed ? 'unsubscribing' : 'subscribing'}`;
			console.error(error, err);
		} finally {
			loading = false;
		}
	}

	$: {
		const username = $page.params.username;
		if ($user.nickname) {
			isOwnProfile = username === $user.nickname;
		}
		loadProfile(username);
		userPins = [];
		columns = Array.from({ length: columnCount }, () => []);
		pageNumber = 1;
		hasMore = true;
		newPinIds.clear();
		loadPins(username, activeTab, pageNumber);
		console.log('Reactive block executed for username:', username);
	}

	onMount(() => {
		if ($user.nickname && $page.params.username === $user.nickname) {
			isOwnProfile = true;
		}

		if (data && data.profile) {
			profileData = data.profile;
			console.log('Initial profile data:', profileData);
		} else {
			console.error('Не удалось получить данные профиля при монтировании');
		}

		checkSubscription();
		updateColumnCount();
		window.addEventListener('resize', updateColumnCount);

		const handleScroll = () => {
			if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
				loadMorePins();
			}
		};
		window.addEventListener('scroll', handleScroll);

		return () => {
			window.removeEventListener('resize', updateColumnCount);
			window.removeEventListener('scroll', handleScroll);
		};
	});
</script>

<svelte:head>
	<title>Hornterest - {$page.params.username}</title>
	<meta
		name="description"
		content={`Профиль пользователя ${$page.params.username} на Hornterest`}
	/>
</svelte:head>

<section>
	<div class="mx-auto px-4 py-10 sm:px-6 lg:px-6 lg:py-8">
		<div class="flex flex-col justify-center rounded-xl bg-neutral-950 px-4 pt-4 text-neutral-200">
			<div class="flex flex-wrap justify-center gap-x-10 gap-y-2 md:gap-y-0">
				<div class="flex gap-x-5">
					<svg
						class="size-40 shrink-0 rounded-full bg-neutral-900 p-3"
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
					<div class="flex flex-col gap-y-3">
						<div class="flex flex-col">
							<div class="flex items-center gap-x-2">
								{#if profileData}
									{#if profileData.name || profileData.surname}
										<p class="text-3xl font-semibold">{profileData.name} {profileData.surname}</p>
									{:else if profileData.nickname}
										<p class="text-3xl font-semibold">@{profileData.nickname}</p>
									{:else}
										<p class="text-3xl font-semibold">Информация отсутствует</p>
									{/if}

									{#if profileData.verification}
										<div class="hs-tooltip inline-block [--trigger:hover]">
											<button
												type="button"
												class="hs-tooltip-toggle flex items-center justify-center"
											>
												<svg
													class="size-10 shrink-0"
													width="64px"
													height="64px"
													viewBox="0 0 48.00 48.00"
													fill="none"
													xmlns="http://www.w3.org/2000/svg"
													stroke="#ab1dff"
													stroke-width="0.00048000000000000007"
												>
													<g
														id="SVGRepo_bgCarrier"
														stroke-width="0"
														transform="translate(0,0), scale(1)"
													/>
													<g
														id="SVGRepo_tracerCarrier"
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke="#CCCCCC"
														stroke-width="0.192"
													/>
													<g id="SVGRepo_iconCarrier">
														<g clip-path="url(#clip0)">
															<path
																fill-rule="evenodd"
																clip-rule="evenodd"
																d="M31.2622 9.99025L31.9947 7.1404L27.886 6L7.0903 18.5174L6 22.7872L8.73351 23.5508L8.00107 26.4007L10.7346 27.1643L10.0021 30.0141L12.7357 30.7778L12.0032 33.6276L14.7367 34.3912L14.0043 37.2411L16.7378 38.0047L16.0053 40.8546L20.1056 42L40.893 29.4876L42 25.2078L39.2665 24.4442L39.9989 21.5943L37.2654 20.8307L37.9979 17.9808L35.2643 17.2172L35.9968 14.3673L33.2633 13.6037L33.9957 10.7539L31.2622 9.99025ZM31.5711 12.1531L28.8376 11.3895L29.5692 8.5428L28.1802 8.15727L8.82502 19.8076L8.42169 21.3871L11.1581 22.1516L10.4257 25.0014L13.1592 25.765L12.4268 28.6149L15.1603 29.3785L14.4278 32.2284L17.1613 32.992L16.4289 35.8419L19.1624 36.6055L18.43 39.4553L19.8131 39.8417L39.1614 28.1955L39.5725 26.6062L36.8419 25.8434L37.5743 22.9935L34.8408 22.2299L35.5732 19.3801L32.8397 18.6165L33.5722 15.7666L30.8387 15.003L31.5711 12.1531Z"
																fill="#ab1dff"
															/>
															<path
																fill-rule="evenodd"
																clip-rule="evenodd"
																d="M24 30.9993C27.866 30.9993 31 27.8653 31 23.9993C31 20.1333 27.866 16.9993 24 16.9993C20.134 16.9993 17 20.1333 17 23.9993C17 27.8653 20.134 30.9993 24 30.9993ZM24 32.9993C28.9706 32.9993 33 28.9698 33 23.9993C33 19.0287 28.9706 14.9993 24 14.9993C19.0294 14.9993 15 19.0287 15 23.9993C15 28.9698 19.0294 32.9993 24 32.9993Z"
																fill="#ab1dff"
															/>
															<path
																fill-rule="evenodd"
																clip-rule="evenodd"
																d="M24 27.0002C25.6569 27.0002 27 25.6571 27 24.0002C27 22.3434 25.6569 21.0002 24 21.0002C22.3431 21.0002 21 22.3434 21 24.0002C21 25.6571 22.3431 27.0002 24 27.0002ZM24 29.0002C26.7614 29.0002 29 26.7617 29 24.0002C29 21.2386 19.0002 19 21.2388 19 24.0002C19 26.7617 21.2386 29.0002 24 29.0002Z"
																fill="#ab1dff"
															/>
														</g>
														<defs>
															<clipPath id="clip0">
																<rect width="48" height="48" fill="white" />
															</clipPath>
														</defs>
													</g>
												</svg>
												<span
													class="hs-tooltip-content hs-tooltip-shown:opacity-100 hs-tooltip-shown:visible invisible absolute z-10 inline-block rounded-lg border bg-white px-4 py-2 text-sm text-gray-600 opacity-0 shadow-md transition-opacity dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400"
													role="tooltip"
												>
													Верифицированный пользователь
												</span>
											</button>
										</div>
									{/if}
								{/if}
							</div>
							{#if profileData}
								{#if profileData.name || profileData.surname}
									<span class="text-sm text-neutral-400">@{profileData.nickname}</span>
								{/if}
							{/if}
						</div>

						{#if !isOwnProfile}
							<div class="my-2 flex">
								<button
									on:click={toggleSubscribe}
									disabled={loading}
									class="flex items-center gap-x-1 rounded-lg bg-white px-3 py-2 text-gray-800 dark:bg-[#ab1dff]/70 dark:text-neutral-200 dark:hover:bg-[#8500d3] dark:focus:bg-[#8500d3]"
								>
									<span class="text-sm font-semibold"
										>{isSubscribed ? 'Отписаться' : 'Подписаться'}</span
									>
								</button>
							</div>
						{/if}

						{#if profileData}
							<p class="flex gap-x-5">
								<span class="text-nowrap hover:underline"
									><span class="font-bold">{profileData.followers}</span> подписчиков</span
								>
								<span class="text-nowrap hover:underline"
									><span class="font-bold">{profileData.following}</span> подписок</span
								>
								<span class="text-nowrap"><span class="font-bold">0</span> лайки</span>
							</p>
						{/if}

						{#if profileData}
							{#if profileData.description}
								<p class="mt-2">{profileData.description}</p>
							{/if}
						{/if}
					</div>
				</div>
				<div class="flex flex-row md:flex-col">
					<button
						type="button"
						class="hs-tooltip hs-tooltip-toggle relative inline-flex size-[48px] items-center justify-center gap-x-2 rounded-full border border-transparent text-sm font-semibold text-white [--placement:right] hover:bg-white/10 focus:bg-white/10 focus:outline-none disabled:pointer-events-none disabled:opacity-50"
					>
						<svg
							class="lucide lucide-square-arrow-out-up-right size-6 shrink-0"
							xmlns="http://www.w3.org/2000/svg"
							width="28"
							height="28"
							viewBox="0 0 24 24"
							fill="none"
							stroke="#ffffff"
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M21 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6" />
							<path d="m21 3-9 9" />
							<path d="M15 3h6v6" />
						</svg>

						<span
							class="hs-tooltip-content hs-tooltip-shown:opacity-100 hs-tooltip-shown:visible shadow-2xs invisible absolute z-10 inline-block rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white opacity-0 transition-opacity dark:bg-neutral-700"
							role="tooltip"
						>
							Скопировать ссылку
						</span>
					</button>

					{#if profileData && isOwnProfile}
						<a
							href="/settings"
							type="button"
							class="hs-tooltip hs-tooltip-toggle lucide lucide-pencil relative inline-flex size-[48px] items-center justify-center gap-x-2 rounded-full border border-transparent text-sm font-semibold text-white [--placement:right] hover:bg-white/10 focus:bg-white/10 focus:outline-none disabled:pointer-events-none disabled:opacity-50"
						>
							<svg
								class="size-6 shrink-0"
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
									d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"
								/>
								<path d="m15 5 4 4" />
							</svg>

							<span
								class="hs-tooltip-content hs-tooltip-shown:opacity-100 hs-tooltip-shown:visible shadow-2xs invisible absolute z-10 inline-block rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white opacity-0 transition-opacity dark:bg-neutral-700"
								role="tooltip"
							>
								Редактировать профиль
							</span>
						</a>
					{/if}
				</div>
			</div>

			<nav class="mt-10 flex justify-center gap-x-1">
				<button
					class:active={activeTab === 'created'}
					on:click={() => switchTab('created')}
					type="button"
					class="-mb-px inline-flex items-center gap-x-2 rounded-t-lg border bg-gray-50 px-4 py-3 text-center text-sm font-medium text-gray-500 hover:text-gray-700 focus:text-gray-700 focus:outline-none disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 dark:focus:text-neutral-200"
				>
					Созданные
				</button>
				<button
					class:active={activeTab === 'saved'}
					on:click={() => switchTab('saved')}
					type="button"
					class="-mb-px inline-flex items-center gap-x-2 rounded-t-lg border bg-gray-50 px-4 py-3 text-center text-sm font-medium text-gray-500 hover:text-gray-700 focus:text-gray-700 focus:outline-none disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 dark:focus:text-neutral-200"
				>
					Сохраненные
				</button>
			</nav>
		</div>

		<div class="mx-auto mt-3 px-4 pb-10 pt-3 sm:px-6 md:py-10 lg:px-6 lg:py-8">
			{#if loadingPins}
				<p class="text-center text-neutral-400">Загрузка пинов...</p>
			{:else if errorPins}
				<p class="text-center text-red-500">Ошибка загрузки пинов: {errorPins.message}</p>
			{:else if userPins.length === 0 && !loadingPins}
				<p class="text-center text-neutral-400">У пользователя пока нет опубликованных пинов.</p>
			{:else}
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
										class="absolute top-0 h-full w-full rounded-xl bg-black/50 px-2 pt-2 opacity-0 transition group-hover:opacity-100"
									>
										<div class="flex items-center justify-between">
											<div class="flex items-center gap-x-3">
												{#if pin.type == 'video'}
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
														<span class="text-sm font-semibold">{formatDuration(pin.duration)}</span
														>
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

											<div
												class="flex items-center gap-x-1 rounded-lg bg-white px-3 py-2 text-gray-800 dark:bg-[#ab1dff]/70 dark:text-neutral-200 dark:hover:bg-[#8500d3] dark:focus:bg-[#8500d3]"
											>
												<span class="text-sm font-semibold">Сохранить</span>
											</div>
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
			{/if}
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
