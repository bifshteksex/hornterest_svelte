<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { error } from '@sveltejs/kit';
	import { goto } from '$app/navigation';
	import countriesData from '$lib/countries.json';

	let profileData: any = null;

	let nickname: string = '';
	let description: string = '';
	let name: string = '';
	let surname: string = '';
	let privateProfile: boolean = false;
	let email: string = '';
	let birth: string = '';
	let comment: boolean = false;
	let autoplay: boolean = false;
	let twoFa: boolean = false;
	let selectedCountry: string | null = null; // Здесь будет храниться alpha2

	// Сохраняем первоначальные значения для кнопки "Отменить"
	let originalNickname: string = '';
	let originalDescription: string = '';
	let originalName: string = '';
	let originalSurname: string = '';
	let originalPrivateProfile: boolean = false;
	let originalBirth: string = '';
	let originalComment: boolean = false;
	let originalAutoplay: boolean = false;
	let originalTwoFa: boolean = false;
	let originalSelectedCountry: string | null = null;

	let isModified: boolean = false; // Флаг, показывающий, были ли изменения

	let searchInput: HTMLInputElement;
	let searchTerm: string = ''; // Для поиска стран
	let filteredCountries = countriesData;
	let isSelectOpen: boolean = false;
	let selectButton: HTMLButtonElement;
	let selectList: HTMLUListElement;
	let displayedCountryName: string | null = null; // Для отображения названия выбранной страны

	function setModified() {
		isModified = true;
	}

	function filterCountries() {
		filteredCountries = countriesData.filter((country) =>
			country.name.toLowerCase().includes(searchTerm.toLowerCase())
		);
	}

	async function getUserData() {
		const token = localStorage.getItem('authToken');
		const authNickname = localStorage.getItem('nickname');
		if (!authNickname || !token) {
			goto('/');
		}

		try {
			const response = await fetch(`http://localhost:8080/api/users/${authNickname}`, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json'
				}
			});
			if (response.ok) {
				const profile = await response.json();
				profileData = profile;

				nickname = profileData.nickname;
				description = profileData.description;
				name = profileData.name;
				surname = profileData.surname;
				privateProfile = profileData.private;
				email = profileData.email;
				comment = profileData.comment;
				autoplay = profileData.autoplay;
				twoFa = profileData.twoFa;
				selectedCountry = profileData.country || null;

				// Форматируем дату рождения для input type="date"
				if (profileData.birth) {
					birth = profileData.birth.substring(0, 10); // Берем только YYYY-MM-DD
				} else {
					birth = ''; // Или другое значение по умолчанию, если birth отсутствует
				}
				originalBirth = birth; // Сохраняем первоначальное значение

				// Находим название страны для отображения
				displayedCountryName = selectedCountry
					? countriesData.find((c) => c.alpha2 === selectedCountry)?.name || null
					: null;

				// Сохраняем остальные первоначальные значения
				originalNickname = profileData.nickname;
				originalDescription = profileData.description;
				originalName = profileData.name;
				originalSurname = profileData.surname;
				originalPrivateProfile = profileData.private;
				originalComment = profileData.comment;
				originalAutoplay = profileData.autoplay;
				originalTwoFa = profileData.twoFa;
				originalSelectedCountry = profileData.country || null;

				isModified = false; // Сбрасываем флаг после загрузки данных
			} else if (response.status === 401) {
				console.error('Unauthorized');
				goto('/');
			} else {
				console.error(error, response);
			}
		} catch (err) {
			console.error(error, err);
		}
	}

	function resetForm() {
		nickname = originalNickname;
		description = originalDescription;
		name = originalName;
		surname = originalSurname;
		privateProfile = originalPrivateProfile;
		birth = originalBirth;
		comment = originalComment;
		autoplay = originalAutoplay;
		twoFa = originalTwoFa;
		isModified = false;
		selectedCountry = originalSelectedCountry;
		displayedCountryName = originalSelectedCountry
			? countriesData.find((c) => c.alpha2 === originalSelectedCountry)?.name || null
			: null;
	}

	async function saveChanges() {
		const token = localStorage.getItem('authToken');
		if (!token || !profileData?.id) {
			console.error('No token or user ID available');
			return;
		}

		let rfc3339Birth = birth;
		if (birth) {
			rfc3339Birth = new Date(birth).toISOString();
		}

		const updateData = {
			nickname: nickname,
			description: description,
			name: name,
			surname: surname,
			private: privateProfile,
			country: selectedCountry,
			birth: rfc3339Birth,
			comment: comment,
			autoplay: autoplay,
			twoFa: twoFa
		};

		try {
			const response = await fetch(`http://localhost:8080/api/users/${profileData.id}`, {
				method: 'PUT',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(updateData)
			});

			if (response.ok) {
				console.log('Profile updated successfully');
				await getUserData();
			} else {
				const errorText = await response.text();
				console.error('Failed to update profile', response.status, errorText);
				try {
					const errorData = JSON.parse(errorText);
					console.error('Error details:', errorData);
				} catch (e) {
					console.error('Failed to parse error JSON:', errorText);
				}
			}
		} catch (err) {
			console.error('Network error during profile update', err);
		}
	}

	async function toggleSelect() {
		isSelectOpen = !isSelectOpen;
		if (isSelectOpen) {
			await tick(); // Ждем обновления DOM
			if (searchInput) {
				searchInput.focus(); // Устанавливаем фокус
			}
		}
		if (!isSelectOpen) {
			searchTerm = ''; // Сбрасываем поиск при закрытии
			filterCountries(); // Обновляем список
		}
	}

	function selectCountry(alpha2: string, name: string) {
		selectedCountry = alpha2; // Сохраняем alpha2
		displayedCountryName = name; // Отображаем название
		isSelectOpen = false;
		setModified();
	}

	function handleClickOutside(event: MouseEvent) {
		if (
			isSelectOpen &&
			selectButton &&
			selectList &&
			!selectButton.contains(event.target as Node) &&
			!selectList.contains(event.target as Node)
		) {
			isSelectOpen = false;
		}
	}

	onMount(() => {
		getUserData();
		document.addEventListener('click', handleClickOutside);

		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});
