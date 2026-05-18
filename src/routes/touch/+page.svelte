<script lang="ts">
    import { goto } from '$app/navigation';
    import { resolve } from '$app/paths';
    import { browser } from '$app/environment';
    
    import { authStore } from '$lib/stores/auth.store.svelte';
    import { coupleStore } from '$lib/stores/couple.store.svelte';
    import { supabase } from '$lib/services/supabase.service';

    import FloatingHearts from '$lib/components/touch/FloatingHearts.svelte';
    import ComboCounter from '$lib/components/touch/ComboCounter.svelte';
    import TouchButton from '$lib/components/touch/TouchButton.svelte';

    let myId = $derived(authStore.user?.id);
    let coupleId = $derived(coupleStore.data?.id || (coupleStore.data as { couple_id?: string } | null)?.couple_id);

    let isConnected = $state(false);
    let connectionError = $state('');
    let isChannelInitialized = false;

    interface FloatingHeart { id: number; x: number; size: number; isFromPartner: boolean; combo: number; }
    let floatingHearts = $state<FloatingHeart[]>([]);
    let heartCounter = 0;

    let localComboCount = $state(0);
    let comboTimeout: ReturnType<typeof setTimeout> | null = null;

    $effect(() => {
        if (!browser) return;

        if (!authStore.isAuthenticated) { goto(resolve('/login')); return; }
        if (!coupleStore.isActive) { goto(resolve('/join-couple')); return; }

        if (!coupleId || !myId) {
            return; 
        }
        
        if (isChannelInitialized) return;
        isChannelInitialized = true;

        const roomName = `touches_${coupleId}`;

        const newChannel = supabase.channel(roomName)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'couple_touches', filter: `couple_id=eq.${coupleId}` },
                (payload) => {
                    const data = payload.new;
                    
                    if (data.sender_id !== myId) {
                        triggerPartnerTouch(data.pos_x, data.combo_count);
                    }
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    isConnected = true;
                    connectionError = '';
                } else if (status === 'CHANNEL_ERROR') {
                    isConnected = false;
                    connectionError = 'Realtime rejected. Enable Replication in Supabase.';
                } else if (status === 'TIMED_OUT') {
                    isConnected = false;
                    connectionError = 'Connection Timeout.';
                }
            });
        return () => {
            if (newChannel) newChannel.unsubscribe();
            isConnected = false;
            isChannelInitialized = false;
        };
    });

    function triggerHaptic(intensity: 'light' | 'heavy' = 'light') {
        if (browser && navigator.vibrate) {
            if (intensity === 'light') navigator.vibrate(30);
            else navigator.vibrate([60, 40, 80]);
        }
    }

    function spawnFloatingHeart(isFromPartner: boolean, relativeX: number = 0.5, combo: number = 1) {
        const id = heartCounter++;
        const screenX = 20 + (relativeX * 60); 
        const baseSize = isFromPartner ? 40 : 28;
        const size = baseSize + (Math.min(combo, 15) * 4) + (Math.random() * 15);

        floatingHearts = [...floatingHearts, { id, x: screenX, size, isFromPartner, combo }];
        setTimeout(() => { floatingHearts = floatingHearts.filter(h => h.id !== id); }, 3000);
    }

    async function handleInteraction(event: MouseEvent | TouchEvent) {
        if (!isConnected) {
            return;
        }

        try {
            if (event.cancelable && !(event instanceof TouchEvent)) {
                event.preventDefault();
            }
        } catch (error) {
            void error;
        }

        const target = event.currentTarget as HTMLElement;
        const rect = target.getBoundingClientRect();
        
        let clientX, clientY;
        if ('touches' in window && event instanceof TouchEvent) {
            clientX = event.touches[0].clientX;
            clientY = event.touches[0].clientY;
        } else if (event instanceof MouseEvent) {
            clientX = event.clientX;
            clientY = event.clientY;
        } else {
            return;
        }

        const posX = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        const posY = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));

        localComboCount++;
        const currentCombo = localComboCount;

        if (comboTimeout) clearTimeout(comboTimeout);
        comboTimeout = setTimeout(() => { localComboCount = 0; }, 1200);

        triggerHaptic('light');
        spawnFloatingHeart(false, posX, currentCombo);

        await supabase.from('couple_touches').insert([{ 
            couple_id: coupleId, 
            sender_id: myId,
            pos_x: posX,
            pos_y: posY,
            combo_count: currentCombo,
            is_long_press: false
        }]);
    }

    function triggerPartnerTouch(partnerPosX: number, combo: number) {
        triggerHaptic('heavy');
        const mirroredX = 1.0 - partnerPosX;
        spawnFloatingHeart(true, mirroredX, combo);
    }
</script>

<div class="min-h-screen bg-[#0B0F19] text-white selection:bg-rose-500/30 font-sans relative overflow-hidden flex flex-col">
    
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full blur-[120px] pointer-events-none transition-all duration-1000 {isConnected ? 'bg-rose-500/10 opacity-100' : 'bg-white/5 opacity-30'} z-0"></div>

    <header class="relative z-40 px-6 pt-12 pb-4 flex items-center justify-between">
        <a aria-label="Back to dashboard" href={resolve('/dashboard')} class="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/70 transition-all hover:bg-white/10 hover:text-white active:scale-90 backdrop-blur-md">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/></svg>
        </a>
        <div class="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 backdrop-blur-md border border-white/5">
            <span class="relative flex h-2 w-2">
                {#if isConnected}
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                {:else if connectionError}
                    <span class="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                {:else}
                    <span class="relative inline-flex rounded-full h-2 w-2 bg-yellow-500 animate-pulse"></span>
                {/if}
            </span>
            <span class="text-[10px] font-black uppercase tracking-widest {isConnected ? 'text-rose-400' : connectionError ? 'text-red-400' : 'text-yellow-400'}">
                {isConnected ? 'Connected' : connectionError ? 'Error' : 'Connecting...'}
            </span>
        </div>
    </header>

    <main class="flex-1 relative flex flex-col items-center justify-center z-10 px-6 pb-20">
        
        <ComboCounter count={localComboCount} />
        
        <FloatingHearts hearts={floatingHearts} />

        <TouchButton {isConnected} onInteraction={handleInteraction} />
        
        {#if connectionError}
            <div class="mt-12 px-5 py-2.5 rounded-full bg-red-500/10 border border-red-500/20 backdrop-blur-md relative z-20">
                <p class="text-[11px] font-bold text-red-400 text-center uppercase tracking-widest">
                    {connectionError}
                </p>
            </div>
        {:else}
            <p class="mt-16 text-[12px] font-bold text-white/30 text-center tracking-widest uppercase transition-opacity duration-500 relative z-20">
                {isConnected ? 'Tap anywhere on the glass to send love' : 'Syncing with database...'}
            </p>
        {/if}

    </main>
</div>