<script lang="ts">
	import { setUserData } from '../stores/user';

	let identifier = ''; // Может быть никнеймом или email
	let loginError = '';
	let loginSuccess = false;
	let authToken = '';
	let passwordLogin = '';

	let nickname = '';
	let email = '';
	let password = '';
	let confirmPassword = '';
	let registrationError = '';
	let registrationSuccess = false;

	async function loginUser() {
		const response = await fetch('http://localhost:8080/api/login', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ identifier, passwordLogin })
		});

		if (response.ok) {
			const data = await response.json();
			console.log('Вход успешен:', data);
			loginSuccess = true;
			loginError = '';
			authToken = data.token;
			// Сохраняем токен, ID и никнейм в localStorage

			localStorage.setItem('authToken', data.token);
			setUserData(data.id, data.nickname);

			identifier = '';
			passwordLogin = '';

			const modalSignin = document.querySelector('#hs-modal-signin');
			window.HSOverlay.close(modalSignin);
		} else {
			const errorData = await response.json();
			loginError = errorData.message || 'Ошибка входа';
			loginSuccess = false;
			authToken = '';
			console.error('Ошибка входа:', errorData);
		}
	}

	async function registerUser() {
		if (password !== confirmPassword) {
			registrationError = 'Пароли не совпадают';
			return;
		}

		const response = await fetch('http://localhost:8080/api/register', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ nickname, email, password })
		});

		if (response.ok) {
			const data = await response.json();

			authToken = data.token;

			localStorage.setItem('authToken', data.token);
			setUserData(data.id, data.nickname);

			console.log('Регистрация успешна:', data);
			registrationSuccess = true;
			registrationError = '';
			nickname = '';
			email = '';
			password = '';
			confirmPassword = '';

			const modalSignup = document.querySelector('#hs-modal-signup');
			const modalOptional = document.querySelector('#hs-modal-optional');

			window.HSOverlay.close(modalSignup);
			window.HSOverlay.open(modalOptional);
		} else {
			const errorData = await response.json();
			registrationError = errorData.message || 'Ошибка регистрации';
			registrationSuccess = false;
			console.error('Ошибка регистрации:', errorData);
		}
	}

	async function testNext() {
		const modalOptional = document.querySelector('#hs-modal-optional');
		const modalPreferences = document.querySelector('#hs-modal-preferences');
		window.HSOverlay.close(modalOptional);
		window.HSOverlay.open(modalPreferences);
	}
</script>

<div
	id="hs-modal-signin"
	class="hs-overlay fixed start-0 top-0 z-[80] hidden size-full overflow-y-auto overflow-x-hidden"
	role="dialog"
	tabindex="-1"
	aria-labelledby="hs-modal-signin-label"
