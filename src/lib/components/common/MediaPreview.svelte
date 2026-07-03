<script lang="ts">
    import { isVideoMedia } from '$lib/utils/media';

    interface Props {
        src: string;
        alt?: string;
        mediaType?: string | null;
        class?: string;
        mediaClass?: string;
        loading?: 'lazy' | 'eager';
        controls?: boolean;
        autoplay?: boolean;
        muted?: boolean;
        loop?: boolean;
        playsInline?: boolean;
        showBadge?: boolean;
        stopClickPropagation?: boolean;
    }

    let {
        src,
        alt = '',
        mediaType = null,
        class: className = '',
        mediaClass = 'object-cover',
        loading = 'lazy',
        controls = false,
        autoplay = false,
        muted = false,
        loop = false,
        playsInline = true,
        showBadge = false,
        stopClickPropagation = false
    }: Props = $props();

    let isVideo = $derived(isVideoMedia(src, mediaType));
</script>

<div class={`relative h-full w-full ${className}`.trim()}>
    {#if isVideo}
        <video
            src={src}
            class={`h-full w-full ${mediaClass}`.trim()}
            {controls}
            {autoplay}
            {muted}
            {loop}
            playsinline={playsInline}
            preload={controls || autoplay ? 'auto' : 'metadata'}
            onclick={stopClickPropagation ? (event) => event.stopPropagation() : undefined}
        ></video>
    {:else}
        <img
            src={src}
            {alt}
            class={`h-full w-full ${mediaClass}`.trim()}
            {loading}
        />
    {/if}

    {#if showBadge && isVideo}
        <div class="pointer-events-none absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white shadow-lg backdrop-blur-md">
            <svg class="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
            </svg>
        </div>
    {/if}
</div>