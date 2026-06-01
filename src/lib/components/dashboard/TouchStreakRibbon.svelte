<script lang="ts">
    import HeartIcon from '$lib/components/icons/HeartIcon.svelte';
    import { uiStore } from '$lib/stores/ui.store.svelte';

    interface Props {
        streak: number;
    }

    let { streak }: Props = $props();

    const maxSegments = 7;
    const baseMilestones = [7, 14, 30, 50];
    let milestones = $state<number[]>([]);

    interface BurstParticle {
        id: number;
        angle: number;
        distance: number;
        size: number;
        delay: number;
        duration: number;
        colorClass: string;
    }

    let previousStreak = $state<number | null>(null);
    let burstParticles = $state<BurstParticle[]>([]);
    let burstTimer: ReturnType<typeof setTimeout> | null = null;

    function triggerBurst(changeSize: number) {
        if (burstTimer) {
            clearTimeout(burstTimer);
        }

        const intensity = Math.min(2, Math.max(1, changeSize));
        const particles = Array.from({ length: 10 + intensity * 4 }, (_, index) => {
            const angle = (360 / (10 + intensity * 4)) * index + Math.random() * 10;
            const distance = 72 + Math.random() * 28;
            const size = 8 + Math.random() * 7;
            const duration = 700 + Math.random() * 280;
            const delay = Math.random() * 70;
            const colorClass = index % 3 === 0 ? 'bg-[#FDBA74]' : index % 2 === 0 ? 'bg-[#FB7185]' : 'bg-[#F472B6]';

            return {
                id: Date.now() + index,
                angle,
                distance,
                size,
                delay,
                duration,
                colorClass
            };
        });

        burstParticles = particles;
        burstTimer = setTimeout(() => {
            burstParticles = [];
        }, 1300);
    }

    $effect(() => {
        const currentStreak = streak;

        if (previousStreak !== null && currentStreak > previousStreak) {
            triggerBurst(currentStreak - previousStreak);

            for (const m of milestones) {
                if (currentStreak >= m && previousStreak < m) {
                    uiStore.openMilestone(m);
                    break;
                }
            }
        }

        previousStreak = currentStreak;

        return () => {
            if (burstTimer) {
                clearTimeout(burstTimer);
            }
        };
    });

    $effect(() => {
        const maxTarget = Math.max(500, streak + 250);
        const ms = [...baseMilestones];
        for (let n = 100; n <= maxTarget; n += 50) ms.push(n);
        milestones = ms;
    });

    let activeSegments = $derived(Math.min(streak, maxSegments));
    let fireColorClass = $derived(streak <= 0 ? 'text-gray-300' : streak < 3 ? 'text-[#F59E0B]' : streak < 7 ? 'text-[#FB7185]' : streak < 14 ? 'text-[#F472B6]' : 'text-[#EF4444]');
    let fireSize = $derived(40 + Math.min(streak, 30) * 1.2);

</script>

