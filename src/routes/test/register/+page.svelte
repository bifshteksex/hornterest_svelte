<script>
	let nickname = '';
	let email = '';
	let password = '';
	let confirmPassword = '';
	let registrationError = '';
	let registrationSuccess = false;

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
			console.log('Регистрация успешна:', data);
			registrationSuccess = true;
			registrationError = '';
			nickname = '';
			email = '';
			password = '';
			confirmPassword = '';
		} else {
			const errorData = await response.json();
			registrationError = errorData.message || 'Ошибка регистрации';
			registrationSuccess = false;
			console.error('Ошибка регистрации:', errorData);
		}
	}
</script>

<h1>Регистрация</h1>

{#if registrationSuccess}
	<p style="color: green;">Регистрация прошла успешно!</p>
{:else if registrationError}
	<p style="color: red;">{registrationError}</p>
{/if}

<form on:submit|preventDefault={registerUser}>
	<div>
		<label for="nickname">Имя пользователя:</label>
		<input type="text" id="nickname" bind:value={nickname} required />
	</div>
	<div>
		<label for="email">Email:</label>
		<input type="email" id="email" bind:value={email} required />
	</div>
	<div>
		<label for="password">Пароль:</label>
		<input type="password" id="password" bind:value={password} required />
	</div>
	<div>
		<label for="confirmPassword">Повторите пароль:</label>
		<input type="password" id="confirmPassword" bind:value={confirmPassword} required />
	</div>
	<button type="submit">Зарегистрироваться</button>
</form>