>
	<div
		class="hs-overlay-animation-target hs-overlay-open:scale-100 hs-overlay-open:opacity-100 m-3 flex min-h-[calc(100%-56px)] scale-95 items-center opacity-0 transition-all duration-200 ease-in-out sm:mx-auto sm:w-full sm:max-w-lg"
	>
		<div
			class="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
		>
			<div class="relative p-4 sm:p-7">
				<button
					type="button"
					class="absolute right-1.5 top-1.5 inline-flex size-8 items-center justify-center gap-x-2 rounded-full border border-transparent bg-gray-100 text-gray-800 hover:bg-gray-200 focus:bg-gray-200 focus:outline-none disabled:pointer-events-none disabled:opacity-50 dark:bg-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-600 dark:focus:bg-neutral-600"
					aria-label="Close"
					data-hs-overlay="#hs-modal-signin"
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
						<path d="M18 6 6 18"></path>
						<path d="m6 6 12 12"></path>
					</svg>
				</button>

				<div class="text-center">
					<h3
						id="hs-modal-signin-label"
						class="block text-2xl font-bold text-gray-800 dark:text-neutral-200"
					>
						Рады вас снова видеть на Hornterest
					</h3>
					<p class="mt-2 text-sm text-gray-600 dark:text-neutral-400">
						Ещё нет аккаунта?
						<button
							class="font-medium text-[#ab1dff] decoration-2 hover:underline focus:underline focus:outline-none"
							aria-haspopup="dialog"
							aria-expanded="false"
							aria-controls="hs-modal-signup"
							data-hs-overlay="#hs-modal-signup"
						>
							Зарегистрируйтесь здесь
						</button>
					</p>
				</div>

				<div class="mt-5">
					<a
						class="inline-flex w-full items-center justify-center gap-x-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-700 dark:bg-transparent dark:text-neutral-300 dark:hover:bg-neutral-800 dark:focus:bg-neutral-800"
						href="#"
					>
						<svg class="h-auto w-4" width="46" height="47" viewBox="0 0 46 47" fill="none">
							<path
								d="M46 24.0287C46 22.09 45.8533 20.68 45.5013 19.2112H23.4694V27.9356H36.4069C36.1429 30.1094 34.7347 33.37 31.5957 35.5731L31.5663 35.8669L38.5191 41.2719L38.9885 41.3306C43.4477 37.2181 46 31.1669 46 24.0287Z"
								fill="#4285F4"
							/>
							<path
								d="M23.4694 47C29.8061 47 35.1161 44.9144 39.0179 41.3012L31.625 35.5437C29.6301 36.9244 26.9898 37.8937 23.4987 37.8937C17.2793 37.8937 12.0281 33.7812 10.1505 28.1412L9.88649 28.1706L2.61097 33.7812L2.52296 34.0456C6.36608 41.7125 14.287 47 23.4694 47Z"
								fill="#34A853"
							/>
							<path
								d="M10.1212 28.1413C9.62245 26.6725 9.32908 25.1156 9.32908 23.5C9.32908 21.8844 9.62245 20.3275 10.0918 18.8588V18.5356L2.75765 12.8369L2.52296 12.9544C0.909439 16.1269 0 19.7106 0 23.5C0 27.2894 0.909439 30.8731 2.49362 34.0456L10.1212 28.1413Z"
								fill="#FBBC05"
							/>
							<path
								d="M23.4694 9.07688C27.8699 9.07688 30.8622 10.9863 32.5344 12.5725L39.1645 6.11C35.0867 2.32063 29.8061 0 23.4694 0C14.287 0 6.36607 5.2875 2.49362 12.9544L10.0918 18.8588C11.9987 13.1894 17.25 9.07688 23.4694 9.07688Z"
								fill="#EB4335"
							/>
						</svg>
						Вход через Google
					</a>

					<div
						class="flex items-center py-3 text-xs uppercase text-gray-400 before:me-6 before:flex-1 before:border-t before:border-gray-200 after:ms-6 after:flex-1 after:border-t after:border-gray-200 dark:text-neutral-500 dark:before:border-neutral-800 dark:after:border-neutral-800"
					>
						Или
					</div>

					<!-- Form -->
					<form on:submit|preventDefault={loginUser}>
						<div class="grid gap-y-4">
							<!-- Form Group -->
							<div>
								<label for="identifier" class="mb-2 block text-sm dark:text-white"
									>Имя пользователя или Email</label
								>
								<div class="relative">
									<input
										id="identifier"
										bind:value={identifier}
										required
										type="text"
										name="identifier"
										class="block w-full rounded-lg border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:ring-blue-500 disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
										aria-describedby="email-error"
									/>
									<div class="pointer-events-none absolute inset-y-0 end-0 hidden pe-3">
										<svg
											class="size-5 text-red-500"
											width="16"
											height="16"
											fill="currentColor"
											viewBox="0 0 16 16"
											aria-hidden="true"
										>
											<path
												d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"
											/>
										</svg>
									</div>
								</div>
								<p class="mt-2 hidden text-xs text-red-600" id="identifier-error">
									Please include a valid email address so we can get back to you
								</p>
							</div>
							<!-- End Form Group -->

							<!-- Form Group -->
							<div>
								<label for="passwordLogin" class="mb-2 block text-sm dark:text-white">Пароль</label>
								<div class="relative">
									<input
										bind:value={passwordLogin}
										type="password"
										id="passwordLogin"
										name="passwordLogin"
										class="block w-full rounded-lg border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:ring-blue-500 disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
										required
										aria-describedby="passwordLogin-error"
									/>
									<div class="pointer-events-none absolute inset-y-0 end-0 hidden pe-3">
										<svg
											class="size-5 text-red-500"
											width="16"
											height="16"
											fill="currentColor"
											viewBox="0 0 16 16"
											aria-hidden="true"
										>
											<path
												d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"
											/>
										</svg>
									</div>
								</div>
								<p class="mt-2 hidden text-xs text-red-600" id="passwordLogin-error">
									8+ characters required
								</p>
							</div>
							<!-- End Form Group -->

							<button
								type="submit"
								class="inline-flex w-full items-center justify-center gap-x-2 rounded-lg border border-transparent bg-[#ab1dff] px-4 py-3 text-sm font-medium text-white hover:bg-[#8500d3] focus:bg-[#8500d3] focus:outline-none disabled:pointer-events-none disabled:opacity-50"
								>Вход</button
							>
						</div>
					</form>
					<!-- End Form -->
				</div>
			</div>
		</div>
	</div>