</script>

<svelte:head>
	<title>Hornterest - редактирование профиля</title>
	<meta name="description" content="Редактирование профиля Hornterest" />
</svelte:head>

<section>
	<div class="mx-auto px-4 py-10 sm:px-6 lg:px-6 lg:py-8">
		<div class="flex flex-wrap rounded-xl bg-neutral-950 p-10 text-neutral-200">
			<div
				class="flex flex-col justify-between border-gray-200 md:border-e dark:border-neutral-700"
			>
				<nav
					class="flex flex-col space-y-3"
					aria-label="Tabs"
					role="tablist"
					aria-orientation="horizontal"
				>
					<button
						type="button"
						class="hs-tab-active:border-[#ab1dff] hs-tab-active:text-[#ab1dff] dark:hs-tab-active:text-[#ab1dff] active inline-flex items-center gap-x-2 whitespace-nowrap border-transparent py-1 pe-4 text-lg font-medium text-gray-500 hover:text-[#ab1dff] focus:text-[#ab1dff] focus:outline-none disabled:pointer-events-none disabled:opacity-50 md:border-e-2 dark:text-neutral-400 dark:hover:text-[#ab1dff]"
						id="vertical-tab-with-border-item-1"
						aria-selected="true"
						data-hs-tab="#vertical-tab-with-border-1"
						aria-controls="vertical-tab-with-border-1"
						role="tab"
					>
						Редактирование профиля
					</button>
					<button
						type="button"
						class="hs-tab-active:border-[#ab1dff] hs-tab-active:text-[#ab1dff] dark:hs-tab-active:text-[#ab1dff] inline-flex items-center gap-x-2 whitespace-nowrap border-transparent py-1 pe-4 text-lg font-medium text-gray-500 hover:text-[#ab1dff] focus:text-[#ab1dff] focus:outline-none disabled:pointer-events-none disabled:opacity-50 md:border-e-2 dark:text-neutral-400 dark:hover:text-[#ab1dff]"
						id="vertical-tab-with-border-item-2"
						aria-selected="false"
						data-hs-tab="#vertical-tab-with-border-2"
						aria-controls="vertical-tab-with-border-2"
						role="tab"
					>
						Управление аккаунтом
					</button>
					<button
						type="button"
						class="hs-tab-active:border-[#ab1dff] hs-tab-active:text-[#ab1dff] dark:hs-tab-active:text-[#ab1dff] inline-flex items-center gap-x-2 whitespace-nowrap border-transparent py-1 pe-4 text-lg font-medium text-gray-500 hover:text-[#ab1dff] focus:text-[#ab1dff] focus:outline-none disabled:pointer-events-none disabled:opacity-50 md:border-e-2 dark:text-neutral-400 dark:hover:text-[#ab1dff]"
						id="vertical-tab-with-border-item-3"
						aria-selected="false"
						data-hs-tab="#vertical-tab-with-border-3"
						aria-controls="vertical-tab-with-border-3"
						role="tab"
					>
						Разрешения для сообщества
					</button>
					<button
						type="button"
						class="hs-tab-active:border-[#ab1dff] hs-tab-active:text-[#ab1dff] dark:hs-tab-active:text-[#ab1dff] inline-flex items-center gap-x-2 whitespace-nowrap border-transparent py-1 pe-4 text-lg font-medium text-gray-500 hover:text-[#ab1dff] focus:text-[#ab1dff] focus:outline-none disabled:pointer-events-none disabled:opacity-50 md:border-e-2 dark:text-neutral-400 dark:hover:text-[#ab1dff]"
						id="vertical-tab-with-border-item-4"
						aria-selected="false"
						data-hs-tab="#vertical-tab-with-border-4"
						aria-controls="vertical-tab-with-border-4"
						role="tab"
					>
						Безопасность
					</button>
				</nav>

				<div class="flex w-full flex-col gap-y-2 pr-5">
					<button
						disabled={!isModified}
						on:click={saveChanges}
						type="submit"
						class="flex items-center justify-center gap-x-1 rounded-lg bg-white px-3 py-2 text-gray-800 disabled:cursor-not-allowed disabled:opacity-20 dark:bg-[#ab1dff] dark:text-neutral-200"
					>
						<span class="font-semibold">Сохранить</span>
					</button>

					<button
						disabled={!isModified}
						on:click={resetForm}
						type="button"
						class="flex items-center justify-center gap-x-1 rounded-lg border bg-white px-3 py-2 text-gray-800 disabled:cursor-not-allowed disabled:opacity-20 disabled:hover:bg-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800 dark:focus:bg-neutral-800"
					>
						<span class="font-semibold">Отменить</span>
					</button>
				</div>
			</div>

			<div class="mx-auto ml-10 hidden max-w-5xl md:block">
				<div
					id="vertical-tab-with-border-1"
					role="tabpanel"
					aria-labelledby="vertical-tab-with-border-item-1"
				>
					<div class="flex flex-col">
						<h2 class="text-3xl font-semibold">Редактирование профиля</h2>
						<p class="text-neutral-400">
							Позаботьтесь о конфиденциальности личных данных.<br />Добавляемая вами информация
							видна всем, кто может просматривать ваш профиль.
						</p>
					</div>

					<div class="mt-10 flex flex-col gap-y-5">
						<div>
							<template data-hs-file-upload-preview="">
								<div class="size-20">
									<img class="w-full rounded-full object-contain" data-dz-thumbnail="" />
								</div>
							</template>

							<div class="flex flex-wrap items-center gap-3 sm:gap-5">
								<div
									class="group"
									data-hs-file-upload-previews=""
									data-hs-file-upload-pseudo-trigger=""
								>
									<span
										class="flex size-20 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-dotted border-gray-300 text-gray-400 hover:bg-gray-50 group-has-[div]:hidden dark:border-neutral-700 dark:text-neutral-600 dark:hover:bg-neutral-700/50"
									>
										<svg
											class="size-7 shrink-0"
											xmlns="http://www.w3.org/2000/svg"
											width="24"
											height="24"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="1.5"
											stroke-linecap="round"
											stroke-linejoin="round"
										>
											<circle cx="12" cy="12" r="10"></circle>
											<circle cx="12" cy="10" r="3"></circle>
											<path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"></path>
										</svg>
									</span>
								</div>

								<div class="grow">
									<div class="flex items-center gap-x-2">
										<button
											type="button"
											class="inline-flex items-center gap-x-2 rounded-lg border border-transparent bg-[#ab1dff] px-3 py-2 text-xs font-medium text-white hover:bg-[#8500d3] focus:bg-[#8500d3] focus:outline-none disabled:pointer-events-none disabled:opacity-50"
											data-hs-file-upload-trigger=""
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
												<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
												<polyline points="17 8 12 3 7 8"></polyline>
												<line x1="12" x2="12" y1="3" y2="15"></line>
											</svg>
											Загрузить
										</button>
										<button
											type="button"
											class="inline-flex items-center gap-x-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-500 shadow-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:focus:bg-neutral-800"
											data-hs-file-upload-clear="">Удалить</button
										>
									</div>
								</div>
							</div>
						</div>

						<div class="flex w-full items-center gap-x-5">
							<!-- Floating Input -->
							<div class="relative w-full">
								<input
									on:input={setModified}
									bind:value={name}
									type="text"
									id="hs-floating-input-name"
									class="peer block w-full rounded-lg border-gray-200 p-4 text-sm placeholder:text-transparent autofill:pb-2 autofill:pt-6 focus:border-blue-500 focus:pb-2 focus:pt-6 focus:ring-blue-500 disabled:pointer-events-none disabled:opacity-50
