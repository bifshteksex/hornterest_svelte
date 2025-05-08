<script>
	let protectedMessage = '';
	let protectedError = '';

	async function fetchProtected() {
		const token = localStorage.getItem('authToken');
		if (!token) {
			protectedError = 'Токен авторизации отсутствует. Пожалуйста, войдите.';
			protectedMessage = '';
			return;
		}

		const response = await fetch('http://localhost:8080/api/protected', {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${token}`
			}
		});

		if (response.ok) {
			protectedMessage = await response.text();
			protectedError = '';
		} else {
			const errorData = await response.text();
			protectedError = errorData || 'Ошибка при запросе к защищенному ресурсу';
			protectedMessage = '';
			console.error('Ошибка защищенного запроса:', errorData);
			if (response.status === 401) {
				localStorage.removeItem('authToken');
			}
		}
	}
</script>

<h1>Защищенная страница</h1>

<button on:click={fetchProtected}>Получить защищенное сообщение</button>

{#if protectedMessage}
	<p style="color: green;">Сообщение от сервера: {protectedMessage}</p>
{:else if protectedError}
	<p style="color: red;">{protectedError}</p>
{/if}
