<script lang="ts">
	import { onMount } from 'svelte';
	import Dropzone, { type DropzoneFile } from 'dropzone';
	import 'dropzone/dist/dropzone.css'; // Импортируем базовые стили Dropzone

	// Расширяем интерфейс DropzoneFile, добавляя наши свойства
	interface ExtendedDropzoneFile extends DropzoneFile {
		width?: number;
		height?: number;
		duration?: number;
	}

	let dropzoneInput: HTMLDivElement | null = null;
	let dropzoneElement: HTMLDivElement | null = null;
	let previewElement: HTMLDivElement | null = null;
	let myDropzone: Dropzone | null = null;
	let title: string = '';
	let description: string = '';
	let link: string = '';
	let tags: string = '';
	let allowComments: boolean = true;
	let isAiGenerated: boolean = false;
	let uploadedFile: ExtendedDropzoneFile | null = null;
	let isFileUploaded: boolean = false;
	let uploadProgress: number = 0;

	onMount(() => {
		if (dropzoneElement && previewElement) {
			myDropzone = new Dropzone(dropzoneElement, {
				url: '/api/upload',
				autoProcessQueue: false,
				maxFiles: 1,
				acceptedFiles: 'image/*, video/*, .gif',
				previewsContainer: previewElement,
				previewTemplate: `
          <div class="dz-preview dz-file-preview rounded-md border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-sm relative">
            <div class="dz-details p-2">
              <div class="dz-filename text-white"><span data-dz-name></span></div>
              <div class="dz-size text-white" data-dz-size></div>
              <img data-dz-thumbnail class="rounded-t-md w-full h-auto" alt data-dz-name>
              <video data-dz-thumbnail class="rounded-t-md w-full h-auto" controls data-dz-name></video>
            </div>
            <div class="dz-progress rounded-b-md bg-gray-100 dark:bg-neutral-900 h-2 relative">
              <span class="dz-upload rounded-b-md bg-blue-500 h-2 absolute top-0 left-0" style="width:0%;" data-dz-uploadprogress></span>
            </div>
            <a href="javascript:undefined;" class="dz-remove absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-neutral-200" data-dz-remove>
				<svg class="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M3 6h18"></path>
				<path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
				<path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
				<line x1="10" x2="10" y1="11" y2="17"></line>
				<line x1="14" x2="14" y1="11" y2="17"></line>
				</svg>
            </a>
            <div class="dz-error-message absolute bottom-0 left-0 w-full bg-red-500 text-white text-sm p-1 rounded-b-md" data-dz-errormessage></div>
          </div>
        `,
				init: function () {
					this.on('addedfile', (file: ExtendedDropzoneFile) => {
						uploadedFile = file;
						isFileUploaded = false;
						uploadProgress = 0;
						// Скрываем основную область загрузки после добавления файла
						if (this.files.length === 1 && dropzoneInput) {
							dropzoneInput.style.display = 'none';
						}

						file.width = undefined;
						file.height = undefined;
						file.duration = undefined;

						const preview = file.previewElement;
						if (preview) {
							const imageElement = preview.querySelector<HTMLImageElement>(
								'[data-dz-thumbnail][alt]'
							);
							const videoElement = preview.querySelector<HTMLVideoElement>(
								'[data-dz-thumbnail][controls]'
							);

							if (file.type.startsWith('image/')) {
								if (imageElement) {
									const reader = new FileReader();
									reader.onload = (e) => {
										imageElement.src = e.target?.result as string;
									};
									reader.readAsDataURL(file);
									// Показываем элемент изображения и скрываем видео
									imageElement.style.display = 'block';
									if (videoElement) videoElement.style.display = 'none';
								}
							} else if (file.type.startsWith('video/')) {
								if (videoElement) {
									const videoURL = URL.createObjectURL(file);
									videoElement.src = videoURL; // Показываем элемент видео и скрываем изображение
									videoElement.style.display = 'block';
									if (imageElement) imageElement.style.display = 'none';

									const tempVideo = document.createElement('video');
									tempVideo.style.display = 'none';
									tempVideo.src = videoURL;

									tempVideo.addEventListener('loadedmetadata', () => {
										file.width = tempVideo.videoWidth;
										file.height = tempVideo.videoHeight;
										file.duration = tempVideo.duration; // После получения метаданных можно удалить временный элемент
										tempVideo.remove();
										console.log('Метаданные видео:', file.width, file.height, file.duration);
									});
								}
							}
						}
					});

					this.on('removedfile', (file: ExtendedDropzoneFile) => {
						uploadedFile = null;
						isFileUploaded = false;
						uploadProgress = 0;
						// Показываем основную область загрузки после удаления файла
						if (dropzoneInput) {
							dropzoneInput.style.display = 'flex';
						}
					});

					this.on('uploadprogress', (file: ExtendedDropzoneFile, progress: number) => {
						uploadProgress = progress;
						// Обновляем progress bar в превью
						const progressElement = file.previewElement?.querySelector(
							'.dz-upload'
						) as HTMLSpanElement;
						if (progressElement) {
							progressElement.style.width = `${progress}%`;
							progressElement.textContent = `${progress}%`;
						}
					});

					this.on('success', (file: ExtendedDropzoneFile, response: any) => {
						isFileUploaded = true;
						console.log('Файл успешно загружен:', response);
						// Здесь можно обновить интерфейс после успешной загрузки (если используется autoProcessQueue: true)
					});

					this.on('error', (file: ExtendedDropzoneFile, errorMessage: string) => {
						console.error('Ошибка загрузки файла:', errorMessage);
						// Здесь можно обработать ошибку загрузки
					});
				}
			});
		}
	});

	async function handleSubmit() {
		if (!myDropzone || !uploadedFile) {
			alert('Пожалуйста, выберите файл для загрузки.');
			return;
		}

		const formData = new FormData();
		formData.append('title', title);
		formData.append('description', description);
		formData.append('link', link);
		formData.append('tags', tags);
		formData.append('allowComments', allowComments.toString());
		formData.append('isAiGenerated', isAiGenerated.toString());
		formData.append('media', uploadedFile);

		if (uploadedFile.width) {
			formData.append('width', uploadedFile.width.toString());
		}
		if (uploadedFile.height) {
			formData.append('height', uploadedFile.height.toString());
		}
		if (uploadedFile.duration) {
			formData.append('duration', uploadedFile.duration.toString());
		}

		const token = localStorage.getItem('authToken');
		if (!token) {
			return;
		}

		try {
			const response = await fetch('http://localhost:8080/api/pin/upload', {
				method: 'POST',
				body: formData,
				headers: {
					Authorization: `Bearer ${token}`
				}
			});

			if (response.ok) {
				const result = await response.json();
				console.log('Пин успешно опубликован:', result);
				alert('Пин успешно опубликован!');
				title = '';
				description = '';
				link = '';
				tags = '';
				allowComments = true;
				isAiGenerated = false;
				myDropzone?.removeAllFiles();
				uploadedFile = null;
				isFileUploaded = false;
				uploadProgress = 0;

				if (dropzoneElement) {
					dropzoneElement.style.display = 'flex';
				}
			} else {
				const error = await response.json();
				console.error('Ошибка публикации пина:', error);
				alert(`Ошибка публикации пина: ${error.message || 'Неизвестная ошибка'}`);
			}
		} catch (error) {
			console.error('Произошла ошибка при отправке данных:', error);
			alert('Произошла ошибка при отправке данных.');
		}
	}
