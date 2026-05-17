<script lang="ts">
    import { fade, scale } from 'svelte/transition';
    
    interface Props {
        isOpen: boolean;
        title: string;
        message?: string;
        confirmText?: string;
        cancelText?: string;
        isDestructive?: boolean;
        onConfirm?: () => void;
        onCancel?: () => void;
    }
    
    let {
        isOpen = $bindable(false),
        title,
        message,
        confirmText = 'OK',
        cancelText,
        isDestructive = false,
        onConfirm,
        onCancel
    }: Props = $props();

    function handleConfirm() {
        if (onConfirm) onConfirm();
        isOpen = false;
    }

    function handleCancel() {
        if (onCancel) onCancel();
        isOpen = false;
    }
</script>

{#if isOpen}
    <div transition:fade={{ duration: 200 }} class="fixed inset-0 z-[999999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div transition:scale={{ duration: 250, start: 0.95 }} class="w-full max-w-[280px] rounded-[18px] bg-white/80 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden border border-white/50">
            
            <div class="p-5 text-center flex flex-col items-center">
                <h3 class="text-[17px] font-black tracking-tight text-gray-900 leading-tight">{title}</h3>
                {#if message}
                    <p class="text-[13px] font-medium text-gray-500 mt-1.5 leading-snug">{message}</p>
                {/if}
            </div>
            
            <div class="flex border-t border-gray-200/60 {cancelText ? '' : 'flex-col'}">
                {#if cancelText}
                    <button type="button" onclick={handleCancel} class="flex-1 py-3 text-[15px] font-bold text-gray-500 hover:bg-gray-50/50 transition-colors border-r border-gray-200/60 active:bg-gray-100/50">
                        {cancelText}
                    </button>
                {/if}
                <button type="button" onclick={handleConfirm} class="flex-1 py-3 text-[15px] font-bold transition-colors active:bg-gray-100/50 {isDestructive ? 'text-red-500 hover:bg-red-50/50' : 'text-[#FDA4AF] hover:bg-[#FDA4AF]/10'} {cancelText ? '' : 'w-full'}">
                    {confirmText}
                </button>
            </div>
        </div>
    </div>
{/if}