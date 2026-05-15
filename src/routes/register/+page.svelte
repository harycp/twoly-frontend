<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { authService } from '$lib/services/auth.service';
	import Button from '$lib/components/common/Button.svelte';
	import Input from '$lib/components/common/Input.svelte';

	let name = $state('');
	let username = $state('');
	let email = $state('');
	let password = $state('');
	let isLoading = $state(false);
	let errorMessage = $state('');

	async function handleRegister(event: SubmitEvent) {
		event.preventDefault();

		isLoading = true;
		errorMessage = '';

		try {
			await authService.register({
				name,
				username,
				email,
				password
			});

			await authService.login({
				email_or_username: email,
				password
			});

			await goto(resolve('/join-couple'));
		} catch (error: unknown) {
			errorMessage =
				error instanceof Error ? error.message : 'Failed to register. Please try again.';
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-rose-50 p-4">
	<div class="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
		<div class="mb-8 text-center">
			<h1 class="mb-2 text-3xl font-bold text-gray-900">Create Account</h1>
			<p class="text-gray-500">Start your journey together</p>
		</div>

		{#if errorMessage}
			<div class="mb-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
				{errorMessage}
			</div>
		{/if}

		<form onsubmit={handleRegister} class="space-y-4">
			<Input label="Full Name" type="text" placeholder="e.g. John Doe" bind:value={name} required />

			<Input
				label="Username"
				type="text"
				placeholder="Unique username"
				bind:value={username}
				required
			/>

			<Input
				label="Email"
				type="email"
				placeholder="name@example.com"
				bind:value={email}
				required
			/>

			<Input
				label="Password"
				type="password"
				placeholder="Minimum 6 characters"
				bind:value={password}
				minlength={6}
				required
			/>

			<div class="pt-4">
				<Button type="submit" class="w-full" {isLoading}>Sign Up</Button>
			</div>
		</form>

		<div class="mt-8 text-center text-sm text-gray-600">
			Already have an account?
			<a href={resolve('/login')} class="font-semibold text-rose-500 hover:text-rose-600">
				Log in here
			</a>
		</div>
	</div>
</div>
