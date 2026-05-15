<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { authService } from '$lib/services/auth.service';
	import Button from '$lib/components/common/Button.svelte';
	import Input from '$lib/components/common/Input.svelte';

	let emailOrUsername = $state('');
	let password = $state('');
	let isLoading = $state(false);
	let errorMessage = $state('');

	async function handleLogin(event: SubmitEvent) {
		event.preventDefault();

		isLoading = true;
		errorMessage = '';

		try {
			await authService.login({
				email_or_username: emailOrUsername,
				password
			});

			await goto(resolve('/dashboard'));
		} catch (error: unknown) {
			errorMessage =
				error instanceof Error ? error.message : 'Failed to log in. Please check your credentials.';
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-rose-50 p-4">
	<div class="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
		<div class="mb-8 text-center">
			<h1 class="mb-2 text-3xl font-bold text-gray-900">Welcome Back</h1>
			<p class="text-gray-500">Log in to your Twoly account</p>
		</div>

		{#if errorMessage}
			<div class="mb-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
				{errorMessage}
			</div>
		{/if}

		<form onsubmit={handleLogin} class="space-y-5">
			<Input
				label="Email or Username"
				type="text"
				placeholder="Enter your email or username"
				bind:value={emailOrUsername}
				required
			/>

			<Input
				label="Password"
				type="password"
				placeholder="Enter your password"
				bind:value={password}
				required
			/>

			<div class="pt-2">
				<Button type="submit" class="w-full" {isLoading}>Log In</Button>
			</div>
		</form>

		<div class="mt-8 text-center text-sm text-gray-600">
			Don't have an account?
			<a href={resolve('/register')} class="font-semibold text-rose-500 hover:text-rose-600">
				Register here
			</a>
		</div>
	</div>
</div>
