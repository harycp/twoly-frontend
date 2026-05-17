<script lang="ts">
    import type { HTMLInputAttributes } from 'svelte/elements';

    interface Props extends HTMLInputAttributes {
        label?: string;
        error?: string;
        value?: string;
        type?: 'date' | 'datetime-local';
        placeholder?: string;
    }

    let {
        label,
        error,
        value = $bindable(''),
        type = 'datetime-local',
        placeholder = 'Select date & time...',
        class: className = '',
        id = crypto.randomUUID(),
        ...rest
    }: Props = $props();

    // Memformat value secara dinamis menjadi teks yang enak dibaca (Premium Display)
    let displayValue = $derived.by(() => {
        if (!value) return placeholder;
        const d = new Date(value);
        if (isNaN(d.getTime())) return value;

        if (type === 'date') {
            return d.toLocaleDateString('en-GB', { 
                weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' 
            });
        } else {
            return d.toLocaleString('en-GB', { 
                weekday: 'short', day: 'numeric', month: 'long', year: 'numeric', 
                hour: '2-digit', minute: '2-digit' 
            }).replace(',', ' at');
        }
    });
</script>

<div class="flex flex-col gap-2 w-full {className}">
    {#if label}
        <label for={id} class="text-[12px] font-black text-gray-500 uppercase tracking-widest ml-1">
            {label}
        </label>
    {/if}
    
    <!-- GROUP: Wrapper untuk efek fokus saat input transparan diklik -->
    <div class="relative group">
        
        <!-- UI PALSU (Tampilan Premium Glassmorphism) -->
        <div class="h-14 w-full rounded-2xl border border-white/60 bg-white/40 backdrop-blur-xl px-5 flex items-center justify-between transition-all duration-300 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.03)] group-focus-within:border-[#FDA4AF] group-focus-within:bg-white/70 group-focus-within:ring-4 group-focus-within:ring-[#FDA4AF]/15 {error ? 'border-red-300 bg-red-50/50' : ''}">
            
            <span class="text-[15px] truncate {value ? 'text-gray-900 font-bold' : 'text-gray-400 font-semibold'}">
                {displayValue}
            </span>
            
            <!-- Ikon Dinamis -->
            <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white shadow-sm text-[#FDA4AF] group-focus-within:bg-[#FDA4AF] group-focus-within:text-white transition-colors duration-300">
                {#if type === 'date'}
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                {:else}
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                {/if}
            </div>
        </div>

        <!-- INPUT ASLI (Transparan - Menutupi seluruh UI palsu untuk menangkap klik user) -->
        <input
            {id}
            {type}
            bind:value
            class="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
            {...rest}
        />
    </div>
    
    {#if error}
        <span class="text-[11px] font-bold text-red-500 ml-1 mt-0.5">{error}</span>
    {/if}
</div>