<script lang="ts">
    interface Props {
        tags: string[];
        label?: string;
    }

    let { tags = $bindable([]), label = "Tags" }: Props = $props();
    let currentTag = $state('');

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === 'Enter' || event.key === ',') {
            event.preventDefault();
            addTag();
        }
    }

    function addTag() {
        const t = currentTag.trim().toLowerCase();
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
    
    <div class="flex flex-col gap-3 rounded-[24px] border border-white/60 bg-white/40 backdrop-blur-xl p-2.5 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.03)] focus-within:border-[#FDA4AF] focus-within:bg-white/70 transition-all duration-300">
        
        <!-- Render Tags -->
        {#if tags.length > 0}
            <div class="flex flex-wrap gap-2 px-2 pt-1">
                {#each tags as tag (tag)}
                    <span class="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[11px] font-bold tracking-widest text-gray-800 shadow-sm border border-gray-100">
                        #{tag}
                        <button type="button" onclick={() => removeTag(tag)} class="text-gray-400 hover:text-red-500 transition-colors">
                            <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                    </span>
                {/each}
            </div>
        {/if}

        <!-- Input Field -->
        <input
            type="text"
            placeholder="Type and press enter..."
            bind:value={currentTag}
            onkeydown={handleKeydown}
            class="w-full bg-transparent px-3 pb-1.5 h-8 text-sm font-semibold text-gray-900 placeholder:text-gray-400 focus:outline-none"
        />
    </div>
</div>