dark:border-neutral-700
dark:bg-neutral-900
dark:text-white
dark:focus:ring-neutral-600
[&:not(:placeholder-shown)]:pb-2
[&:not(:placeholder-shown)]:pt-6"
									placeholder="Имя"
								/>
								<label
									for="hs-floating-input-name"
									class="pointer-events-none absolute start-0 top-0 h-full origin-[0_0] truncate border border-transparent p-4 text-sm transition duration-100 ease-in-out peer-focus:-translate-y-1.5 peer-focus:translate-x-0.5 peer-focus:scale-90
  peer-focus:text-gray-500
  peer-disabled:pointer-events-none
  peer-disabled:opacity-50
  peer-[:not(:placeholder-shown)]:-translate-y-1.5 peer-[:not(:placeholder-shown)]:translate-x-0.5
  peer-[:not(:placeholder-shown)]:scale-90
  peer-[:not(:placeholder-shown)]:text-gray-500
  dark:text-neutral-500
  dark:text-white dark:peer-focus:text-neutral-500 dark:peer-[:not(:placeholder-shown)]:text-neutral-500"
									>Имя</label
								>
							</div>
							<!-- End Floating Input -->

							<!-- Floating Input -->
							<div class="relative w-full">
								<input
									on:input={setModified}
									bind:value={surname}
									type="text"
									id="hs-floating-input-surname"
									class="peer block w-full rounded-lg border-gray-200 p-4 text-sm placeholder:text-transparent autofill:pb-2 autofill:pt-6 focus:border-blue-500 focus:pb-2 focus:pt-6 focus:ring-blue-500 disabled:pointer-events-none disabled:opacity-50
dark:border-neutral-700
dark:bg-neutral-900
dark:text-white
dark:focus:ring-neutral-600
[&:not(:placeholder-shown)]:pb-2
[&:not(:placeholder-shown)]:pt-6"
									placeholder="Фамилия"
								/>
								<label
									for="hs-floating-input-surname"
									class="pointer-events-none absolute start-0 top-0 h-full origin-[0_0] truncate border border-transparent p-4 text-sm transition duration-100 ease-in-out peer-focus:-translate-y-1.5 peer-focus:translate-x-0.5 peer-focus:scale-90
  peer-focus:text-gray-500
  peer-disabled:pointer-events-none
  peer-disabled:opacity-50
  peer-[:not(:placeholder-shown)]:-translate-y-1.5 peer-[:not(:placeholder-shown)]:translate-x-0.5
  peer-[:not(:placeholder-shown)]:scale-90
  peer-[:not(:placeholder-shown)]:text-gray-500
  dark:text-neutral-500
  dark:text-white dark:peer-focus:text-neutral-500 dark:peer-[:not(:placeholder-shown)]:text-neutral-500"
									>Фамилия</label
								>
							</div>
							<!-- End Floating Input -->
						</div>

						<!-- Floating Textarea -->
						<div class="relative">
							<textarea
								on:input={setModified}
								bind:value={description}
								id="hs-floating-textarea"
								class="peer block w-full rounded-lg border-gray-200 p-4 text-sm placeholder:text-transparent autofill:pb-2 autofill:pt-6 focus:border-blue-500 focus:pb-2 focus:pt-6 focus:ring-blue-500 disabled:pointer-events-none disabled:opacity-50
