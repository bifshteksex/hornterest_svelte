<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { formatDate, checkIfUserSaved } from '$lib/utils';
	import MasonryGrid from '$lib/components/MasonryGrid.svelte';
	import type { Pin } from '$lib/types/pin';

	export let data;

	interface Comment {
		id: number;
		user_id: number;
		pin_id: number;
		content: string;
		reply_to_id: number;
		created_at: Date;
	}

	let pinData: any = null;
	let authorData: any = null;
	let alertDiv: HTMLDivElement | null = null;

	let image: HTMLImageElement | null = null;
	let modal: HTMLDivElement | null = null;
	let modalImage: HTMLImageElement | null = null;
	let closeModal: HTMLButtonElement | null = null;
	let openModal: HTMLButtonElement | null = null;

	let likeButton: HTMLButtonElement | null = null;
	let saveButton: HTMLButtonElement | null = null;
	let backButton: HTMLButtonElement | null = null;

	let likesCount: number = 0;
	let isLiked: boolean = false;
	let isSaved: boolean = false;

	let comments: Comment[] = [];
	let commentEnding: string = 'ев';
	let newComment = '';
	let errorMessage = '';

	let pageTitle: string = '';

	let allPins: Pin[] = [];
	let loadingPins = false;
	let hasMorePins = true;
	let pageNumber = 1;
	const limit = 20;

	onMount(async () => {
		if (data && data.status === 302 && data.location === '/') {
			goto('/');

			alertDiv = document.getElementById('dismiss-alert') as HTMLDivElement | null;
			if (alertDiv) {
				showAlert(alertDiv);
				setTimeout(() => {
					dismissAlert(alertDiv!);
					setTimeout(() => {
						if (alertDiv && alertDiv.parentNode) {
							alertDiv.parentNode.removeChild(alertDiv);
						}
					}, 1000);
				}, 3000);
			}

			return;
		}

		if (data && data.pin) {
			pinData = data.pin;
			await fetchLikesCount();
			await checkIfUserLiked();
			await fetchComments();

			const token = localStorage.getItem('authToken');
			if (token) {
				isSaved = await checkIfUserSaved(pinData.id, token);
			}

			if (pinData.title) {
				pageTitle = ' – ' + pinData.title;
			}

			if (pinData.user_id) {
				await fetchAuthorInfo(pinData.user_id);
			}

			if (image && modal && modalImage && closeModal && openModal) {
				openModal.addEventListener('click', openModalHandler);
				image.addEventListener('click', openModalHandler);

				function openModalHandler() {
					if (modalImage) {
						modalImage.src = image!.src;
					}
					modal!.classList.remove('hidden');
					setTimeout(() => {
						modal!.classList.add('opacity-100');
						if (modalImage) {
							modalImage.classList.add('scale-100', 'opacity-100');
						}
					}, 10);
					document.body.classList.add('overflow-hidden');
				}

				function closeModalHandler() {
					if (modal && modalImage) {
						modal.classList.remove('opacity-100');
						modalImage.classList.remove('scale-100', 'opacity-100');
						setTimeout(() => {
							modal!.classList.add('hidden');
						}, 300);
					}
					document.body.classList.remove('overflow-hidden');
				}

				closeModal.addEventListener('click', closeModalHandler);
				modal.addEventListener('click', function (e: MouseEvent) {
					if (e.target === modal) {
						closeModalHandler();
					}
				});
			}

			if (likeButton) {
				likeButton.addEventListener('click', () => handleAction('like'));
			}

			if (saveButton) {
				saveButton.addEventListener('click', () => handleAction('save'));
			}

			if (backButton) {
				backButton.addEventListener('click', () => {
					if (history.length > 1) {
						history.back();
					} else {
						goto('/');
					}
				});
			}

			await fetchPins();
		} else {
			console.error('Не удалось получить данные пина');
		}
	});

	async function fetchPins() {
		if (loadingPins || !hasMorePins) return;
		loadingPins = true;

		try {
			console.log('🔄 Fetching pins, page:', pageNumber);
			const response = await fetch(
				`http://localhost:8080/api/pins?page=${pageNumber}&limit=${limit}`
			);
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const fetchedPins: Pin[] = await response.json();
			console.log('📥 Fetched pins:', fetchedPins.length);

			// Фильтруем текущий пин из результатов
			const filteredPins = fetchedPins.filter((pin) => pin.id !== pinData?.id);
			console.log('🎯 Filtered out current pin, remaining:', filteredPins.length);

			if (filteredPins.length > 0) {
				if (pageNumber === 1) {
					allPins = filteredPins;
				} else {
					// Добавляем только уникальные пины
					const uniqueNewPins = filteredPins.filter(
						(newPin) => !allPins.some((existingPin) => existingPin.id === newPin.id)
					);
					allPins = [...allPins, ...uniqueNewPins];
				}

				// Обновляем флаг hasMorePins
				hasMorePins = fetchedPins.length === limit;
				pageNumber++;
			} else {
				hasMorePins = false;
			}

			console.log('✅ Updated pins:', {
				total: allPins.length,
				hasMore: hasMorePins,
				nextPage: pageNumber
			});
		} catch (err) {
			console.error('❌ Error loading pins:', err);
		} finally {
			loadingPins = false;
		}
	}

	async function checkIfUserLiked() {
		const token = localStorage.getItem('authToken');
		if (!pinData || !token) {
			return;
		}
		const pinId = pinData.id;
		try {
			const response = await fetch(`http://localhost:8080/api/pins/${pinId}/liked`, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json'
				}
			});
			if (response.ok) {
				const data = await response.json();
				isLiked = data.liked;
			} else {
				console.error('Не удалось проверить, лайкнул ли пользователь пин');
			}
		} catch (error) {
			console.error('Ошибка при проверке лайка пользователя:', error);
		}
	}

	async function fetchAuthorInfo(userId: number) {
		try {
			const response = await fetch(`http://localhost:8080/api/users/${userId}`);
			if (response.ok) {
				const author = await response.json();
				console.log('Данные автора:', author);
				authorData = author;
			} else {
				console.error('Не удалось получить информацию об авторе');
			}
		} catch (error) {
			console.error('Ошибка при получении информации об авторе:', error);
		}
	}

	async function fetchComments() {
		const pinId = $page.params.id;
		const response = await fetch(`http://localhost:8080/api/pins/${pinId}/comments`);
		if (response.ok) {
			comments = await response.json();

			console.log(comments);

			const lastDigit = comments.length % 10;
			const lastTwoDigits = comments.length % 100;

			if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
				commentEnding = 'ев';
			} else if (lastDigit === 1) {
				commentEnding = 'й';
			} else if (lastDigit >= 2 && lastDigit <= 4) {
				commentEnding = 'я';
			}

			errorMessage = '';
		} else {
			const errorData = await response.json();
			errorMessage = errorData.message || 'Не удалось загрузить комментарии.';
			console.error('Ошибка при загрузке комментариев:', errorData);
		}
	}

	async function postComment() {
		const pinId = $page.params.id;
		if (!newComment.trim()) {
			errorMessage = 'Пожалуйста, введите текст комментария.';
			return;
		}

		const token = localStorage.getItem('authToken');
		if (!token) {
			errorMessage = 'Вы должны быть авторизованы, чтобы оставлять комментарии.';
			return;
		}

		const response = await fetch(`http://localhost:8080/api/pins/${pinId}/comments`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			},
			body: JSON.stringify({ content: newComment })
		});

		if (response.ok) {
			await fetchComments(); // Обновляем список комментариев
			newComment = ''; // Очищаем поле ввода
			errorMessage = '';
		} else {
			const errorData = await response.json();
			errorMessage = errorData.message || 'Не удалось отправить комментарий.';
			console.error('Ошибка при отправке комментария:', errorData);
		}
	}

	async function handleAction(action: string) {
		const token = localStorage.getItem('authToken');
		if (!pinData || !token) {
			console.error('ID пина отсутствует или пользователь не авторизован');
			return;
		}

		const pinId = pinData.id;
		let method = '';
		let endpoint = '';

		if (action == 'like') {
			method = isLiked ? 'DELETE' : 'POST';
			endpoint = isLiked ? 'unlike' : 'like';
		} else if (action == 'save') {
			method = isSaved ? 'DELETE' : 'POST';
			endpoint = isSaved ? 'unsave' : 'save';
		}

		try {
			const response = await fetch(`http://localhost:8080/api/pins/${pinId}/${endpoint}`, {
				method: method,
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json'
				}
			});

			if (response.ok) {
				if (action == 'like') {
					console.log(`Лайк успешно ${isLiked ? 'удален' : 'поставлен'}`);
					isLiked = !isLiked;
					await fetchLikesCount();
				} else if (action == 'save') {
					console.log(`Пин успешно ${isSaved ? 'отменен' : 'сохранен'}`);
					isSaved = !isSaved;
				}
			} else {
				const errorData = await response.json();
				console.error(errorData);
			}
		} catch (error) {
			console.error('Ошибка при отправке запроса на лайк:', error);
		}
	}

	async function fetchLikesCount() {
		if (!pinData) {
			return;
		}
		const pinId = pinData.id;
		try {
			const response = await fetch(`http://localhost:8080/api/pins/${pinId}/likes/count`);
			if (response.ok) {
				const data = await response.json();
				console.log(data);
				likesCount = data.likes_count;
			} else {
				console.error('Не удалось получить количество лайков');
			}
		} catch (error) {
			console.error('Ошибка при получении количества лайков:', error);
		}
	}

	// Функция для показа алерта с анимацией
	function showAlert(element: HTMLDivElement) {
		if (element) {
			element.classList.remove('translate-y-full', 'opacity-0');
			element.classList.add('translate-y-0', 'opacity-100');
		}
	}

	// Функция для скрытия алерта с анимацией
	function dismissAlert(element: HTMLDivElement) {
		if (element) {
			element.classList.remove('translate-y-0', 'opacity-100');
			element.classList.add('translate-y-full', 'opacity-0');
		}
	}