</script>

<svelte:head>
	<title>Hornterest - создать новый пин</title>
	<meta name="description" content="Создание нового пина на Hornterest" />
</svelte:head>

<section>
	<div class="mx-auto px-4 py-10 sm:px-6 lg:px-6 lg:py-8">
		<div class="mx-auto flex max-w-5xl flex-col gap-y-5">
			<div class="flex flex-col gap-10 md:flex-row">
				<div class="md:w-[60%]">
					<div
						bind:this={dropzoneInput}
						class="relative flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white p-12 dark:border-neutral-600 dark:bg-neutral-800"
					>
						<div class="text-center">
							<span
								class="inline-flex size-16 items-center justify-center rounded-full bg-gray-100 text-gray-800 dark:bg-neutral-700 dark:text-neutral-200"
							>
								<svg
									class="size-6 shrink-0"
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
							</span>

							<div
								class="mt-4 hidden flex-wrap justify-center text-sm leading-6 text-gray-600 md:flex"
							>
								<span class="pe-1 font-medium text-gray-800 dark:text-neutral-200">
									Перетащите файл в эту область или
								</span>
								<span
									class="rounded-lg bg-white font-semibold text-blue-600 decoration-2 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 hover:text-blue-700 hover:underline dark:bg-neutral-800 dark:text-blue-500 dark:hover:text-blue-600"
									>выберите</span
								>
							</div>

							<p class="mt-1 text-xs text-gray-400 dark:text-neutral-400">
								Загрузите изображение, видео или GIF
							</p>
						</div>
						<div bind:this={dropzoneElement} class="absolute top-0 h-full w-full"></div>
					</div>

					<div class="mt-4 space-y-2" bind:this={previewElement}></div>
				</div>

				<div class="flex w-full flex-col gap-y-5">
					<div class="relative">
						<input
							type="text"
							id="hs-floating-input-email"
							class="peer block w-full rounded-lg border-gray-200 p-4 text-sm placeholder:text-transparent autofill:pb-2 autofill:pt-6 focus:border-blue-500 focus:pb-2 focus:pt-6 focus:ring-blue-500 disabled:pointer-events-none disabled:opacity-50
					  dark:border-neutral-700
					  dark:bg-neutral-900
					  dark:text-neutral-400
					  dark:focus:ring-neutral-600
					  [&:not(:placeholder-shown)]:pb-2
					  [&:not(:placeholder-shown)]:pt-6"
							placeholder="Название"
							bind:value={title}
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
							>Название</label
						>
					</div>
					<div class="relative">
						<textarea
							id="hs-floating-textarea"
							class="peer block w-full rounded-lg border-gray-200 p-4 text-sm placeholder:text-transparent autofill:pb-2 autofill:pt-6 focus:border-blue-500 focus:pb-2 focus:pt-6 focus:ring-blue-500 disabled:pointer-events-none disabled:opacity-50
					  dark:border-neutral-700
					  dark:bg-neutral-900
					  dark:text-neutral-400
					  dark:focus:ring-neutral-600
					  [&:not(:placeholder-shown)]:pb-2
					  [&:not(:placeholder-shown)]:pt-6"
							placeholder="Описание"
							data-hs-textarea-auto-height=""
							bind:value={description}
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
					<div class="relative">
						<input
							type="text"
							id="hs-floating-input-link"
							class="peer block w-full rounded-lg border-gray-200 p-4 text-sm placeholder:text-transparent autofill:pb-2 autofill:pt-6 focus:border-blue-500 focus:pb-2 focus:pt-6 focus:ring-blue-500 disabled:pointer-events-none disabled:opacity-50
					  dark:border-neutral-700
					  dark:bg-neutral-900
					  dark:text-neutral-400
