<script lang="ts">
    import { fade, scale } from 'svelte/transition';
    import Button from '$lib/components/common/Button.svelte';
    import MediaPreview from '$lib/components/common/MediaPreview.svelte';
    import {
        createMemoryExportFileName,
        exportMemoryGif,
        exportMemoryPoster,
        exportMemoryVideo,
        getMemoryExportAspectLabel,
        getMemoryExportThemeCaption,
        getMemoryExportThemeLabel,
        getMemoryExportSize,
        shareOrDownloadBlob,
        type MemoryExportAspect,
        type MemoryExportFormat,
        type MemoryExportMediaItem,
        type MemoryExportTheme
    } from '$lib/utils/memory-export';

    type FormatOption = {
        value: MemoryExportFormat;
        label: string;
        description: string;
    };

    type AspectOption = {
        value: MemoryExportAspect;
        label: string;
        description: string;
    };

    type ThemeOption = {
        value: MemoryExportTheme;
        label: string;
        description: string;
        gradient: string;
    };

    interface Props {
        isOpen: boolean;
        title: string;
        memoryDate?: string;
        items: MemoryExportMediaItem[];
        defaultIndex?: number;
    }

    let {
        isOpen = $bindable(false),
        title,
        memoryDate,
        items,
        defaultIndex = 0
    }: Props = $props();

    const formatOptions: FormatOption[] = [
        { value: 'png', label: 'PNG Poster', description: 'Clean share card' },
        { value: 'gif', label: 'GIF Story', description: 'Animated preview loop' },
        { value: 'video', label: 'Video', description: 'MP4 / webm export' }
    ];

    const aspectOptions: AspectOption[] = [
        { value: 'square', label: '1:1', description: 'Instagram square' },
        { value: 'feed', label: '4:5', description: 'Feed portrait' },
        { value: 'story', label: '9:16', description: 'TikTok / Story' },
        { value: 'landscape', label: '16:9', description: 'Wide cinematic' }
    ];

    const themeOptions: ThemeOption[] = [
        { value: 'aurora', label: 'Aurora', description: 'Soft glow', gradient: 'from-[#FDA4AF] to-[#FDE68A]' },
        { value: 'sunset', label: 'Sunset', description: 'Warm cinematic', gradient: 'from-[#FF8A78] to-[#FDE68A]' },
        { value: 'midnight', label: 'Midnight', description: 'Dark premium', gradient: 'from-slate-900 to-indigo-600' },
        { value: 'paper', label: 'Paper', description: 'Scrapbook', gradient: 'from-[#FFF8F1] to-[#F7D6C1]' },
        { value: 'neon', label: 'Neon', description: 'Creator energy', gradient: 'from-[#FB7185] to-[#22D3EE]' }
    ];

    let selectedFormat = $state<MemoryExportFormat>('video');
    let selectedAspect = $state<MemoryExportAspect>('story');
    let selectedTheme = $state<MemoryExportTheme>('aurora');
    let selectedPosterIndex = $state(0);
    let isExporting = $state(false);
    let exportProgress = $state(0);
    let exportMessage = $state('');

    let selectedMedia = $derived(items[selectedPosterIndex] || items[0]);
    let sizeLabel = $derived(getMemoryExportAspectLabel(selectedAspect));
    let themeCaption = $derived(getMemoryExportThemeCaption(selectedTheme));
    let themeName = $derived(getMemoryExportThemeLabel(selectedTheme));
    let exportActionLabel = $derived(selectedFormat === 'png' ? 'Save PNG' : selectedFormat === 'gif' ? 'Save GIF' : 'Export Video');
    let previewHeight = $derived(selectedAspect === 'story' ? 'min(74vh, 34rem)' : selectedAspect === 'landscape' ? 'min(58vh, 28rem)' : 'min(68vh, 34rem)');

    $effect(() => {
        if (!isOpen) return;
        selectedPosterIndex = Math.min(defaultIndex, Math.max(items.length - 1, 0));
        selectedFormat = 'video';
        selectedAspect = 'story';
        selectedTheme = 'aurora';
        exportProgress = 0;
        exportMessage = '';
    });

    function close() {
        isOpen = false;
    }

    async function handleExport() {
        if (!items.length || !selectedMedia) return;

        isExporting = true;
        exportProgress = 0;
        exportMessage = '';

        try {
            let blob: Blob;

            if (selectedFormat === 'png') {
                blob = await exportMemoryPoster({
                    title,
                    memoryDate,
                    items,
                    selectedIndex: selectedPosterIndex,
                    aspect: selectedAspect,
                    theme: selectedTheme
                });
            } else if (selectedFormat === 'gif') {
                blob = await exportMemoryGif(
                    {
                        title,
                        memoryDate,
                        items,
                        selectedIndex: selectedPosterIndex,
                        aspect: selectedAspect,
                        theme: selectedTheme
                    },
                    (progress) => {
                        exportProgress = progress;
                    }
                );
            } else {
                blob = await exportMemoryVideo(
                    {
                        title,
                        memoryDate,
                        items,
                        selectedIndex: selectedPosterIndex,
                        aspect: selectedAspect,
                        theme: selectedTheme
                    },
                    (progress) => {
                        exportProgress = progress;
                    }
                );
            }

            const fileName = createMemoryExportFileName(title, selectedFormat, blob.type);
            await shareOrDownloadBlob(blob, fileName);
            exportMessage = `Ready to share as ${selectedFormat.toUpperCase()}.`;
        } catch (error: unknown) {
            exportMessage = error instanceof Error ? error.message : 'Failed to export memory.';
        } finally {
            isExporting = false;
        }
    }

    function exportButtonText() {
        if (isExporting) {
            return selectedFormat === 'png' ? 'Rendering poster…' : selectedFormat === 'gif' ? 'Rendering GIF…' : 'Rendering video…';
        }

        return exportActionLabel;
    }

    function formatFormatLabel(value: MemoryExportFormat): string {
        if (value === 'png') return 'PNG';
        if (value === 'gif') return 'GIF';
        return 'VIDEO';
    }
