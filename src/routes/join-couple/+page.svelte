<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { coupleService } from '$lib/services/couple.service';
	import { coupleStore } from '$lib/stores/couple.store.svelte';
	import Button from '$lib/components/common/Button.svelte';
	import Input from '$lib/components/common/Input.svelte';

	let inviteCodeInput = $state('');
	let isJoining = $state(false);
	let isCreating = $state(false);
	let errorMessage = $state('');

	onMount(async () => {
		try {
			await coupleService.getMyCouple();
			if (coupleStore.isActive) {
				await goto(resolve('/dashboard'));
			}
		} catch (error) {}
	});

	async function handleJoin(event: SubmitEvent) {
		event.preventDefault();

		if (!inviteCodeInput) {
			errorMessage = 'Please enter an invite code.';
			return;
		}

		isJoining = true;
		errorMessage = '';

		try {
			await coupleService.joinCouple({ invite_code: inviteCodeInput });
			await goto(resolve('/dashboard'));
		} catch (error: unknown) {
			errorMessage =
				error instanceof Error ? error.message : 'Failed to join couple. Check your code.';
		} finally {
			isJoining = false;
		}
	}

	async function handleCreateInvite() {
		isCreating = true;
		errorMessage = '';

		try {
			await coupleService.createInvite();
		} catch (error: unknown) {
			errorMessage = error instanceof Error ? error.message : 'Failed to generate invite code.';
		} finally {
			isCreating = false;
		}
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-rose-50 p-4">
	<div class="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
		<div class="mb-8 text-center">
			<h1 class="mb-2 text-3xl font-bold text-gray-900">Partner Setup</h1>
			<p class="text-gray-500">Connect with your partner to start</p>
		</div>

		{#if errorMessage}
			<div class="mb-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
				{errorMessage}
			</div>
		{/if}

		{#if coupleStore.isPending && coupleStore.data}
			<div class="rounded-2xl border border-rose-100 bg-rose-50 p-6 text-center">
				<p class="mb-2 text-sm font-medium text-rose-800">Your Invite Code</p>
				<div class="mb-4 text-4xl font-black tracking-widest text-rose-600">
					{coupleStore.data.invite_code}
				</div>
				<p class="text-xs text-rose-600">
					Share this code with your partner.<br />This page will automatically update once they
					join.
				</p>
				<div class="mt-6">
					<Button
						variant="secondary"
						class="w-full"
						onclick={() => {
							coupleService.getMyCouple().then(() => {
								if (coupleStore.isActive) goto(resolve('/dashboard'));
							});
						}}
					>
						Refresh Status
					</Button>
				</div>
			</div>
		{:else}
			<div class="space-y-8">
				<form onsubmit={handleJoin} class="space-y-4">
					<h2 class="text-sm font-bold tracking-wide text-gray-700 uppercase">
						Option 1: Join Partner
					</h2>
					<Input
						label="Invite Code"
						type="text"
						placeholder="e.g. ABCD1234"
						bind:value={inviteCodeInput}
						class="uppercase"
						required
					/>
					<Button type="submit" class="w-full" isLoading={isJoining}>Connect Partner</Button>
				</form>

				<div class="relative">
					<div class="absolute inset-0 flex items-center">
						<div class="w-full border-t border-gray-200"></div>
					</div>
					<div class="relative flex justify-center text-sm">
						<span class="bg-white px-2 text-gray-500">Or</span>
					</div>
				</div>

				<div class="space-y-4">
					<h2 class="text-sm font-bold tracking-wide text-gray-700 uppercase">
						Option 2: Invite Partner
					</h2>
					<p class="text-sm text-gray-500">
						Don't have a code? Generate one to share with your partner.
					</p>
					<Button
						type="button"
						variant="secondary"
						class="w-full"
						onclick={handleCreateInvite}
						isLoading={isCreating}
					>
						Generate Invite Code
					</Button>
				</div>
			</div>
		{/if}
	</div>
</div>
