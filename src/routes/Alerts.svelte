<script lang="ts">
	let alertDiv: HTMLDivElement | null = null;

	function dismissAlert() {
		if (alertDiv) {
			alertDiv.classList.remove('translate-y-0', 'opacity-100');
			alertDiv.classList.add('translate-y-full', 'opacity-0');
			setTimeout(() => {
				if (alertDiv && alertDiv.parentNode) {
					alertDiv.parentNode.removeChild(alertDiv);
				}
			}, 1000);
		}
	}
</script>

<div
	bind:this={alertDiv}
	id="dismiss-alert"
	class="fixed bottom-10 left-[50%] z-[100] translate-x-[-50%] translate-y-full rounded-lg border border-teal-200 bg-teal-50 p-4 text-teal-800 opacity-0 transition duration-300 dark:border-purple-900 dark:bg-purple-800/70 dark:text-white"
	role="alert"
	tabindex="-1"
	aria-labelledby="hs-dismiss-button-label"
>
	<div class="flex items-center">
		<div class="ms-2">
			<h3 id="hs-dismiss-button-label" class="font-semibold">Такой страницы не существует!</h3>
		</div>
		<div class="ms-auto ps-3">
			<div class="-mx-1.5 -my-1.5">
				<button
					type="button"
					class="focus:outline-hidden inline-flex rounded-lg bg-teal-50 p-1.5 text-teal-500 hover:bg-teal-100 focus:bg-teal-100 dark:bg-transparent dark:text-white dark:hover:bg-purple-800/50 dark:focus:bg-purple-800/50"
					on:click={dismissAlert}
				>
					<span class="sr-only">Dismiss</span>
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
			</div>
		</div>
	</div>
</div>