</script>

{#if isOpen}
    <div class="fixed inset-0 z-[999999] overflow-y-auto bg-black/45 p-4 backdrop-blur-[16px]" transition:fade={{ duration: 180 }}>
        <div class="mx-auto flex min-h-full w-full max-w-7xl items-center justify-center py-6">
            <div transition:scale={{ duration: 220, start: 0.96 }} class="grid w-full gap-5 rounded-[34px] border border-white/70 bg-[#F6F1EA]/95 p-4 shadow-[0_24px_90px_-20px_rgba(15,23,42,0.35)] backdrop-blur-2xl lg:grid-cols-[1.16fr_0.84fr] lg:p-5">
                <section class="rounded-[30px] border border-white/70 bg-white/40 p-4 shadow-[0_12px_40px_-20px_rgba(15,23,42,0.22)] sm:p-5">
                    <div class="mb-4 flex items-center justify-between gap-4">
                        <div>
                            <p class="text-[11px] font-black uppercase tracking-[0.28em] text-gray-500">Memory export studio</p>
                            <h2 class="mt-1 text-2xl font-black tracking-tight text-gray-900">Instagramable share kit</h2>
                            <p class="mt-1 max-w-md text-sm font-medium text-gray-500">Turn a memory timeline into a shareable poster, GIF loop, or short video with social-ready framing.</p>
                        </div>
                        <button type="button" onclick={close} class="flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/70 text-gray-900 shadow-sm transition-transform active:scale-90" aria-label="Close export studio">
                            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                    </div>

                    <div class="mb-4 flex flex-wrap gap-2">
                        <span class="rounded-full border border-white/60 bg-white/50 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-gray-600 shadow-sm backdrop-blur-md">{items.length} media</span>
                        <span class="rounded-full border border-white/60 bg-white/50 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-gray-600 shadow-sm backdrop-blur-md">{sizeLabel}</span>
                        <span class="rounded-full border border-white/60 bg-white/50 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-gray-600 shadow-sm backdrop-blur-md">{themeName}</span>
                        <span class="rounded-full border border-white/60 bg-white/50 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-gray-600 shadow-sm backdrop-blur-md">{themeCaption}</span>
                    </div>

                    <div class="relative mx-auto overflow-hidden rounded-[32px] border border-white/80 bg-neutral-100 shadow-[0_16px_45px_-18px_rgba(15,23,42,0.28)]" style={`aspect-ratio: ${getMemoryExportSize(selectedAspect).width} / ${getMemoryExportSize(selectedAspect).height}; max-height: ${previewHeight};`}>
                        <div class={`absolute inset-0 bg-gradient-to-br opacity-85 ${themeOptions.find((option) => option.value === selectedTheme)?.gradient}`}></div>
                        <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.48),_transparent_36%),radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.14),_transparent_30%)]"></div>
                        {#if selectedMedia}
                            <div class="absolute inset-0 p-4 sm:p-5">
                                <div class="absolute left-4 top-4 z-10 flex flex-wrap gap-2">
                                    <span class="rounded-full border border-white/20 bg-white/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-white backdrop-blur-md">Twoly</span>
                                    <span class="rounded-full border border-white/20 bg-white/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-white backdrop-blur-md">{sizeLabel}</span>
                                </div>

                                <div class="absolute inset-x-4 top-12 bottom-28 overflow-hidden rounded-[26px] bg-black/10 shadow-[0_12px_40px_-18px_rgba(0,0,0,0.45)] ring-1 ring-white/20">
                                    <MediaPreview
                                        src={selectedMedia.photo_url}
                                        mediaType={selectedMedia.media_type}
                                        alt={title}
                                        class="h-full w-full"
                                        mediaClass="object-cover"
                                        loading="lazy"
                                        showBadge={true}
                                    />
                                </div>

                                <div class="absolute inset-x-4 bottom-4 rounded-[24px] border border-white/20 bg-black/28 p-4 text-white backdrop-blur-2xl shadow-[0_8px_30px_-12px_rgba(0,0,0,0.38)]">
                                    <div class="flex items-start justify-between gap-4">
                                        <div class="min-w-0 flex-1">
                                            <p class="text-[11px] font-black uppercase tracking-[0.3em] text-white/60">{memoryDate ? memoryDate : 'Memory story'}</p>
                                            <h3 class="mt-1 truncate text-[clamp(1.05rem,2.2vw,1.5rem)] font-black tracking-tight">{title}</h3>
                                            {#if selectedMedia.caption}
                                                <p class="mt-1 line-clamp-2 text-sm font-medium text-white/80">{selectedMedia.caption}</p>
                                            {/if}
                                        </div>

                                        <div class="flex shrink-0 flex-col items-end gap-2 text-right">
                                            <span class="rounded-full border border-white/20 bg-white/15 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white/85 backdrop-blur-md">
                                                {formatFormatLabel(selectedFormat)}
                                            </span>
                                            <span class="text-[10px] font-bold uppercase tracking-widest text-white/55">
                                                {selectedMedia.media_type === 'video' ? 'Preview video clips' : 'Poster frame'}
                                            </span>
                                        </div>
                                    </div>

                                    {#if selectedFormat !== 'png'}
                                        <div class="mt-4 h-1.5 overflow-hidden rounded-full bg-white/15">
                                            <div class="h-full rounded-full bg-white transition-all duration-200" style={`width: ${Math.max(8, exportProgress * 100)}%`}></div>
                                        </div>
                                    {/if}
                                </div>
                            </div>
                        {/if}
                    </div>

                    <div class="mt-4 overflow-hidden rounded-[26px] border border-white/70 bg-white/55 p-3 shadow-sm backdrop-blur-xl">
                        <p class="mb-3 text-[11px] font-black uppercase tracking-[0.28em] text-gray-400">Choose poster frame</p>
                        <div class="flex gap-3 overflow-x-auto pb-1 hide-scrollbar">
                            {#each items as item, index (item.id)}
                                <button
                                    type="button"
                                    onclick={() => selectedPosterIndex = index}
                                    class="group relative h-22 w-16 shrink-0 overflow-hidden rounded-2xl border bg-gray-100 transition-all active:scale-95 {selectedPosterIndex === index ? 'border-gray-500 shadow-[0_10px_25px_-10px_rgba(0,0,0,0.25)] ring-4 ring-gray-400/20' : 'border-white/80'}"
                                    aria-label={`Select poster ${index + 1}`}
                                >
                                    <MediaPreview
                                        src={item.photo_url}
                                        mediaType={item.media_type}
                                        alt={item.caption || `Media ${index + 1}`}
                                        class="h-full w-full"
                                        mediaClass="object-cover"
                                        loading="lazy"
                                        showBadge={true}
                                    />
                                    <span class="absolute left-1.5 top-1.5 rounded-full bg-black/45 px-1.5 py-0.5 text-[9px] font-black tracking-widest text-white backdrop-blur-sm">{index + 1}</span>
                                </button>
                            {/each}
                        </div>
                    </div>
                </section>

                <aside class="rounded-[28px] bg-[#FFF7ED] p-4 sm:p-5">
                    <div class="mb-5 rounded-[24px] bg-white p-4 shadow-sm">
                        <p class="text-[11px] font-black uppercase tracking-[0.28em] text-gray-400">Format</p>
                        <div class="mt-3 grid gap-2">
                            {#each formatOptions as option (option.value)}
                                <button
                                    type="button"
                                    onclick={() => selectedFormat = option.value}
                                    class="w-full rounded-2xl border px-4 py-3 text-left transition-all active:scale-[0.99] {selectedFormat === option.value ? 'border-gray-500 bg-gray-900/5 shadow-[0_10px_25px_-12px_rgba(0,0,0,0.16)]' : 'border-gray-100 bg-white hover:border-gray-300'}"
                                >
                                    <div class="flex items-start justify-between gap-4">
                                        <div>
                                            <p class="text-sm font-black text-gray-900">{option.label}</p>
                                            <p class="mt-0.5 text-[11px] font-medium text-gray-500">{option.description}</p>
                                        </div>
                                        <span class="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-gray-500">{option.value.toUpperCase()}</span>
                                    </div>
                                </button>
                            {/each}
                        </div>
                    </div>

                    <div class="mb-5 rounded-[24px] bg-white p-4 shadow-sm">
                        <p class="text-[11px] font-black uppercase tracking-[0.28em] text-gray-400">Aspect ratio</p>
                        <div class="mt-3 grid grid-cols-2 gap-2">
                            {#each aspectOptions as option (option.value)}
                                <button
                                    type="button"
                                    onclick={() => selectedAspect = option.value}
                                    class="rounded-2xl border px-3 py-3 text-left transition-all active:scale-[0.99] {selectedAspect === option.value ? 'border-gray-500 bg-gray-900/5 shadow-[0_10px_25px_-12px_rgba(0,0,0,0.16)]' : 'border-gray-100 bg-white hover:border-gray-300'}"
                                >
                                    <p class="text-sm font-black text-gray-900">{option.label}</p>
                                    <p class="mt-0.5 text-[11px] font-medium text-gray-500">{option.description}</p>
                                </button>
                            {/each}
                        </div>
                    </div>

                    <div class="rounded-[24px] bg-white p-4 shadow-sm">
                        <p class="text-[11px] font-black uppercase tracking-[0.28em] text-gray-400">Background & vibe</p>
                        <div class="mt-3 grid gap-2">
                            {#each themeOptions as option (option.value)}
                                <button
                                    type="button"
                                    onclick={() => selectedTheme = option.value}
                                    class="w-full rounded-2xl border px-4 py-3 text-left transition-all active:scale-[0.99] {selectedTheme === option.value ? 'border-gray-500 bg-gray-900/5 shadow-[0_10px_25px_-12px_rgba(0,0,0,0.16)]' : 'border-gray-100 bg-white hover:border-gray-300'}"
                                >
                                    <div class="flex items-center gap-3">
                                        <div class={`h-11 w-11 rounded-2xl bg-gradient-to-br ${option.gradient}`}></div>
                                        <div class="min-w-0 flex-1">
                                            <p class="text-sm font-black text-gray-900">{option.label}</p>
                                            <p class="text-[11px] font-medium text-gray-500">{option.description}</p>
                                        </div>
                                        <span class="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-gray-500">{option.label}</span>
                                    </div>
                                </button>
                            {/each}
                        </div>
                    </div>

                    <div class="mt-5 rounded-[24px] border border-white/70 bg-white/55 p-4 shadow-sm backdrop-blur-xl">
                        <p class="text-[11px] font-black uppercase tracking-[0.28em] text-gray-400">Export notes</p>
                        <ul class="mt-3 space-y-2 text-sm font-medium text-gray-500">
                            <li>• PNG exports a share card using the selected poster frame.</li>
                            <li>• GIF and video exports rotate through all media with smooth ease-in / ease-out motion.</li>
                            <li>• Video clips are previewed only for a few seconds in the export.</li>
                        </ul>
                    </div>

                    {#if exportMessage}
                        <div class="mt-4 rounded-[20px] border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 shadow-sm">
                            {exportMessage}
                        </div>
                    {/if}

                    <div class="mt-5 grid gap-2 sm:grid-cols-2">
                        <Button variant="secondary" class="w-full bg-white/70 border-white/80 backdrop-blur-xl" onclick={close} disabled={isExporting}>Cancel</Button>
                        <Button class="w-full shadow-[0_8px_20px_-8px_rgba(0,0,0,0.25)]" onclick={handleExport} isLoading={isExporting} disabled={!items.length}>
                            {exportButtonText()}
                        </Button>
                    </div>
                </aside>
            </div>
        </div>
    </div>
{/if}

<style>
    .hide-scrollbar::-webkit-scrollbar {
        display: none;
    }

    .hide-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }
</style>