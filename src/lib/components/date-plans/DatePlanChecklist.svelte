<script lang="ts">
    interface Props {
        id: string;
        label: string;
        isChecked: boolean;
        onToggle: (id: string, newStatus: boolean) => void;
        onDelete: (id: string) => void;
    }

    let { id, label, isChecked, onToggle, onDelete }: Props = $props();
</script>

<div class="group relative flex items-center justify-between gap-4 rounded-3xl bg-white/40 backdrop-blur-xl border border-white/60 p-4 shadow-[0_4px_15px_-5px_rgba(0,0,0,0.02)] transition-all duration-300 hover:bg-white/60 {isChecked ? 'opacity-60' : ''}">
    
    <button 
        type="button" 
        onclick={() => onToggle(id, !isChecked)}
        class="flex flex-1 items-center gap-4 text-left outline-none"
    >
        <!-- Custom Checkbox Bubble -->
        <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 {isChecked ? 'bg-gray-900 border-gray-900 text-white shadow-sm' : 'border-gray-300 bg-transparent'}">
            {#if isChecked}
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                </svg>
            {/if}
        </div>
        
        <span class="text-[15px] font-bold transition-all duration-300 {isChecked ? 'text-gray-400 line-through decoration-2' : 'text-gray-800'}">
            {label}
        </span>
    </button>

    <!-- Delete Button (Muncul sedikit lebih jelas saat dihover) -->
    <button 
        type="button"
        onclick={() => onDelete(id)}
        class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-300 opacity-50 transition-all duration-300 hover:bg-red-50 hover:text-red-500 hover:opacity-100 group-hover:opacity-100"
        aria-label="Delete item"
    >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
        </svg>
    </button>
</div>