</div>

<div
	id="hs-modal-signup"
	class="hs-overlay fixed start-0 top-0 z-[80] hidden size-full overflow-y-auto overflow-x-hidden"
	role="dialog"
	tabindex="-1"
	aria-labelledby="hs-modal-signup-label"
>
	<div
		class="hs-overlay-animation-target hs-overlay-open:scale-100 hs-overlay-open:opacity-100 m-3 flex min-h-[calc(100%-56px)] scale-95 items-center opacity-0 transition-all duration-200 ease-in-out sm:mx-auto sm:w-full sm:max-w-lg"
	>
		<div
			class="w-full rounded-xl border border-gray-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
		>
			<div class="relative p-4 sm:p-7">
				<button
					type="button"
					class="absolute right-1.5 top-1.5 inline-flex size-8 items-center justify-center gap-x-2 rounded-full border border-transparent bg-gray-100 text-gray-800 hover:bg-gray-200 focus:bg-gray-200 focus:outline-none disabled:pointer-events-none disabled:opacity-50 dark:bg-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-600 dark:focus:bg-neutral-600"
					aria-label="Close"
					data-hs-overlay="#hs-modal-signup"
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
						<path d="M18 6 6 18"></path>
						<path d="m6 6 12 12"></path>
					</svg>
				</button>

				<div class="text-center">
					<h3
						id="hs-modal-signup-label"
						class="block text-2xl font-bold text-gray-800 dark:text-neutral-200"
					>
						Добро пожаловать на Hornterest
					</h3>
					<p class="mt-2 text-sm text-gray-600 dark:text-neutral-400">
						Уже есть аккаунт?
						<button
							class="font-medium text-[#ab1dff] decoration-2 hover:underline focus:underline focus:outline-none"
							aria-haspopup="dialog"
							aria-expanded="false"
							aria-controls="hs-modal-signin"
							data-hs-overlay="#hs-modal-signin"
						>
							Войдите здесь
						</button>
					</p>
				</div>

				<div class="mt-5">
					<a
						class="inline-flex w-full items-center justify-center gap-x-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-700 dark:bg-transparent dark:text-neutral-300 dark:hover:bg-neutral-800 dark:focus:bg-neutral-800"
						href="#"
					>
						<svg class="h-auto w-4" width="46" height="47" viewBox="0 0 46 47" fill="none">
							<path
								d="M46 24.0287C46 22.09 45.8533 20.68 45.5013 19.2112H23.4694V27.9356H36.4069C36.1429 30.1094 34.7347 33.37 31.5957 35.5731L31.5663 35.8669L38.5191 41.2719L38.9885 41.3306C43.4477 37.2181 46 31.1669 46 24.0287Z"
								fill="#4285F4"
							/>
							<path
								d="M23.4694 47C29.8061 47 35.1161 44.9144 39.0179 41.3012L31.625 35.5437C29.6301 36.9244 26.9898 37.8937 23.4987 37.8937C17.2793 37.8937 12.0281 33.7812 10.1505 28.1412L9.88649 28.1706L2.61097 33.7812L2.52296 34.0456C6.36608 41.7125 14.287 47 23.4694 47Z"
								fill="#34A853"
							/>
							<path
								d="M10.1212 28.1413C9.62245 26.6725 9.32908 25.1156 9.32908 23.5C9.32908 21.8844 9.62245 20.3275 10.0918 18.8588V18.5356L2.75765 12.8369L2.52296 12.9544C0.909439 16.1269 0 19.7106 0 23.5C0 27.2894 0.909439 30.8731 2.49362 34.0456L10.1212 28.1413Z"
								fill="#FBBC05"
							/>
							<path
								d="M23.4694 9.07688C27.8699 9.07688 30.8622 10.9863 32.5344 12.5725L39.1645 6.11C35.0867 2.32063 29.8061 0 23.4694 0C14.287 0 6.36607 5.2875 2.49362 12.9544L10.0918 18.8588C11.9987 13.1894 17.25 9.07688 23.4694 9.07688Z"
								fill="#EB4335"
							/>
						</svg>
						Регистрация через Google
					</a>

					<div
						class="flex items-center py-3 text-xs uppercase text-gray-400 before:me-6 before:flex-1 before:border-t before:border-gray-200 after:ms-6 after:flex-1 after:border-t after:border-gray-200 dark:text-neutral-500 dark:before:border-neutral-800 dark:after:border-neutral-800"
					>
						Или
					</div>

					<!-- Form -->
					<form on:submit|preventDefault={registerUser}>
						<div class="grid gap-y-4">
							<!-- Form Group -->
							<div>
								<label for="nickname" class="mb-2 block text-sm dark:text-white"
									>Имя пользователя</label
								>
								<div class="relative">
									<input
										bind:value={nickname}
										type="text"
										id="nickname"
										name="nickname"
										class="block w-full rounded-lg border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:ring-blue-500 disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
										required
										aria-describedby="nickname-error"
									/>
									<div class="pointer-events-none absolute inset-y-0 end-0 hidden pe-3">
										<svg
											class="size-5 text-red-500"
											width="16"
											height="16"
											fill="currentColor"
											viewBox="0 0 16 16"
											aria-hidden="true"
										>
											<path
												d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"
											/>
										</svg>
									</div>
								</div>
								<p class="mt-2 hidden text-xs text-red-600" id="nickname-error">
									Please include a valid email address so we can get back to you
								</p>
							</div>
							<!-- End Form Group -->

							<!-- Form Group -->
							<div>
								<label for="email" class="mb-2 block text-sm dark:text-white">Email</label>
								<div class="relative">
									<input
										bind:value={email}
										type="email"
										id="email"
										name="email"
										class="block w-full rounded-lg border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:ring-blue-500 disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
										required
										aria-describedby="email-error"
									/>
									<div class="pointer-events-none absolute inset-y-0 end-0 hidden pe-3">
										<svg
											class="size-5 text-red-500"
											width="16"
											height="16"
											fill="currentColor"
											viewBox="0 0 16 16"
											aria-hidden="true"
										>
											<path
												d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"
											/>
										</svg>
									</div>
								</div>
								<p class="mt-2 hidden text-xs text-red-600" id="email-error">
									Please include a valid email address so we can get back to you
								</p>
							</div>
							<!-- End Form Group -->

							<!-- Form Group -->
							<div>
								<label for="password" class="mb-2 block text-sm dark:text-white">Пароль</label>
								<div class="relative">
									<input
										bind:value={password}
										type="password"
										id="password"
										name="password"
										class="block w-full rounded-lg border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:ring-blue-500 disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
										required
										aria-describedby="password-error"
									/>
									<div class="pointer-events-none absolute inset-y-0 end-0 hidden pe-3">
										<svg
											class="size-5 text-red-500"
											width="16"
											height="16"
											fill="currentColor"
											viewBox="0 0 16 16"
											aria-hidden="true"
										>
											<path
												d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"
											/>
										</svg>
									</div>
								</div>
								<p class="mt-2 hidden text-xs text-red-600" id="password-error">
									8+ characters required
								</p>
							</div>
							<!-- End Form Group -->

							<!-- Form Group -->
							<div>
								<label for="confirmPassword" class="mb-2 block text-sm dark:text-white"
									>Повторите пароль</label
								>
								<div class="relative">
									<input
										bind:value={confirmPassword}
										type="password"
										id="confirmPassword"
										name="confirmPassword"
										class="block w-full rounded-lg border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:ring-blue-500 disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
										required
										aria-describedby="confirmPassword-error"
									/>
									<div class="pointer-events-none absolute inset-y-0 end-0 hidden pe-3">
										<svg
											class="size-5 text-red-500"
											width="16"
											height="16"
											fill="currentColor"
											viewBox="0 0 16 16"
											aria-hidden="true"
										>
											<path
												d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"
											/>
										</svg>
									</div>
								</div>
								<p class="mt-2 hidden text-xs text-red-600" id="confirmPassword-error">
									Password does not match the password
								</p>
							</div>
							<!-- End Form Group -->

							<!-- Checkbox -->
							<div class="flex items-center">
								<div class="flex">
									<input
										required
										id="remember-me"
										name="remember-me"
										type="checkbox"
										class="mt-0.5 shrink-0 rounded border-gray-200 text-[#ab1dff] focus:ring-[#ab1dff] dark:border-neutral-800 dark:bg-neutral-800 dark:checked:border-[#ab1dff] dark:checked:bg-[#ab1dff] dark:focus:ring-offset-gray-800"
									/>
								</div>
								<div class="ms-3">
									<label for="remember-me" class="text-sm dark:text-white"
										>Я принимаю <a
											target="_blank"
											class="font-medium text-[#ab1dff] decoration-2 hover:underline focus:underline focus:outline-none"
											href="tos.html">Условия использования</a
										></label
									>
								</div>
							</div>
							<!-- End Checkbox -->

							<button
								type="submit"
								class="inline-flex w-full items-center justify-center gap-x-2 rounded-lg border border-transparent bg-[#ab1dff] px-4 py-3 text-sm font-medium text-white hover:bg-[#8500d3] focus:bg-[#8500d3] focus:outline-none disabled:pointer-events-none disabled:opacity-50"
								>Регистрация</button
							>
						</div>
					</form>
					<!-- End Form -->
				</div>
			</div>
		</div>
	</div>
