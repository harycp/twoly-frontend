<script lang="ts">
    import { goto } from '$app/navigation';
    import { resolve } from '$app/paths';
    import { authService } from '$lib/services/auth.service';
    import Button from '$lib/components/common/Button.svelte';
    import Input from '$lib/components/common/Input.svelte';
    import logo from '$lib/assets/logos/twoly.webp';

    let step = $state<1 | 2 | 3>(1);
    
    let email = $state('');
    let otp = $state('');
    let newPassword = $state('');
    let confirmPassword = $state('');
    
    let isLoading = $state(false);
    let errorMessage = $state('');
    let successMessage = $state('');

    async function handleSendOTP(event: SubmitEvent) {
        event.preventDefault();
        isLoading = true; errorMessage = ''; successMessage = '';
        try {
            await authService.forgotPassword(email);
            successMessage = 'We sent a 6-digit code to your email.';
            step = 2;
        } catch (err) {
            errorMessage = err instanceof Error ? err.message : 'Failed to send OTP.';
        } finally { isLoading = false; }
    }

    async function handleVerifyOTP(event: SubmitEvent) {
        event.preventDefault();
        isLoading = true; errorMessage = ''; successMessage = '';
        try {
            await authService.verifyOtp(email, otp);
            successMessage = 'Code verified! You can now secure your account.';
            step = 3;
        } catch (err) {
            errorMessage = err instanceof Error ? err.message : 'Invalid or expired OTP code.';
        } finally { isLoading = false; }
    }

    async function handleResetPassword(event: SubmitEvent) {
        event.preventDefault();
        if (newPassword !== confirmPassword) {
            errorMessage = 'Passwords do not match.';
            return;
        }
        isLoading = true; errorMessage = ''; successMessage = '';
        try {
            await authService.resetPassword(email, otp, newPassword);
            successMessage = 'Password reset successfully! Redirecting...';
            setTimeout(() => goto(resolve('/login')), 2000);
        } catch (err) {
            errorMessage = err instanceof Error ? err.message : 'Failed to reset password.';
        } finally { isLoading = false; }
    }
</script>

<div class="flex min-h-screen flex-col items-center justify-center bg-[#FFF7ED] p-6 relative overflow-hidden">
    <div class="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-[#F8B4C8] opacity-20 blur-3xl"></div>
    <div class="absolute top-1/2 -right-20 h-80 w-80 rounded-full bg-[#FED7AA] opacity-20 blur-3xl"></div>

    <div class="w-full max-w-md relative z-10">
        <div class="mb-10 text-center space-y-2">
            <div class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-[0_8px_30px_-10px_rgba(248,180,200,0.5)] border border-gray-50">
                <img src={logo} alt="Twoly Logo" class="h-12 w-12 object-contain drop-shadow-sm" />
            </div>
            <h1 class="text-3xl font-black text-gray-900 tracking-tight">Recovery</h1>
            <p class="text-base font-medium text-gray-500">Let's get you back to your space</p>
        </div>

        <div class="rounded-4xl bg-white/70 backdrop-blur-xl p-8 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.05)] border border-white">
            
            {#if errorMessage}
                <div class="mb-6 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-600 border border-red-100">
                    {errorMessage}
                </div>
            {/if}
            
            {#if successMessage}
                <div class="mb-6 rounded-2xl bg-green-50 p-4 text-sm font-semibold text-green-600 border border-green-100">
                    {successMessage}
                </div>
            {/if}

            {#if step === 1}
                <form onsubmit={handleSendOTP} class="space-y-5">
                    <Input
                        label="Account Email"
                        type="email"
                        placeholder="name@example.com"
                        bind:value={email}
                        required
                    />
                    <div class="pt-4">
                        <Button type="submit" class="w-full" {isLoading}>Send Recovery Code</Button>
                    </div>
                </form>
            {:else if step === 2}
                <form onsubmit={handleVerifyOTP} class="space-y-5">
                    <Input
                        label="6-Digit OTP Code"
                        type="text"
                        placeholder="Enter the code from your email"
                        bind:value={otp}
                        maxlength={6}
                        required
                    />
                    <div class="pt-4 flex flex-col gap-3">
                        <Button type="submit" class="w-full" {isLoading}>Verify Code</Button>
                        <button type="button" onclick={() => step = 1} class="text-[12px] font-bold text-gray-400 hover:text-[#FDA4AF] transition-colors">
                            Wrong email? Go back
                        </button>
                    </div>
                </form>
            {:else if step === 3}
                <form onsubmit={handleResetPassword} class="space-y-5">
                    <Input
                        label="New Password"
                        type="password"
                        placeholder="Minimum 6 characters"
                        bind:value={newPassword}
                        minlength={6}
                        required
                    />
                    <Input
                        label="Confirm Password"
                        type="password"
                        placeholder="Retype new password"
                        bind:value={confirmPassword}
                        minlength={6}
                        required
                    />
                    <div class="pt-4">
                        <Button type="submit" class="w-full" {isLoading}>Update Password</Button>
                    </div>
                </form>
            {/if}
        </div>

        <div class="mt-8 text-center text-sm font-medium text-gray-500">
            Remembered your password?
            <a href={resolve('/login')} class="font-extrabold text-[#FDA4AF] hover:text-[#F8B4C8] transition-colors">
                Back to login
            </a>
        </div>
    </div>
</div>