dark:border-neutral-700
dark:bg-neutral-900
dark:text-white
dark:focus:ring-neutral-600
[&:not(:placeholder-shown)]:pb-2
[&:not(:placeholder-shown)]:pt-6"
								placeholder="Описание"
								data-hs-textarea-auto-height=""
							></textarea>
							<label
								for="hs-floating-textarea"
								class="pointer-events-none absolute start-0 top-0 h-full origin-[0_0] truncate border border-transparent p-4 text-sm transition duration-100 ease-in-out peer-focus:-translate-y-1.5 peer-focus:text-xs peer-focus:text-gray-500
  peer-disabled:pointer-events-none
  peer-disabled:opacity-50
  peer-[:not(:placeholder-shown)]:-translate-y-1.5 peer-[:not(:placeholder-shown)]:text-xs
  peer-[:not(:placeholder-shown)]:text-gray-500
  dark:text-neutral-500
  dark:text-white dark:peer-focus:text-neutral-500 dark:peer-[:not(:placeholder-shown)]:text-neutral-500"
								>Описание</label
							>
						</div>
						<!-- End Floating Textarea -->

						<!-- Floating Input -->
						<div class="relative">
							<input
								on:input={setModified}
								bind:value={nickname}
								type="text"
								id="hs-floating-input-nickname"
								class="peer block w-full rounded-lg border-gray-200 p-4 text-sm placeholder:text-transparent autofill:pb-2 autofill:pt-6 focus:border-blue-500 focus:pb-2 focus:pt-6 focus:ring-blue-500 disabled:pointer-events-none disabled:opacity-50