</div>

<div
	id="hs-modal-optional"
	class="hs-overlay fixed start-0 top-0 z-[80] hidden size-full overflow-y-auto overflow-x-hidden"
	role="dialog"
	tabindex="-1"
	aria-labelledby="hs-modal-optional-label"
>
	<div
		class="hs-overlay-animation-target hs-overlay-open:scale-100 hs-overlay-open:opacity-100 m-3 flex min-h-[calc(100%-56px)] scale-95 items-center opacity-0 transition-all duration-200 ease-in-out sm:mx-auto sm:w-full sm:max-w-lg"
	>
		<div
			class="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
		>
			<div class="relative p-4 sm:p-7">
				<div class="text-center">
					<h3
						id="hs-modal-optional-label"
						class="block text-2xl font-bold text-gray-800 dark:text-neutral-200"
					>
						Необязательные поля
					</h3>
				</div>

				<div class="mt-5">
					<!-- Form -->
					<form on:submit|preventDefault={testNext}>
						<div class="grid gap-y-4">
							<div class="flex items-center gap-x-5">
								<!-- Form Group -->
								<div>
									<label for="email" class="mb-2 block text-sm dark:text-white">Имя</label>
									<div class="relative">
										<input
											type="text"
											id="email"
											name="email"
											class="block w-full rounded-lg border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:ring-blue-500 disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
											aria-describedby="email-error"
										/>
										<div class="pointer-events-none absolute inset-y-0 end-0 hidden pe-3">
											<svg
												class="size-5 text-red-500"
												width="16"
												height="16"
												fill="currentColor"
												viewBox="0 0 16 16"
												aria-hidden="true"
											>
												<path
													d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"
												/>
											</svg>
										</div>
									</div>
									<p class="mt-2 hidden text-xs text-red-600" id="email-error">
										Please include a valid email address so we can get back to you
									</p>
								</div>
								<!-- End Form Group -->

								<!-- Form Group -->
								<div>
									<label for="email" class="mb-2 block text-sm dark:text-white">Фамилия</label>
									<div class="relative">
										<input
											type="text"
											id="email"
											name="email"
											class="block w-full rounded-lg border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:ring-blue-500 disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
											aria-describedby="email-error"
										/>
										<div class="pointer-events-none absolute inset-y-0 end-0 hidden pe-3">
											<svg
												class="size-5 text-red-500"
												width="16"
												height="16"
												fill="currentColor"
												viewBox="0 0 16 16"
												aria-hidden="true"
											>
												<path
													d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"
												/>
											</svg>
										</div>
									</div>
									<p class="mt-2 hidden text-xs text-red-600" id="email-error">
										Please include a valid email address so we can get back to you
									</p>
								</div>
								<!-- End Form Group -->
							</div>

							<div class="flex items-center gap-x-5">
								<!-- Form Group -->
								<div>
									<label for="email" class="mb-2 block text-sm dark:text-white">Пол</label>
									<div class="relative">
										<input
											type="text"
											id="email"
											name="email"
											class="block w-full rounded-lg border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:ring-blue-500 disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
											aria-describedby="email-error"
										/>
										<div class="pointer-events-none absolute inset-y-0 end-0 hidden pe-3">
											<svg
												class="size-5 text-red-500"
												width="16"
												height="16"
												fill="currentColor"
												viewBox="0 0 16 16"
												aria-hidden="true"
											>
												<path
													d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"
												/>
											</svg>
										</div>
									</div>
									<p class="mt-2 hidden text-xs text-red-600" id="email-error">
										Please include a valid email address so we can get back to you
									</p>
								</div>
								<!-- End Form Group -->

								<!-- Form Group -->
								<div>
									<label for="birth" class="mb-2 block text-sm dark:text-white">Дата рождения</label
									>
									<div class="relative">
										<input
											type="date"
											id="birth"
											name="birth"
											class="block w-full rounded-lg border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:ring-blue-500 disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
											aria-describedby="birth-error"
										/>
										<div class="pointer-events-none absolute inset-y-0 end-0 hidden pe-3">
											<svg
												class="size-5 text-red-500"
												width="16"
												height="16"
												fill="currentColor"
												viewBox="0 0 16 16"
												aria-hidden="true"
											>
												<path
													d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"
												/>
											</svg>
										</div>
									</div>
									<p class="mt-2 hidden text-xs text-red-600" id="birth-error">
										Please include a valid email address so we can get back to you
									</p>
								</div>
								<!-- End Form Group -->
							</div>

							<div class="flex items-center justify-between">
								<button
									type="button"
									aria-label="Close"
									data-hs-overlay="#hs-modal-optional"
									class="inline-flex w-full items-center justify-center gap-x-2 rounded-lg border border-transparent px-4 py-3 text-sm font-medium text-white focus:outline-none disabled:pointer-events-none disabled:opacity-50"
									>Пропустить</button
								>

								<button
									type="submit"
									class="inline-flex w-full items-center justify-center gap-x-2 rounded-lg border border-transparent bg-[#ab1dff] px-4 py-3 text-sm font-medium text-white hover:bg-[#8500d3] focus:bg-[#8500d3] focus:outline-none disabled:pointer-events-none disabled:opacity-50"
									>Сохранить</button
								>
							</div>
						</div>
					</form>
					<!-- End Form -->
				</div>
			</div>
		</div>
	</div>
