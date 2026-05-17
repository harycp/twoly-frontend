<script lang="ts">
    interface Props {
        tags: string[];
        label?: string;
    }

    let { tags = $bindable([]), label = "Tags" }: Props = $props();
    let currentTag = $state('');
    let inputRef = $state<HTMLInputElement | null>(null);

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === 'Enter' || event.key === ',') {
            event.preventDefault();
            addTag();
        } else if (event.key === 'Backspace' && currentTag === '' && tags.length > 0) {
            // Smart UX: Menghapus tag terakhir jika menekan backspace di kotak yang kosong
            event.preventDefault();
            tags = tags.slice(0, -1);
        }
    }

    function addTag() {
        const t = currentTag.trim().toLowerCase();
        // Cegah duplikasi dan pastikan tidak kosong
        if (t && !tags.includes(t)) {
            tags = [...tags, t];
        }
        currentTag = '';
    }

    function removeTag(tagToRemove: string) {
        tags = tags.filter(t => t !== tagToRemove);
    }
</script>

<div class="flex flex-col gap-2 w-full">
    {#if label}
        <label class="text-[12px] font-black text-gray-500 uppercase tracking-widest ml-1">
            {label}
        </label>
    {/if}
    
    <!-- Wrapper Bubbly Glassmorphism: Mengeklik area mana pun akan fokus ke input -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div 
        class="group relative flex min-h-[56px] w-full flex-wrap items-center gap-2.5 rounded-[24px] border border-white/60 bg-white/40 p-3.5 backdrop-blur-xl shadow-[0_4px_20px_-8px_rgba(0,0,0,0.03)] transition-all duration-300 focus-within:border-[#FDA4AF] focus-within:bg-white/70 focus-within:ring-4 focus-within:ring-[#FDA4AF]/15 cursor-text"
        onclick={() => inputRef?.focus()}
    >
        
        <!-- Render Tags sebagai Pil Menggemaskan (Bubbly Pills) -->
        {#if tags.length > 0}
            {#each tags as tag (tag)}
                <span class="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#FDA4AF] to-[#F8B4C8] px-3.5 py-1.5 text-[12px] font-black tracking-wide text-white shadow-[0_4px_10px_-2px_rgba(253,164,175,0.5)] transition-transform active:scale-95">
                    #{tag}
                    <button 
                        type="button" 
                        onclick={(e) => { e.stopPropagation(); removeTag(tag); }} 
                        class="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white/25 text-white hover:bg-white/40 active:scale-90 transition-all"
                        aria-label="Remove tag"
                    >
                        <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                </span>
            {/each}
        {/if}

        <!-- Input Ketikan Seamless (Tanpa Border) -->
        <input
            bind:this={inputRef}
            type="text"
            placeholder={tags.length === 0 ? "Type and press enter..." : "Add more..."}
            bind:value={currentTag}
            onkeydown={handleKeydown}
            class="min-w-[120px] flex-1 border-0 border-none bg-transparent p-0 text-[15px] font-semibold text-gray-900 placeholder:text-gray-400 outline-none focus:border-transparent focus:outline-none focus:ring-0"
        />
    </div>

    <!-- Hint Keyboard Ekstra -->
    <p class="ml-2 text-[10px] font-bold text-gray-400">
        Press <kbd class="inline-block rounded-md bg-white/80 px-1.5 py-0.5 font-mono text-[9px] shadow-[0_2px_4px_-1px_rgba(0,0,0,0.05)] border border-gray-100 text-gray-600">Enter</kbd> to add a tag.
    </p>
</div>