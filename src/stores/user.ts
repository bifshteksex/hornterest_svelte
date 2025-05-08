import { writable } from 'svelte/store';
import { browser } from '$app/environment';

interface UserData {
	id: number | null;
	nickname: string | null;
}

const initialUser: UserData = {
	id: browser && localStorage.getItem('userId') ? parseInt(localStorage.getItem('userId')!) : null,
	nickname: (browser && localStorage.getItem('nickname')) || null
};

export const user = writable(initialUser);

// Функция для обновления данных пользователя при логине
export function setUserData(id: number, nickname: string) {
	if (browser) {
		user.set({ id, nickname });
		localStorage.setItem('userId', String(id));
		localStorage.setItem('nickname', nickname);
	}
}

// Функция для очистки данных пользователя при логауте
export function clearUserData() {
	if (browser) {
		user.set({ id: null, nickname: null });
		localStorage.removeItem('userId');
		localStorage.removeItem('nickname');
	}
}

export async function fetchUserData() {
	if (browser) {
		const token = localStorage.getItem('authToken');
		if (token) {
			const response = await fetch('http://localhost:8080/api/me', {
				headers: {
					Authorization: `Bearer ${token}`
				}
			});

			if (response.ok) {
				const data = await response.json();
				setUserData(data.id, data.nickname);
			} else {
				clearUserData(); // Токен недействителен или произошла ошибка
			}
		} else {
			clearUserData();
		}
	}
}
