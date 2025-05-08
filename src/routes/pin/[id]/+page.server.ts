import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, fetch }) => {
	const { id } = params;

	try {
		const response = await fetch(`http://localhost:8080/api/pins/${id}`, {
			headers: {
				'Content-Type': 'application/json'
			}
		});

		if (response.ok) {
			const pin = await response.json();
			return { pin };
		} else if (response.status === 404) {
			const status = 302;
			const location = '/';
			return { status, location };
		} else {
			// Обрабатываем другие ошибки от API
			console.error('Ошибка API:', response.status, await response.text());
			throw error(response.status, 'Ошибка получения пина');
		}
	} catch (err) {
		console.error('Ошибка при запросе к API:', err);
		// Обрабатываем ошибки на уровне fetch
		throw error(500, 'Ошибка сервера');
	}
};