dark:focus:ring-neutral-600
                    [&:not(:placeholder-shown)]:pb-2
                    [&:not(:placeholder-shown)]:pt-6"
							placeholder="Ссылка на оригинал"
							bind:value={link}
						/>
						<label
							for="hs-floating-input-link"
							class="pointer-events-none absolute start-0 top-0 h-full origin-[0_0] truncate border border-transparent p-4 text-sm transition duration-100 ease-in-out peer-focus:-translate-y-1.5 peer-focus:translate-x-0.5 peer-focus:scale-90
                    peer-focus:text-gray-500
                    peer-disabled:pointer-events-none
                    peer-disabled:opacity-50
                    peer-[:not(:placeholder-shown)]:-translate-y-1.5 peer-[:not(:placeholder-shown)]:translate-x-0.5
                    peer-[:not(:placeholder-shown)]:scale-90
                    peer-[:not(:placeholder-shown)]:text-gray-500
                    dark:text-neutral-500
                    dark:text-white dark:peer-focus:text-neutral-500 dark:peer-[:not(:placeholder-shown)]:text-neutral-500"
							>Ссылка на оригинал</label
						>
					</div>
					<div class="relative">
						<input
							type="text"
							id="hs-floating-input-tags"
							class="peer block w-full rounded-lg border-gray-200 p-4 text-sm placeholder:text-transparent autofill:pb-2 autofill:pt-6 focus:border-blue-500 focus:pb-2 focus:pt-6 focus:ring-blue-500 disabled:pointer-events-none disabled:opacity-50
                    dark:border-neutral-700
                    dark:bg-neutral-900
                    dark:text-neutral-400
                    dark:focus:ring-neutral-600
                    [&:not(:placeholder-shown)]:pb-2
                    [&:not(:placeholder-shown)]:pt-6"
							placeholder="Теги"
							bind:value={tags}
						/>
						<label
							for="hs-floating-input-tags"
							class="pointer-events-none absolute start-0 top-0 h-full origin-[0_0] truncate border border-transparent p-4 text-sm transition duration-100 ease-in-out peer-focus:-translate-y-1.5 peer-focus:translate-x-0.5 peer-focus:scale-90
                    peer-focus:text-gray-500
                    peer-disabled:pointer-events-none
                    peer-disabled:opacity-50
                    peer-[:not(:placeholder-shown)]:-translate-y-1.5 peer-[:not(:placeholder-shown)]:translate-x-0.5
                    peer-[:not(:placeholder-shown)]:scale-90
                    peer-[:not(:placeholder-shown)]:text-gray-500
                    dark:text-neutral-500
                    dark:text-white dark:peer-focus:text-neutral-500 dark:peer-[:not(:placeholder-shown)]:text-neutral-500"
							>Теги</label
						>
					</div>
					<div class="flex items-center">
						<input
							type="checkbox"
							id="allow-comments"
							class="relative h-7 w-[3.25rem] cursor-pointer rounded-full border-transparent p-px text-transparent transition-colors duration-200 ease-in-out before:inline-block before:size-6 before:translate-x-0 before:transform before:rounded-full before:bg-white before:shadow
                    before:ring-0 before:transition before:duration-200 before:ease-in-out checked:border-[#ab1dff] checked:bg-none checked:text-[#ab1dff] checked:before:translate-x-full checked:before:bg-blue-200 focus:ring-blue-600 focus:checked:border-[#ab1dff] disabled:pointer-events-none disabled:opacity-50 dark:before:bg-neutral-400 dark:checked:before:bg-blue-200"
							bind:checked={allowComments}
						/>
						<label for="allow-comments" class="ms-3 text-sm text-gray-500 dark:text-neutral-200"
							>Разрешить комментировать</label
						>
					</div>

					<div class="flex items-center">
						<input
							type="checkbox"
							id="is-ai-generated"
							class="relative h-7 w-[3.25rem] cursor-pointer rounded-full border-transparent p-px text-transparent transition-colors duration-200 ease-in-out before:inline-block before:size-6 before:translate-x-0 before:transform before:rounded-full before:bg-white before:shadow
                    before:ring-0 before:transition before:duration-200 before:ease-in-out checked:border-[#ab1dff] checked:bg-none checked:text-[#ab1dff] checked:before:translate-x-full checked:before:bg-blue-200 focus:ring-blue-600 focus:checked:border-[#ab1dff] disabled:pointer-events-none disabled:opacity-50 dark:before:bg-neutral-400 dark:checked:before:bg-blue-200"
							bind:checked={isAiGenerated}
						/>
						<label for="is-ai-generated" class="ms-3 text-sm text-gray-500 dark:text-neutral-200"
							>Сгенерировано AI</label
						>
					</div>
				</div>
			</div>

			<button
				type="submit"
				class="inline-flex items-center justify-center gap-x-2 rounded-lg border border-transparent bg-[#ab1dff] px-4 py-3 font-medium text-white hover:bg-[#8500d3] focus:bg-[#8500d3] focus:outline-none disabled:pointer-events-none disabled:opacity-50"
				on:click={handleSubmit}
			>
				Опубликовать
			</button>
		</div>
	</div>
</section>

<style>
	.dz-preview {
		margin-top: 1rem;
	}

	.dz-details {
		font-size: 0.875rem;
	}

	.dz-filename {
		font-weight: 500;
	}

	.dz-remove {
		cursor: pointer;
	}

	.dz-error-message {
		font-size: 0.75rem;
	}
</style>
