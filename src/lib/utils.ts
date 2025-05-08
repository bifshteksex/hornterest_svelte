export function formatDuration(durationInSeconds: number | null): string {
	if (durationInSeconds === null) {
		return '';
	}
	const minutes = Math.floor(durationInSeconds / 60);
	const seconds = Math.floor(durationInSeconds % 60)
		.toString()
		.padStart(2, '0');
	return `${minutes}:${seconds}`;
}

export function formatDate(date: Date): string {
	const now = new Date();
	const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
	let interval = Math.floor(seconds / 31536000);

	if (interval >= 1) {
		return `${interval} ${interval === 1 ? 'год' : 'года'}`;
	}
	interval = Math.floor(seconds / 2592000);
	if (interval >= 1) {
		return `${interval} ${interval === 1 ? 'мес.' : 'мес.'}`;
	}
	interval = Math.floor(seconds / 604800);
	if (interval >= 1) {
		return `${interval} ${interval === 1 ? 'нед.' : 'нед.'}`;
	}
	interval = Math.floor(seconds / 60);
	if (interval >= 1) {
		return `${interval} ${interval === 1 ? 'мин.' : 'мин.'}`;
	}
	return 'меньше минуты';
}

export async function checkIfUserSaved(
	pinId: number | undefined,
	token: string | null
): Promise<boolean> {
	if (!pinId || !token) {
		return false;
	}
	try {
		const response = await fetch(`http://localhost:8080/api/pins/${pinId}/saved`, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json'
			}
		});
		if (response.ok) {
			const data = await response.json();
			return data.saved;
		} else {
			console.error('Не удалось проверить, сохранил ли пользователь пин');
			return false;
		}
	} catch (error) {
		console.error('Ошибка при проверке сохранения пользователя:', error);
		return false;
	}
}
