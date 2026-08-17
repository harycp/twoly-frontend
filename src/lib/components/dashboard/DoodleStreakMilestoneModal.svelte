<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		milestone: number;
		onClose: () => void;
	}

	let { milestone, onClose }: Props = $props();

	interface Particle {
		id: number;
		angle: number;
		distance: number;
		size: number;
		delay: number;
		duration: number;
		colorClass: string;
	}

	let milestoneParticles = $state<Particle[]>([]);
	let confettiParticles = $state<Particle[]>([]);
	let milestoneTimer: ReturnType<typeof setTimeout> | null = null;
	let confettiTimer: ReturnType<typeof setTimeout> | null = null;

	onMount(() => {
		milestoneParticles = Array.from({ length: 22 }, (_, index) => ({
			id: Date.now() + index,
			angle: Math.random() * 360,
			distance: 60 + Math.random() * 80,
			size: 10 + Math.random() * 14,
			delay: Math.random() * 120,
			duration: 900 + Math.random() * 400,
			colorClass: index % 3 === 0 ? 'bg-[#FDBA74]' : index % 2 === 0 ? 'bg-[#FB7185]' : 'bg-[#C084FC]'
		}));
		milestoneTimer = setTimeout(() => (milestoneParticles = []), 1400);

		confettiParticles = Array.from({ length: 26 }, (_, i) => ({
			id: Date.now() + 1000 + i,
			angle: Math.random() * 360,
			distance: 60 + Math.random() * 120,
			size: 6 + Math.random() * 10,
			delay: Math.random() * 200,
			duration: 900 + Math.random() * 600,
			colorClass: i % 3 === 0 ? 'bg-[#FFD166]' : i % 2 === 0 ? 'bg-[#FDE68A]' : 'bg-[#FBBF24]'
		}));
		confettiTimer = setTimeout(() => (confettiParticles = []), 1600);

		return () => {
			if (milestoneTimer) clearTimeout(milestoneTimer);
			if (confettiTimer) clearTimeout(confettiTimer);
		};
	});
</script>

<div
	style="position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding-left:1.5rem;padding-right:1.5rem;"
	aria-hidden="false"
>
	<button
		type="button"
		style="position:absolute;inset:0;background:rgba(0,0,0,0.55);backdrop-filter:blur(6px);"
		aria-label="Dismiss milestone"
		onclick={onClose}
	></button>

	<div class="relative z-10 w-full max-w-sm rounded-[36px] bg-white p-7 text-center shadow-2xl border border-white">
		<button
			type="button"
			class="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:text-gray-700 active:scale-90"
			aria-label="Close milestone"
			onclick={onClose}
		>
			✕
		</button>

		<div class="flex flex-col items-center gap-3">
			<div class="relative flex items-center justify-center">
				<div class="h-28 w-28 rounded-full bg-linear-to-br from-[#FFF1F5] to-[#F3E8FF]" aria-hidden="true"></div>

				{#each milestoneParticles as p (p.id)}
					<span
						class={`absolute left-1/2 top-1/2 rounded-full ${p.colorClass}`}
						style={`width:${p.size}px;height:${p.size}px;transform:translate(-50%,-50%) rotate(${p.angle}deg) translateY(-${p.distance}px); animation: burst-pop ${p.duration}ms ease-out ${p.delay}ms forwards;`}
					></span>
				{/each}

				{#each confettiParticles as c (c.id)}
					<span
						class={`absolute left-1/2 top-1/2 rounded-xs ${c.colorClass}`}
						style={`width:${c.size}px;height:${c.size}px;transform:translate(-50%,-50%) rotate(${c.angle}deg) translateY(-${c.distance}px); animation: burst-pop ${c.duration}ms cubic-bezier(.2,.8,.2,1) ${c.delay}ms forwards;`}
					></span>
				{/each}

				<div class="absolute text-4xl">🎨</div>
			</div>

			<h3 class="text-2xl font-black text-gray-900 tracking-tight leading-tight">
				{milestone} Days Doodle Streak! 🎉
			</h3>
			<p class="text-xs font-bold text-gray-500 max-w-xs">
				You and your partner have created art together for {milestone} days in a row! Keep the love alive!
			</p>

			<button
				type="button"
				onclick={onClose}
				class="mt-2 w-full rounded-2xl bg-linear-to-r from-rose-500 to-pink-500 py-3 text-xs font-black text-white shadow-lg shadow-rose-200 transition-all hover:from-rose-600 hover:to-pink-600 active:scale-95"
			>
				Keep Drawing ✨
			</button>
		</div>
	</div>
</div>

<style>
	@keyframes burst-pop {
		0% {
			opacity: 0;
			transform: translate(-50%, -50%) scale(0.2);
		}
		25% {
			opacity: 1;
		}
		100% {
			opacity: 0;
			transform: translate(-50%, -50%) scale(1.1) translateY(-18px);
		}
	}
</style>