</script>

<svelte:head>
	<title>Hornterest{pageTitle}</title>
	<meta name="description" content="Публикация на Hornterest" />
</svelte:head>

<section>
	<div class="mx-auto sm:px-6 lg:px-6 lg:py-8">
		{#if pinData}
			<div class="mx-auto flex w-full max-w-5xl justify-center">
				<div class="relative flex w-full justify-center">
					<div
						class="flex h-full w-full flex-col rounded-xl border md:max-h-[calc(100vh-10rem)] md:flex-row dark:border-neutral-700"
					>
						<div class="relative flex h-full w-full justify-center">
							<div class="absolute left-0 top-0 md:-left-20 md:top-2">
								<button
									bind:this={backButton}
									type="button"
									class="relative inline-flex size-[48px] items-center justify-center gap-x-2 rounded-full border border-transparent text-sm font-semibold text-white hover:bg-white/10 focus:bg-white/10 focus:outline-none disabled:pointer-events-none disabled:opacity-50"
								>
									<svg
										class="size-8 shrink-0"
										xmlns="http://www.w3.org/2000/svg"
										width="36"
										height="36"
										viewBox="0 0 24 24"
										fill="none"
										stroke="#ffffff"
										stroke-width="1"
										stroke-linecap="round"
										stroke-linejoin="round"
									>
										<path d="m12 19-7-7 7-7" />
										<path d="M19 12H5" />
									</svg>
								</button>
							</div>

							{#if pinData.type == 'image'}
								<img
									bind:this={image}
									id="galleryImage"
									class="h-full cursor-pointer rounded-xl object-contain md:rounded-l-xl md:rounded-r-none"
									src={pinData.path}
									alt={pinData.description}
								/>

								<div class="absolute bottom-0 right-0">
									<button
										bind:this={openModal}
										type="button"
										class="relative inline-flex size-[48px] items-center justify-center gap-x-2 rounded-full border border-transparent text-sm font-semibold text-white hover:bg-white/10 focus:bg-white/10 focus:outline-none disabled:pointer-events-none disabled:opacity-50"
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
											<polyline points="15 3 21 3 21 9" />
											<polyline points="9 21 3 21 3 15" />
											<line x1="21" x2="14" y1="3" y2="10" />
											<line x1="3" x2="10" y1="21" y2="14" />
										</svg>
									</button>
								</div>
							{:else if pinData.type == 'video'}
								<video
									class="h-full cursor-pointer rounded-xl object-contain md:rounded-l-xl md:rounded-r-none"
									src={pinData.path}
									controls
									playsinline
									muted
								></video>
							{/if}
						</div>

						<!-- Модальное окно -->
						<div
							bind:this={modal}
							id="imageModal"
							class="fixed inset-0 z-50 flex hidden items-center justify-center bg-black/80 opacity-0 backdrop-blur transition-opacity duration-300 ease-in-out"
						>
							<img
								bind:this={modalImage}
								id="modalImage"
								class="max-h-full max-w-full scale-100 transform rounded-lg opacity-0 transition-all duration-300 ease-in-out"
							/>
							<button
								bind:this={closeModal}
								id="closeModal"
								type="button"
								class="absolute right-2 top-2 inline-flex items-center gap-x-2 rounded-full border border-transparent bg-gray-100 p-2 text-sm font-semibold text-gray-800 hover:bg-gray-200 focus:bg-gray-200 focus:outline-none disabled:pointer-events-none disabled:opacity-50 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 dark:hover:text-white dark:focus:bg-white/20 dark:focus:text-white"
							>
								<span class="sr-only">Dismiss</span>
								<svg
									class="size-5 shrink-0"
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
						</div>

						<div class="flex h-full w-full flex-col text-neutral-200">
							<div class="flex h-full flex-col justify-between">
								<div>
									<div class="flex items-start justify-between gap-x-5 pr-4 pt-4">
										<div class="flex items-center gap-x-2">
											<div class="flex items-center">
												<button
													bind:this={likeButton}
													type="button"
													class="lucide lucide-heart relative inline-flex size-[48px] items-center justify-center gap-x-2 rounded-full border border-transparent text-sm font-semibold text-white hover:bg-white/10 focus:bg-white/10 focus:outline-none disabled:pointer-events-none disabled:opacity-50"
												>
													<svg
														class="size-6 shrink-0 transition-all duration-300 ease-in-out"
														xmlns="http://www.w3.org/2000/svg"
														width="28"
														height="28"
														viewBox="0 0 24 24"
														fill={isLiked ? '#ab1dff' : 'none'}
														stroke={isLiked ? '#ab1dff' : '#ffffff'}
														stroke-width="1.5"
														stroke-linecap="round"
														stroke-linejoin="round"
													>
														<path
															d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
														/>
													</svg>
												</button>
												<p class="font-semibold">{likesCount}</p>
											</div>

											<button
												type="button"
												class="lucide lucide-square-arrow-out-up-right relative inline-flex size-[48px] items-center justify-center gap-x-2 rounded-full border border-transparent text-sm font-semibold text-white hover:bg-white/10 focus:bg-white/10 focus:outline-none disabled:pointer-events-none disabled:opacity-50"
											>
												<svg
													class="size-6 shrink-0"
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
											</button>

											<div class="hs-dropdown relative inline-flex">
												<button
													id="hs-dropdown-custom-icon-trigger"
													type="button"
													class="lucide lucide-ellipsis relative inline-flex size-[48px] items-center justify-center gap-x-2 rounded-full border border-transparent text-sm font-semibold text-white hover:bg-white/10 focus:bg-white/10 focus:outline-none disabled:pointer-events-none disabled:opacity-50"
													aria-haspopup="menu"
													aria-expanded="false"
													aria-label="Dropdown"
												>
													<svg
														class="size-6 shrink-0"
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
														<circle cx="12" cy="12" r="1" />
														<circle cx="19" cy="12" r="1" />
														<circle cx="5" cy="12" r="1" />
													</svg>
												</button>

												<div
													class="hs-dropdown-menu duration hs-dropdown-open:opacity-100 mt-2 hidden min-w-60 rounded-lg bg-white opacity-0 shadow-md transition-[opacity,margin] dark:border dark:border-neutral-700 dark:bg-neutral-800"
													role="menu"
													aria-orientation="vertical"
													aria-labelledby="hs-dropdown-custom-icon-trigger"
												>
													<div class="space-y-0.5 p-1">
														<a
															class="flex items-center gap-x-3.5 rounded-lg px-3 py-2 text-sm text-gray-800 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-300 dark:focus:bg-neutral-700"
															href="#"
														>
															Скачать изображение
														</a>
														<a
															class="flex cursor-pointer items-center gap-x-3.5 rounded-lg px-3 py-2 text-sm text-gray-800 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-300 dark:focus:bg-neutral-700"
															aria-haspopup="dialog"
															aria-expanded="false"
															aria-controls="hs-scale-animation-modal"
															data-hs-overlay="#hs-scale-animation-modal"
														>
															Пожаловаться
														</a>
													</div>
												</div>
											</div>
										</div>
										<button
											bind:this={saveButton}
											class="flex items-center gap-x-1 rounded-lg bg-white px-3 py-2 text-gray-800 {isSaved
												? 'border dark:bg-transparent'
												: 'dark:bg-[#ab1dff]'} dark:text-neutral-200"
										>
											<span class="font-semibold">{isSaved ? 'Сохранено' : 'Сохранить'}</span>
										</button>
									</div>

									<div class="overflow-auto p-4">
										<h3 class="text-2xl">{pinData.description}</h3>

										{#if authorData}
											<div class="mt-3 flex items-center gap-x-3">
												<div class="relative inline-block">
													<img
														class="inline-block size-8 rounded-full"
														src="https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80"
														alt="Avatar"
													/>
													<span
														class="absolute bottom-0 end-0 block size-1.5 rounded-full bg-green-500 ring-2 ring-white dark:ring-neutral-900"
													></span>
												</div>
												<div class="flex flex-col text-sm text-neutral-200">
													{#if authorData.name || authorData.surname}
														<p>{authorData.name} {authorData.surname}</p>
													{:else}
														<p>@{authorData.nickname}</p>
													{/if}
													<span>{authorData.followers} подписчиков</span>
												</div>
											</div>
										{/if}

										<div class="hs-accordion" id="hs-basic-with-arrow-heading-two">
											<button
												class="hs-accordion-toggle inline-flex w-full items-center gap-x-3 rounded-lg py-3 text-start font-semibold text-gray-800 hover:text-gray-500 focus:text-gray-500 focus:outline-none disabled:pointer-events-none disabled:opacity-50 dark:text-neutral-200 dark:hover:text-neutral-400 dark:focus:text-neutral-400"
												aria-expanded="false"
												aria-controls="hs-basic-with-arrow-collapse-two"
											>
												<svg
													class="hs-accordion-active:hidden block size-4"
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
													<path d="m6 9 6 6 6-6"></path>
												</svg>
												<svg
													class="hs-accordion-active:block hidden size-4"
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
													<path d="m18 15-6-6-6 6"></path>
												</svg>
												{#if comments.length > 0}
													{comments.length} комментари{commentEnding}
												{:else}
													Комментариев пока нет
												{/if}
											</button>
											<div
												id="hs-basic-with-arrow-collapse-two"
												class="hs-accordion-content hidden w-full overflow-hidden transition-[height] duration-300"
												role="region"
												aria-labelledby="hs-basic-with-arrow-heading-two"
											>
												<div class="flex max-h-96 flex-col gap-y-3 overflow-auto">
													{#each comments as comment}
														<div class="flex items-start gap-x-3">
															<div class="relative inline-block min-w-fit">
																<img
																	class="inline-block size-6 rounded-full"
																	src="https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80"
																	alt="Avatar"
																/>
																<span
																	class="absolute bottom-0 end-0 block size-1.5 rounded-full bg-green-500 ring-2 ring-white dark:ring-neutral-900"
																></span>
															</div>
															<div class="flex flex-col text-sm text-neutral-200">
																<p>User</p>
																<p>{comment.content}</p>
																<div class="flex items-center gap-x-5 text-xs text-neutral-400">
																	<p>{formatDate(new Date(comment.created_at))}</p>
																	<p class="font-semibold">Ответить</p>
																	<button
																		type="button"
																		class="lucide lucide-heart relative inline-flex size-6 items-center justify-center gap-x-2 rounded-full border border-transparent text-sm font-semibold text-white hover:bg-white/10 focus:bg-white/10 focus:outline-none disabled:pointer-events-none disabled:opacity-50"
																	>
																		<svg
																			class="size-4 shrink-0"
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
																			<path
																				d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
																			/>
																		</svg>
																	</button>
																	<div class="hs-dropdown relative inline-flex">
																		<button
																			id="hs-dropdown-custom-icon-trigger"
																			type="button"
																			class="lucide lucide-ellipsis relative inline-flex size-6 items-center justify-center gap-x-2 rounded-full border border-transparent text-sm font-semibold text-white hover:bg-white/10 focus:bg-white/10 focus:outline-none disabled:pointer-events-none disabled:opacity-50"
																			aria-haspopup="menu"
																			aria-expanded="false"
																			aria-label="Dropdown"
																		>
																			<svg
																				class="size-4 shrink-0"
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
																				<circle cx="12" cy="12" r="1" />
																				<circle cx="19" cy="12" r="1" />
																				<circle cx="5" cy="12" r="1" />
																			</svg>
																		</button>

																		<div
																			class="hs-dropdown-menu duration hs-dropdown-open:opacity-100 z-50 mt-2 hidden min-w-60 rounded-lg bg-white opacity-0 shadow-md transition-[opacity,margin] dark:border dark:border-neutral-700 dark:bg-neutral-800"
																			role="menu"
																			aria-orientation="vertical"
																			aria-labelledby="hs-dropdown-custom-icon-trigger"
																		>
																			<div class="space-y-0.5 p-1">
																				<a
																					class="flex cursor-pointer items-center gap-x-3.5 rounded-lg px-3 py-2 text-sm text-gray-800 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-300 dark:focus:bg-neutral-700"
																					aria-haspopup="dialog"
																					aria-expanded="false"
																					aria-controls="hs-scale-animation-modal"
																					data-hs-overlay="#hs-scale-animation-modal"
																				>
																					Пожаловаться
																				</a>
																			</div>
																		</div>
																	</div>
																</div>
															</div>
														</div>
													{/each}
												</div>
											</div>
										</div>
									</div>
								</div>

								<div class="p-4">
									<label for="comment" class="mb-2 block text-sm font-medium dark:text-white"
										>Добавьте комментарий</label
									>
									{#if errorMessage}
										<p class="error">{errorMessage}</p>
									{/if}
									<form on:submit|preventDefault={postComment}>
										<div class="relative w-full">
											<input
												bind:value={newComment}
												type="text"
												id="comment"
												class="block w-full rounded-lg border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:ring-blue-500 disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
												placeholder="Что думаете?"
											/>

											<div
												class="absolute inset-y-0 end-0 z-20 flex cursor-pointer items-center pe-2 text-gray-400"
											>
												<button
													id="hs-dropdown-custom-icon-trigger"
													type="submit"
													class="lucide lucide-send relative inline-flex size-8 items-center justify-center gap-x-2 rounded-lg border border-transparent bg-[#ab1dff] text-sm font-semibold text-white hover:bg-[#8500d3] focus:bg-[#8500d3] focus:outline-none disabled:pointer-events-none disabled:opacity-50"
													aria-haspopup="menu"
													aria-expanded="false"
													aria-label="Dropdown"
												>
													<svg
														class="size-4 shrink-0"
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
															d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"
														/>
														<path d="m21.854 2.147-10.94 10.939" />
													</svg>
												</button>
											</div>
										</div>
									</form>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		{/if}

		<MasonryGrid
			pins={allPins}
			loading={loadingPins}
			hasMore={hasMorePins}
			onFetchMore={fetchPins}
		/>
	</div>
</section>