<section class="relative overflow-hidden rounded-[40px] border border-white/80 bg-[#fff8fb] p-6 shadow-[0_18px_48px_-18px_rgba(15,23,42,0.12)] backdrop-blur-xl">
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(253,164,175,0.20),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(244,114,182,0.12),transparent_28%)]"></div>
    <div class="absolute -right-14 top-8 h-40 w-40 rounded-full bg-[#FDA4AF]/15 blur-3xl pointer-events-none"></div>
    <div class="absolute -left-16 -bottom-16 h-44 w-44 rounded-full bg-[#F59E0B]/10 blur-3xl pointer-events-none"></div>

    <div class="relative grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(220px,0.8fr)] lg:items-center">
        <div class="min-w-0">
            <div class="mt-4 flex items-end gap-3">
                <span class="text-[72px] leading-none font-black tracking-tighter text-[#111827] drop-shadow-sm">{streak}</span>
                <span class="pb-2 text-[13px] font-black uppercase tracking-[0.22em] text-gray-400">days</span>
            </div>
        </div>

        <div class="relative flex justify-center lg:justify-end">
            <div class="relative flex h-48 w-48 items-center justify-center rounded-full bg-white/70 border border-white shadow-[0_20px_48px_-24px_rgba(0,0,0,0.35)]">
                <div class="absolute inset-0 rounded-full border border-[#FDA4AF]/20"></div>
                <div class="absolute inset-3 rounded-full border border-[#FBCFE8]/60"></div>
                <div class="absolute inset-7 rounded-full bg-linear-to-br from-[#FFF1F5] to-[#FEE2E2] shadow-inner"></div>

                {#each burstParticles as particle (particle.id)}
                    <span
                        class={`absolute left-1/2 top-1/2 rounded-full ${particle.colorClass}`}
                        style={`width: ${particle.size}px; height: ${particle.size}px; transform: rotate(${particle.angle}deg) translateY(-${particle.distance}px); animation: burst-pop ${particle.duration}ms ease-out ${particle.delay}ms forwards;`}
                        aria-hidden="true"
                    ></span>
                {/each}

                {#each Array.from({ length: maxSegments }, (_, index) => index) as index (index)}
                    <HeartIcon
                        className={`absolute h-2.5 w-2.5 transition-all duration-500 ${index < activeSegments ? 'text-[#FB7185] drop-shadow-[0_0_12px_rgba(251,113,133,0.45)]' : 'text-[#FBCFE8]'}`}
                        style={`transform: rotate(${index * (360 / maxSegments)}deg) translateY(-82px);`}
                        ariaLabel="streak-segment"
                    />
                {/each}

                <div class="relative z-10 flex flex-col items-center justify-center text-center">
                    <svg class={fireColorClass + ' drop-shadow-sm'} style={`width:${fireSize}px;height:${fireSize}px`} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M13.5 2.25c.34 2.5-.22 4.35-1.67 5.72-.75.69-1.16 1.48-1.16 2.39 0 1.09.56 1.92 1.58 2.53-.02-1.42.47-2.66 1.46-3.71 1.3-1.37 2.14-3.1 2.17-5.18 1.94 1.64 3.07 4.01 3.07 6.54 0 4.87-3.95 8.82-8.82 8.82S3.3 17.17 3.3 12.3c0-3.31 1.82-6.25 4.62-7.78-.55 1.83.08 3.55 1.86 5.17 1.12 1.02 1.53 2.08 1.35 3.2-.17 1.01-.73 1.84-1.68 2.47 2.33-.23 4.12-1.91 4.47-4.15.36-2.26-.24-4.21-1.86-5.76-.53-.5-.45-1.36.14-1.8.5-.38 1.25-.22 1.61.3z" />
                    </svg>
                </div>
            </div>
        </div>
    </div>

    <div class="relative mt-6 grid grid-cols-7 gap-2 rounded-[28px] bg-white/70 border border-white/80 px-4 py-4 shadow-[0_10px_28px_-18px_rgba(0,0,0,0.18)]">
        {#each Array.from({ length: maxSegments }, (_, index) => index) as index (index)}
            <div class={`h-2.5 rounded-full transition-all duration-500 ${index < activeSegments ? 'bg-[#FB7185]' : 'bg-[#FBCFE8]/70'}`}></div>
        {/each}
    </div>

</section>

<style>
    @keyframes burst-pop {
        0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.35);
            filter: blur(1px);
        }
        18% {
            opacity: 1;
            filter: blur(0);
        }
        100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(1.05) translateY(-12px);
            filter: blur(1.5px);
        }
    }

    @keyframes slow-bloom {
        0% { transform: scale(0.95); opacity: 0.85; }
        50% { transform: scale(1.02); opacity: 1; }
        100% { transform: scale(1); opacity: 1; }
    }

    .animate-pop {
        animation: pop-in 560ms cubic-bezier(.2,.8,.2,1);
    }

    @keyframes pop-in {
        0% { transform: scale(.86); opacity: 0; }
        60% { transform: scale(1.06); opacity: 1; }
        100% { transform: scale(1); }
    }

    .animate-fade-up {
        animation: fade-up 680ms ease-out;
    }

    @keyframes fade-up {
        0% { transform: translateY(6px); opacity: 0; }
        100% { transform: translateY(0); opacity: 1; }
    }
</style>