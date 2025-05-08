import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, fetch }) => {
	const { username } = params;

	try {
		const profileResponse = await fetch(`http://localhost:8080/api/users/${username}`, {
			headers: {
				'Content-Type': 'application/json'
			}
		});

		if (profileResponse.ok) {
			const profile = await profileResponse.json();

			// Запрос на получение пинов пользователя (первая страница)
			const pinsResponse = await fetch(
				`http://localhost:8080/api/users/${username}/pins?page=1&limit=20`,
				{
					headers: {
						'Content-Type': 'application/json'
					}
				}
			);

			if (pinsResponse.ok) {
				const pins = await pinsResponse.json();
				return { profile, pins };
			} else {
				console.error(
					'Ошибка API при получении пинов пользователя:',
					pinsResponse.status,
					await pinsResponse.text()
				);
				// Не выбрасываем ошибку, чтобы профиль все равно отобразился, но можно изменить логику
				return { profile, pins: [] };
			}
		} else if (profileResponse.status === 404) {
			const status = 302;
			const location = '/';
			return { status, location };
		} else {
			console.error(
				'Ошибка API при получении профиля:',
				profileResponse.status,
				await profileResponse.text()
			);
			throw error(profileResponse.status, 'Ошибка получения профиля');
		}
	} catch (err) {
		console.error('Ошибка при запросе к API:', err);
		throw error(500, 'Ошибка сервера');
	}
};
