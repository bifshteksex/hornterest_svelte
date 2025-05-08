<script>
	let identifier = ''; // Может быть никнеймом или email
	let password = '';
	let loginError = '';
	let loginSuccess = false;
	let authToken = '';

	async function loginUser() {
		const response = await fetch('http://localhost:8080/api/login', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ identifier, password })
		});

		if (response.ok) {
			const data = await response.json();
			console.log('Вход успешен:', data);
			loginSuccess = true;
			loginError = '';
			authToken = data.token;
			// Сохраняем токен (например, в localStorage) для последующих запросов
			localStorage.setItem('authToken', authToken);
			identifier = '';
			password = '';
		} else {
			const errorData = await response.json();
			loginError = errorData.message || 'Ошибка входа';
			loginSuccess = false;
			authToken = '';
			console.error('Ошибка входа:', errorData);
		}
	}
</script>

<h1>Вход</h1>

{#if loginSuccess}
	<p style="color: green;">Вход выполнен успешно!</p>
	{#if authToken}
		<p>Ваш токен: <code>{authToken}</code></p>
	{/if}
{:else if loginError}
	<p style="color: red;">{loginError}</p>
{/if}

<form on:submit|preventDefault={loginUser}>
	<div>
		<label for="identifier">Имя пользователя или Email:</label>
		<input type="text" id="identifier" bind:value={identifier} required />
	</div>
	<div>
		<label for="password">Пароль:</label>
		<input type="password" id="password" bind:value={password} required />
	</div>
	<button type="submit">Войти</button>
</form>
