<script lang="ts">
    import { onMount } from 'svelte';

    let { milestone, onClose } = $props();

    interface Particle { id:number; angle:number; distance:number; size:number; delay:number; duration:number; colorClass:string }

    let milestoneParticles = $state<Particle[]>([]);
    let confettiParticles = $state<Particle[]>([]);
    let milestoneTimer: ReturnType<typeof setTimeout> | null = null;
    let confettiTimer: ReturnType<typeof setTimeout> | null = null;

    onMount(() => {
        milestoneParticles = Array.from({ length: 18 }, (_, index) => ({
            id: Date.now() + index,
            angle: Math.random() * 360,
            distance: 60 + Math.random() * 80,
            size: 10 + Math.random() * 14,
            delay: Math.random() * 120,
            duration: 900 + Math.random() * 400,
            colorClass: index % 3 === 0 ? 'bg-[#FDBA74]' : index % 2 === 0 ? 'bg-[#FB7185]' : 'bg-[#F472B6]'
        }));
        milestoneTimer = setTimeout(() => (milestoneParticles = []), 1400);

        confettiParticles = Array.from({ length: 22 }, (_, i) => ({
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
        }
    });
</script>

<div style="position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding-left:1.5rem;padding-right:1.5rem;" aria-hidden="false">
    <button type="button" style="position:absolute;inset:0;background:rgba(0,0,0,0.5);backdrop-filter:blur(6px);" aria-label="Dismiss milestone" onclick={onClose}></button>

    <div class="relative z-10 w-full max-w-xl rounded-2xl bg-white p-6 text-center shadow-2xl">
        <button type="button" class="absolute right-3 top-3 text-gray-500 hover:text-gray-900" aria-label="Close milestone" onclick={onClose}>✕</button>

        <div class="flex flex-col items-center gap-4">
            <div class="relative flex items-center justify-center">
                <div class="h-28 w-28 rounded-full bg-[#FFF1F5]" aria-hidden="true"></div>

                {#each milestoneParticles as p (p.id)}
                    <span class={`absolute left-1/2 top-1/2 rounded-full ${p.colorClass}`} style={`width:${p.size}px;height:${p.size}px;transform:translate(-50%,-50%) rotate(${p.angle}deg) translateY(-${p.distance}px); animation: burst-pop ${p.duration}ms ease-out ${p.delay}ms forwards;`}></span>
                {/each}

                {#each confettiParticles as c (c.id)}
                    <span class={`absolute left-1/2 top-1/2 rounded-sm ${c.colorClass}`} style={`width:${c.size}px;height:${c.size}px;transform:translate(-50%,-50%) rotate(${c.angle}deg) translateY(-${c.distance}px); animation: burst-pop ${c.duration}ms cubic-bezier(.2,.8,.2,1) ${c.delay}ms forwards;`}></span>
                {/each}
            </div>

            <div class="text-2xl font-black text-[#111827]">Milestone reached!</div>
            <div class="text-5xl font-extrabold text-[#FB7185]">{milestone} days</div>
            <div class="text-sm text-gray-500">You've kept the touch rhythm strong — masterpiece unlocked.</div>

            <div class="mt-4">
                <button type="button" class="rounded-full bg-[#FB7185] px-5 py-2 text-white font-bold shadow-md hover:brightness-95" onclick={onClose}>Great</button>
            </div>
        </div>
    </div>
</div>

<style>
    .rounded-sm { border-radius: 4px }
    @keyframes burst-pop { 0%{opacity:0; transform: translate(-50%,-50%) scale(.35)} 18%{opacity:1} 100%{opacity:0; transform: translate(-50%,-50%) scale(1.05) translateY(-12px)} }
</style>