dark:border-neutral-700
dark:bg-neutral-900
dark:text-white
dark:focus:ring-neutral-600
[&:not(:placeholder-shown)]:pb-2
[&:not(:placeholder-shown)]:pt-6"
								placeholder="Имя пользователя"
							/>
							<label
								for="hs-floating-input-nickname"
								class="pointer-events-none absolute start-0 top-0 h-full origin-[0_0] truncate border border-transparent p-4 text-sm transition duration-100 ease-in-out peer-focus:-translate-y-1.5 peer-focus:translate-x-0.5 peer-focus:scale-90
  peer-focus:text-gray-500
  peer-disabled:pointer-events-none
  peer-disabled:opacity-50
  peer-[:not(:placeholder-shown)]:-translate-y-1.5 peer-[:not(:placeholder-shown)]:translate-x-0.5
  peer-[:not(:placeholder-shown)]:scale-90
  peer-[:not(:placeholder-shown)]:text-gray-500
  dark:text-neutral-500
  dark:text-white dark:peer-focus:text-neutral-500 dark:peer-[:not(:placeholder-shown)]:text-neutral-500"
								>Имя пользователя</label
							>
						</div>
						<!-- End Floating Input -->

						<div class="flex items-start">
							<input
								on:input={setModified}
								bind:checked={privateProfile}
								type="checkbox"
								id="hs-basic-with-description-unchecked"
								class="relative h-7 w-[3.25rem] cursor-pointer rounded-full border-transparent bg-gray-100 p-px text-transparent transition-colors duration-200 ease-in-out before:inline-block before:size-6 before:translate-x-0 before:transform before:rounded-full before:bg-white before:shadow before:ring-0 before:transition before:duration-200 before:ease-in-out checked:border-[#ab1dff] checked:bg-[#ab1dff] checked:bg-none checked:text-[#ab1dff] checked:before:translate-x-full checked:before:bg-blue-200 focus:ring-blue-600 focus:checked:border-[#ab1dff] disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:before:bg-neutral-400 dark:checked:before:bg-blue-200 dark:focus:ring-offset-gray-600"
							/>
							<label
								for="hs-basic-with-description-unchecked"
								class="ms-3 text-sm text-gray-500 dark:text-neutral-400"
							>
								<p class="text-white">Частный профиль</p>
								<p>
									Если у вас частный профиль, только одобренные вами<br /> люди могут просматривать его,
									а также ваши пины, доски, подписчиков и подписки.
								</p>
							</label>
						</div>
					</div>
				</div>
				<div
					id="vertical-tab-with-border-2"
					class="hidden"
					role="tabpanel"
					aria-labelledby="vertical-tab-with-border-item-2"
				>
					<div class="flex flex-col">
						<h2 class="text-3xl font-semibold">Управление аккаунтом</h2>
						<p class="text-neutral-400">Вы можете изменить персональные данные</p>
					</div>

					<div class="mt-10 flex flex-col gap-y-10">
						<div class="flex flex-col gap-y-3">
							<h3>
								<span class="block text-lg font-semibold text-gray-800 dark:text-neutral-300"
									>Ваш аккаунт</span
								>
							</h3>
							<div class="flex flex-col gap-y-5">
								<div class="flex items-end gap-x-5">
									<!-- Floating Input -->
									<div class="relative w-full">
										<input
											bind:value={email}
											readonly
											type="email"
											id="hs-floating-input-email"
											class="peer block w-full rounded-lg border-gray-200 p-4 text-sm placeholder:text-transparent autofill:pb-2 autofill:pt-6 focus:border-blue-500 focus:pb-2 focus:pt-6 focus:ring-blue-500 disabled:pointer-events-none disabled:opacity-50
		dark:border-neutral-700
		dark:bg-neutral-900
		dark:text-white
		dark:focus:ring-neutral-600
		[&:not(:placeholder-shown)]:pb-2
		[&:not(:placeholder-shown)]:pt-6"
											placeholder="you@email.com"
										/>
										<label
											for="hs-floating-input-email"
											class="pointer-events-none absolute start-0 top-0 h-full origin-[0_0] truncate border border-transparent p-4 text-sm transition duration-100 ease-in-out peer-focus:-translate-y-1.5 peer-focus:translate-x-0.5 peer-focus:scale-90
		  peer-focus:text-gray-500
		  peer-disabled:pointer-events-none
		  peer-disabled:opacity-50
		  peer-[:not(:placeholder-shown)]:-translate-y-1.5 peer-[:not(:placeholder-shown)]:translate-x-0.5
		  peer-[:not(:placeholder-shown)]:scale-90
		  peer-[:not(:placeholder-shown)]:text-gray-500
		  dark:text-neutral-500
		  dark:text-white dark:peer-focus:text-neutral-500 dark:peer-[:not(:placeholder-shown)]:text-neutral-500"
											>Email</label
										>
									</div>
									<!-- End Floating Input -->
									<button
										type="button"
										class="inline-flex items-center gap-x-2 rounded-lg border border-transparent bg-[#ab1dff] px-6 py-3 font-medium text-white hover:bg-[#8500d3] focus:bg-[#8500d3] focus:outline-none disabled:pointer-events-none disabled:opacity-50"
										aria-haspopup="dialog"
										aria-expanded="false"
										aria-controls="hs-modal-signin"
										data-hs-overlay="#hs-modal-signin"
									>
										Изменить
									</button>
								</div>
							</div>
						</div>

						<div class="flex flex-col gap-y-3">
							<h3>
								<span class="block text-lg font-semibold text-gray-800 dark:text-neutral-300"
									>Сменить пароль</span
								>
							</h3>
							<div class="flex items-center gap-x-5">
								<!-- Form Group -->
								<div class="flex items-end gap-x-5">
									<div class="w-full">
										<h3 class="mb-2 block text-sm dark:text-white">Введите ваш текущий пароль</h3>
										<div class="relative">
											<input
												id="hs-toggle-password"
												type="password"
												class="block w-full rounded-lg border-gray-200 py-4 pe-10 ps-4 text-sm focus:border-blue-500 focus:ring-blue-500 disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
												placeholder="Текущий пароль"
											/>
											<button
												type="button"
												class="absolute inset-y-0 end-0 z-20 flex cursor-pointer items-center rounded-e-md px-3 text-gray-400 focus:text-blue-600 focus:outline-none dark:text-neutral-600 dark:focus:text-[#ab1dff]"
											>
												<svg
													class="size-3.5 shrink-0"
													width="24"
													height="24"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													stroke-width="2"
													stroke-linecap="round"
													stroke-linejoin="round"
												>
													<path
														class="hs-password-active:hidden"
														d="M9.88 9.88a3 3 0 1 0 4.24 4.24"
													>
													</path>
													<path
														class="hs-password-active:hidden"
														d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"
													>
													</path>
													<path
														class="hs-password-active:hidden"
														d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"
													>
													</path>
													<line class="hs-password-active:hidden" x1="2" x2="22" y1="2" y2="22">
													</line>
													<path
														class="hs-password-active:block hidden"
														d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"
													></path>
													<circle class="hs-password-active:block hidden" cx="12" cy="12" r="3">
													</circle>
												</svg>
											</button>
										</div>
									</div>
								</div>
								<!-- End Form Group -->

								<!-- Form Group -->
								<div class="flex items-end gap-x-5">
									<div class="w-full">
										<h3 class="mb-2 block text-sm dark:text-white">Введите новый пароль</h3>
										<div class="relative">
											<input
												id="hs-toggle-password"
												type="password"
												class="block w-full rounded-lg border-gray-200 py-4 pe-10 ps-4 text-sm focus:border-blue-500 focus:ring-blue-500 disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
												placeholder="Новый пароль"
											/>
											<button
												type="button"
												class="absolute inset-y-0 end-0 z-20 flex cursor-pointer items-center rounded-e-md px-3 text-gray-400 focus:text-blue-600 focus:outline-none dark:text-neutral-600 dark:focus:text-[#ab1dff]"
											>
												<svg
													class="size-3.5 shrink-0"
													width="24"
													height="24"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													stroke-width="2"
													stroke-linecap="round"
													stroke-linejoin="round"
												>
													<path
														class="hs-password-active:hidden"
														d="M9.88 9.88a3 3 0 1 0 4.24 4.24"
													>
													</path>
													<path
														class="hs-password-active:hidden"
														d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"
													>
													</path>
													<path
														class="hs-password-active:hidden"
														d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"
													>
													</path>
													<line class="hs-password-active:hidden" x1="2" x2="22" y1="2" y2="22">
													</line>
													<path
														class="hs-password-active:block hidden"
														d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"
													></path>
													<circle class="hs-password-active:block hidden" cx="12" cy="12" r="3">
													</circle>
												</svg>
											</button>
										</div>
									</div>
								</div>
								<!-- End Form Group -->
							</div>
						</div>

						<div class="flex flex-col gap-y-3">
							<h3>
								<span class="block text-lg font-semibold text-gray-800 dark:text-neutral-300"
									>Персональные данные</span
								>
								<span class="block text-gray-600 dark:text-neutral-400"
									>Мы используем эти данные только для сбора статистики внутри Hornterest. Например,
									чтобы делать публикации о том, какие теги и жанры больше всего востребованы у
									девушек из Бразилии. Указыванные персональные данные никогда не будут переданы
									третьим лицам. Эти данные указывать необязательно.</span
								>
							</h3>
							<div class="flex flex-col gap-y-5">
								<!-- Floating Input -->
								<div class="relative">
									<input
										on:input={setModified}
										bind:value={birth}
										type="date"
										id="hs-floating-input-birth"
										class="peer block w-full rounded-lg border-gray-200 p-4 text-sm placeholder:text-transparent autofill:pb-2 autofill:pt-6 focus:border-blue-500 focus:pb-2 focus:pt-6 focus:ring-blue-500 disabled:pointer-events-none disabled:opacity-50
		dark:border-neutral-700
		dark:bg-neutral-900
		dark:text-white
		dark:focus:ring-neutral-600
		[&:not(:placeholder-shown)]:pb-2
		[&:not(:placeholder-shown)]:pt-6"
										placeholder="date"
									/>
									<label
										for="hs-floating-input-birth"
										class="pointer-events-none absolute start-0 top-0 h-full origin-[0_0] truncate border border-transparent p-4 text-sm transition duration-100 ease-in-out peer-focus:-translate-y-1.5 peer-focus:translate-x-0.5 peer-focus:scale-90
		  peer-focus:text-gray-500
		  peer-disabled:pointer-events-none
		  peer-disabled:opacity-50
		  peer-[:not(:placeholder-shown)]:-translate-y-1.5 peer-[:not(:placeholder-shown)]:translate-x-0.5
		  peer-[:not(:placeholder-shown)]:scale-90
		  peer-[:not(:placeholder-shown)]:text-gray-500
		  dark:text-neutral-500
		  dark:text-white dark:peer-focus:text-neutral-500 dark:peer-[:not(:placeholder-shown)]:text-neutral-500"
										>Дата рождения</label
									>
								</div>
								<!-- End Floating Input -->

								<div class="flex flex-col">
									<h3 class="text-sm text-gray-500 dark:text-neutral-400">Пол</h3>
									<div class="flex gap-x-6">
										<div class="flex">
											<input
												type="radio"
												name="hs-radio-group"
												class="mt-0.5 shrink-0 rounded-full border-gray-200 text-[#ab1dff] focus:ring-[#ab1dff] disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:checked:border-[#ab1dff] dark:checked:bg-[#ab1dff] dark:focus:ring-offset-gray-800"
												id="male-radio"
												value="male"
											/>
											<label
												for="male-radio"
												class="ms-2 text-sm text-gray-500 dark:text-neutral-400">Мужской</label
											>
										</div>

										<div class="flex">
											<input
												type="radio"
												name="hs-radio-group"
												class="mt-0.5 shrink-0 rounded-full border-gray-200 text-[#ab1dff] focus:ring-[#ab1dff] disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:checked:border-[#ab1dff] dark:checked:bg-[#ab1dff] dark:focus:ring-offset-gray-800"
												id="female-radio"
												value="female"
											/>
											<label
												for="female-radio"
												class="ms-2 text-sm text-gray-500 dark:text-neutral-400">Женский</label
											>
										</div>

										<div class="flex">
											<input
												type="radio"
												name="hs-radio-group"
												class="mt-0.5 shrink-0 rounded-full border-gray-200 text-[#ab1dff] focus:ring-[#ab1dff] disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:checked:border-[#ab1dff] dark:checked:bg-[#ab1dff] dark:focus:ring-offset-gray-800"
												id="other-radio"
												value="other"
											/>
											<label
												for="other-radio"
												class="ms-2 text-sm text-gray-500 dark:text-neutral-400">Другой</label
											>
										</div>

										<div class="flex">
											<input
												type="radio"
												name="hs-radio-group"
												class="mt-0.5 shrink-0 rounded-full border-gray-200 text-[#ab1dff] focus:ring-[#ab1dff] disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:checked:border-[#ab1dff] dark:checked:bg-[#ab1dff] dark:focus:ring-offset-gray-800"
												id="no-radio"
												checked
											/>
											<label for="no-radio" class="ms-2 text-sm text-gray-500 dark:text-neutral-400"
												>Не указывать</label
											>
										</div>
									</div>
								</div>

								<div class="relative sm:col-span-3">
									<h3 class="text-sm text-gray-500 dark:text-neutral-400">Страна</h3>
									<div class="mt-1">
										<button
											type="button"
											class="relative block w-full rounded-md border border-gray-300 bg-white py-4 pl-3 pr-10 text-left shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
											aria-haspopup="listbox"
											aria-expanded={isSelectOpen}
											aria-labelledby="country-select-label"
											on:click={toggleSelect}
											bind:this={selectButton}
										>
											<span class="block truncate" id="country-select-label"
												>{displayedCountryName || 'Выберите страну'}</span
											>
											<span
												class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2"
											>
												<svg
													class="h-5 w-5 text-gray-400"
													xmlns="http://www.w3.org/2000/svg"
													viewBox="0 0 20 20"
													fill="currentColor"
													aria-hidden="true"
												>
													<path
														fill-rule="evenodd"
														d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
														clip-rule="evenodd"
													/>
												</svg>
											</span>
										</button>

										{#if isSelectOpen}
											<ul
												class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white pb-1 text-base shadow-lg focus:outline-none sm:text-sm dark:border dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
												tabindex="-1"
												role="listbox"
												aria-labelledby="country-select-label"
												aria-activedescendant="country-option-0"
												bind:this={selectList}
											>
												<li class="sticky top-0 bg-white px-3 py-2 dark:bg-neutral-800">
													<input
														type="text"
														class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
														placeholder="Поиск"
														bind:value={searchTerm}
														on:input={filterCountries}
														bind:this={searchInput}
													/>
												</li>
												{#each filteredCountries as country}
													<li
														class="cursor-default select-none py-2 pl-3 pr-9 text-gray-900 hover:bg-indigo-600 hover:text-white dark:text-gray-300 dark:hover:bg-indigo-500"
														id="country-option-{country.id}"
														role="option"
														on:click={() => selectCountry(country.alpha2, country.name)}
													>
														<span class="truncate font-semibold">{country.name}</span>
														{#if selectedCountry === country.alpha2}
															<span
																class="absolute inset-y-0 right-0 flex items-center pr-4 text-indigo-600 dark:text-indigo-400"
															>
																<svg
																	class="h-5 w-5"
																	xmlns="http://www.w3.org/2000/svg"
																	viewBox="0 0 20 20"
																	fill="currentColor"
																	aria-hidden="true"
																>
																	<path
																		fill-rule="evenodd"
																		d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L9 11.586l7.293-7.293a1 1 0 011.414 0z"
																		clip-rule="evenodd"
																	/>
																</svg>
															</span>
														{/if}
													</li>
												{/each}
												{#if filteredCountries.length === 0}
													<li
														class="cursor-default select-none py-2 pl-3 pr-9 text-gray-500 dark:text-gray-400"
													>
														Ничего не найдено
													</li>
												{/if}
											</ul>
										{/if}
									</div>
								</div>
							</div>
						</div>

						<div class="flex flex-col gap-y-3">
							<label>
								<span class="block text-lg font-semibold text-gray-800 dark:text-neutral-300"
									>Деактивация и удаление</span
								>
							</label>
							<div class="flex flex-col gap-y-5">
								<div class="flex items-center gap-x-5">
									<button
										type="button"
										class="inline-flex items-center gap-x-2 rounded-lg border border-neutral-700 border-transparent bg-neutral-900 px-4 py-2 text-sm font-medium text-neutral-400 hover:bg-neutral-800 focus:bg-neutral-800 focus:outline-none disabled:pointer-events-none disabled:opacity-50"
										aria-haspopup="dialog"
										aria-expanded="false"
										aria-controls="hs-modal-signin"
										data-hs-overlay="#hs-modal-signin"
									>
										Отключить аккаунт
									</button>
									<div>
										<label class="text-sm text-gray-500 dark:text-neutral-400">
											<p class="text-white">Отключить аккаунт</p>
											<p>Временно скройте профиль и свои публикации</p>
										</label>
									</div>
								</div>

								<div class="flex items-center gap-x-5">
									<button
										type="button"
										class="inline-flex items-center gap-x-2 rounded-lg border border-neutral-700 border-transparent bg-neutral-900 px-4 py-2 text-sm font-medium text-neutral-400 hover:bg-neutral-800 focus:bg-neutral-800 focus:outline-none disabled:pointer-events-none disabled:opacity-50"
										aria-haspopup="dialog"
										aria-expanded="false"
										aria-controls="hs-modal-signin"
										data-hs-overlay="#hs-modal-signin"
									>
										Удалить аккаунт
									</button>
									<div>
										<label class="text-sm text-gray-500 dark:text-neutral-400">
											<p class="text-white">Удаление данных и аккаунта</p>
											<p>Безвозвратное удаление данных и всего, что связано с аккаунтом</p>
										</label>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
				<div
					id="vertical-tab-with-border-3"
					class="hidden"
					role="tabpanel"
					aria-labelledby="vertical-tab-with-border-item-3"
				>
					<div class="flex flex-col">
						<h2 class="text-3xl font-semibold">Разрешения для сообщества</h2>
						<p class="text-neutral-400">
							Выберите, как другие могут взаимодействовать с вами в Hornterest, а также другие
							разрешения на основе наших последних функций
						</p>
					</div>

					<div class="mt-10 flex flex-col gap-y-10">
						<div class="flex flex-col gap-y-3">
							<label>
								<span class="block text-lg font-semibold text-gray-800 dark:text-neutral-300"
									>@упоминания</span
								>
								<span class="block text-gray-600 dark:text-neutral-400"
									>Выберите пользователей, которые могут вас упоминать</span
								>
							</label>
							<div class="grid space-y-3">
								<div class="relative flex items-start">
									<div class="mt-1 flex h-5 items-center">
										<input
											id="hs-radio-pornterest"
											name="hs-radio-with-description"
											type="radio"
											class="rounded-full border-gray-200 text-[#ab1dff] focus:ring-[#ab1dff] dark:border-neutral-700 dark:bg-neutral-800 dark:checked:border-[#ab1dff] dark:checked:bg-[#ab1dff] dark:focus:ring-offset-gray-800"
											aria-describedby="hs-radio-pornterest-description"
											checked
										/>
									</div>
									<label for="hs-radio-pornterest" class="ms-3">
										<span class="block font-semibold text-gray-800 dark:text-neutral-300"
											>Все пользователи Hornterest</span
										>
									</label>
								</div>

								<div class="relative flex items-start">
									<div class="mt-1 flex h-5 items-center">
										<input
											id="hs-radio-sub"
											name="hs-radio-with-description"
											type="radio"
											class="rounded-full border-gray-200 text-[#ab1dff] focus:ring-[#ab1dff] dark:border-neutral-700 dark:bg-neutral-800 dark:checked:border-[#ab1dff] dark:checked:bg-[#ab1dff] dark:focus:ring-offset-gray-800"
											aria-describedby="hs-radio-sub-description"
										/>
									</div>
									<label for="hs-radio-sub" class="ms-3">
										<span class="block font-semibold text-gray-800 dark:text-neutral-300"
											>Только пользователи, на которых вы подписались</span
										>
									</label>
								</div>

								<div class="relative flex items-start">
									<div class="mt-1 flex h-5 items-center">
										<input
											id="hs-radio-off"
											name="hs-radio-with-description"
											type="radio"
											class="rounded-full border-gray-200 text-[#ab1dff] focus:ring-[#ab1dff] dark:border-neutral-700 dark:bg-neutral-800 dark:checked:border-[#ab1dff] dark:checked:bg-[#ab1dff] dark:focus:ring-offset-gray-800"
											aria-describedby="hs-radio-off-description"
											checked
										/>
									</div>
									<label for="hs-radio-off" class="ms-3">
										<span class="block font-semibold text-gray-800 dark:text-neutral-300"
											>Отключить</span
										>
										<span
											id="hs-radio-off-description"
											class="block text-sm text-gray-600 dark:text-neutral-500"
											>Никто не может вас упоминать</span
										>
									</label>
								</div>
							</div>
						</div>

						<div class="flex items-start">
							<input
								on:input={setModified}
								bind:checked={comment}
								type="checkbox"
								id="comment"
								class="relative h-7 w-[3.25rem] cursor-pointer rounded-full border-transparent bg-gray-100 p-px text-transparent transition-colors duration-200 ease-in-out before:inline-block before:size-6 before:translate-x-0 before:transform before:rounded-full before:bg-white before:shadow before:ring-0 before:transition before:duration-200
						  
							before:ease-in-out checked:border-[#ab1dff] checked:bg-[#ab1dff] checked:bg-none checked:text-[#ab1dff] checked:before:translate-x-full checked:before:bg-blue-200 focus:ring-blue-600 focus:checked:border-[#ab1dff] disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:before:bg-neutral-400 dark:checked:before:bg-blue-200 dark:focus:ring-offset-gray-600"
							/>
							<label for="comment" class="ms-3 text-sm text-gray-500 dark:text-neutral-400">
								<p class="text-white">Разрешить комментирование ваших публикаций</p>
								<p>Комментарии будут включены по умолчанию для ваших новых публикаций</p>
							</label>
						</div>

						<div class="flex items-start">
							<input
								on:input={setModified}
								bind:checked={autoplay}
								type="checkbox"
								id="autoplay"
								class="relative h-7 w-[3.25rem] cursor-pointer rounded-full border-transparent bg-gray-100 p-px text-transparent transition-colors duration-200 ease-in-out before:inline-block before:size-6 before:translate-x-0 before:transform before:rounded-full before:bg-white before:shadow before:ring-0 before:transition before:duration-200
						  
							before:ease-in-out checked:border-[#ab1dff] checked:bg-[#ab1dff] checked:bg-none checked:text-[#ab1dff] checked:before:translate-x-full checked:before:bg-blue-200 focus:ring-blue-600 focus:checked:border-[#ab1dff] disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:before:bg-neutral-400 dark:checked:before:bg-blue-200 dark:focus:ring-offset-gray-600"
							/>
							<label for="autoplay" class="ms-3 text-sm text-gray-500 dark:text-neutral-400">
								<p class="text-white">Автовоспроизведение видео</p>
							</label>
						</div>
					</div>
				</div>
				<div
					id="vertical-tab-with-border-4"
					class="hidden"
					role="tabpanel"
					aria-labelledby="vertical-tab-with-border-item-4"
				>
					<div class="flex flex-col">
						<h2 class="text-3xl font-semibold">Безопасность</h2>
						<p class="text-neutral-400">
							Используйте дополнительные меры безопасности, например, включите двухфакторную
							аутентификацию.
						</p>
					</div>

					<div class="mt-10 flex flex-col gap-y-10">
						<div class="flex flex-col gap-y-3">
							<h3>
								<span class="block text-lg font-semibold text-gray-800 dark:text-neutral-300"
									>Двухфакторная аутентификация</span
								>
								<span class="block text-gray-600 dark:text-neutral-400"
									>Это обеспечивает дополнительную защиту вашего аккаунта. Помимо пароля вам нужно
									будет вводить секретный код, который будет отправляться на ваш Email при каждом
									входе.</span
								>
							</h3>
							<div class="flex items-center">
								<input
									on:input={setModified}
									bind:checked={twoFa}
									type="checkbox"
									id="twoFa"
									class="relative h-7 w-[3.25rem] cursor-pointer rounded-full border-transparent bg-gray-100 p-px text-transparent transition-colors duration-200 ease-in-out before:inline-block before:size-6 before:translate-x-0 before:transform before:rounded-full before:bg-white before:shadow before:ring-0 before:transition before:duration-200
							  
								before:ease-in-out checked:border-[#ab1dff] checked:bg-none checked:text-[#ab1dff] checked:before:translate-x-full checked:before:bg-blue-200 focus:ring-blue-600 focus:checked:border-[#ab1dff] disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:before:bg-neutral-400 dark:checked:before:bg-blue-200 dark:focus:ring-offset-gray-600"
								/>
								<label for="twoFa" class="ms-3 text-sm text-gray-500 dark:text-neutral-400">
									<p class="text-white">Запрашивать код при входе</p>
								</label>
							</div>
						</div>

						<div class="flex flex-col gap-y-3">
							<label>
								<span class="block text-lg font-semibold text-gray-800 dark:text-neutral-300"
									>Параметры входа</span
								>
								<span class="block text-gray-600 dark:text-neutral-400"
									>Используйте свой аккаунт в соцсетях, чтобы войти в Hornterest.</span
								>
							</label>
							<div class="flex items-center">
								<input
									type="checkbox"
									id="hs-basic-with-description-unchecked"
									class="relative h-7 w-[3.25rem] cursor-pointer rounded-full border-transparent bg-gray-100 p-px text-transparent transition-colors duration-200 ease-in-out before:inline-block before:size-6 before:translate-x-0 before:transform before:rounded-full before:bg-white before:shadow before:ring-0 before:transition before:duration-200
							  
								before:ease-in-out checked:border-[#ab1dff] checked:bg-none checked:text-[#ab1dff] checked:before:translate-x-full checked:before:bg-blue-200 focus:ring-blue-600 focus:checked:border-[#ab1dff] disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:before:bg-neutral-400 dark:checked:before:bg-blue-200 dark:focus:ring-offset-gray-600"
								/>
								<label
									for="hs-basic-with-description-unchecked"
									class="ms-3 text-sm text-gray-500 dark:text-neutral-400"
								>
									<p class="text-white">Использовать для входа аккаунт Google</p>
								</label>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>