</div>

<div
	id="hs-modal-preferences"
	class="hs-overlay fixed start-0 top-0 z-[80] hidden size-full overflow-y-auto overflow-x-hidden"
	role="dialog"
	tabindex="-1"
	aria-labelledby="hs-modal-preferences-label"
>
	<div
		class="hs-overlay-animation-target hs-overlay-open:scale-100 hs-overlay-open:opacity-100 m-3 flex min-h-[calc(100%-56px)] scale-95 items-center opacity-0 transition-all duration-200 ease-in-out sm:mx-auto sm:w-full sm:max-w-lg"
	>
		<div
			class="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
		>
			<div class="relative p-4 sm:p-7">
				<div class="text-center">
					<h3
						id="hs-modal-preferences-label"
						class="block text-2xl font-bold text-gray-800 dark:text-neutral-200"
					>
						Предпочтения (выберите минимум 1)
					</h3>
				</div>

				<div class="mt-5">
					<!-- Form -->
					<form>
						<div class="grid gap-y-4">
							<div class="flex items-center gap-x-5">
								<div class="grid w-full space-y-2">
									<label
										for="hentai"
										class="flex w-full rounded-lg border border-gray-200 bg-white p-3 text-sm focus:border-blue-500 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400"
									>
										<input
											type="checkbox"
											class="mt-0.5 shrink-0 rounded-sm border-gray-200 text-[#ab1dff] checked:border-[#ab1dff] checked:bg-[#ab1dff] focus:ring-[#ab1dff] disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:focus:ring-offset-gray-800"
											id="hentai"
										/>
										<span class="ms-3 text-sm text-gray-500 dark:text-neutral-400">Хентай</span>
									</label>

									<label
										for="girl"
										class="flex w-full rounded-lg border border-gray-200 bg-white p-3 text-sm focus:border-blue-500 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400"
									>
										<input
											type="checkbox"
											class="mt-0.5 shrink-0 rounded-sm border-gray-200 text-[#ab1dff] checked:border-[#ab1dff] checked:bg-[#ab1dff] focus:ring-[#ab1dff] disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:focus:ring-offset-gray-800"
											id="girl"
										/>
										<span class="ms-3 text-sm text-gray-500 dark:text-neutral-400">Женщины</span>
									</label>

									<label
										for="man"
										class="flex w-full rounded-lg border border-gray-200 bg-white p-3 text-sm focus:border-blue-500 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400"
									>
										<input
											type="checkbox"
											class="mt-0.5 shrink-0 rounded-sm border-gray-200 text-[#ab1dff] checked:border-[#ab1dff] checked:bg-[#ab1dff] focus:ring-[#ab1dff] disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:focus:ring-offset-gray-800"
											id="man"
										/>
										<span class="ms-3 text-sm text-gray-500 dark:text-neutral-400">Мужчины</span>
									</label>

									<label
										for="gay"
										class="flex w-full rounded-lg border border-gray-200 bg-white p-3 text-sm focus:border-blue-500 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400"
									>
										<input
											type="checkbox"
											class="mt-0.5 shrink-0 rounded-sm border-gray-200 text-[#ab1dff] checked:border-[#ab1dff] checked:bg-[#ab1dff] focus:ring-[#ab1dff] disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:focus:ring-offset-gray-800"
											id="gay"
										/>
										<span class="ms-3 text-sm text-gray-500 dark:text-neutral-400">Геи</span>
									</label>

									<label
										for="trans"
										class="flex w-full rounded-lg border border-gray-200 bg-white p-3 text-sm focus:border-blue-500 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400"
									>
										<input
											type="checkbox"
											class="mt-0.5 shrink-0 rounded-sm border-gray-200 text-[#ab1dff] checked:border-[#ab1dff] checked:bg-[#ab1dff] focus:ring-[#ab1dff] disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:focus:ring-offset-gray-800"
											id="trans"
										/>
										<span class="ms-3 text-sm text-gray-500 dark:text-neutral-400">Трансы</span>
									</label>

									<label
										for="lesb"
										class="flex w-full rounded-lg border border-gray-200 bg-white p-3 text-sm focus:border-blue-500 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400"
									>
										<input
											type="checkbox"
											class="mt-0.5 shrink-0 rounded-sm border-gray-200 text-[#ab1dff] checked:border-[#ab1dff] checked:bg-[#ab1dff] focus:ring-[#ab1dff] disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:focus:ring-offset-gray-800"
											id="lesb"
										/>
										<span class="ms-3 text-sm text-gray-500 dark:text-neutral-400">Лесбиянки</span>
									</label>
								</div>
							</div>

							<button
								type="submit"
								class="inline-flex w-full items-center justify-center gap-x-2 rounded-lg border border-transparent bg-[#ab1dff] px-4 py-3 text-sm font-medium text-white hover:bg-[#8500d3] focus:bg-[#8500d3] focus:outline-none disabled:pointer-events-none disabled:opacity-50"
								>Сохранить</button
							>
						</div>
					</form>
					<!-- End Form -->
				</div>
			</div>
		</div>
	</div>
</div>
