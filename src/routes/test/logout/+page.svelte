<script>
	function logout() {
		// Удаляем токен из localStorage
		localStorage.removeItem('authToken');
		console.log('Выход из профиля выполнен');
		// Здесь можно добавить логику перенаправления на страницу входа
		window.location.href = '/login'; // Пример перенаправления
	}
</script>

<h1>Выход из профиля</h1>

<button on:click={logout}>Выйти</button>

<p>
	После нажатия кнопки токен авторизации будет удален из локального хранилища, и вы будете
	перенаправлены на страницу входа.
</p>
