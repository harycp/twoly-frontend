<script lang="ts">
    import { createQuery } from '@tanstack/svelte-query';
    import { photoService } from '$lib/services/photo.service';
    import MediaPreview from '$lib/components/common/MediaPreview.svelte';
    import { isVideoMedia } from '$lib/utils/media';

    interface Props {
        memoryId: string;
        fallbackIndex: number;
    }

    let { memoryId, fallbackIndex }: Props = $props();

    const photosQuery = createQuery(() => ({
        queryKey: ['memory-photos', memoryId],
        queryFn: () => photoService.getPhotos(memoryId)
    }));

    let photos = $derived(photosQuery.data || []);
    let activeIndex = $state(0);

    $effect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (photos.length > 1) {
            interval = setInterval(() => {
                activeIndex = (activeIndex + 1) % photos.length;
            }, 3500);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    });
</script>

<div class="absolute inset-0 w-full h-full bg-gray-100 z-0">
    {#if photosQuery.isPending}
        <div class="absolute inset-0 bg-gray-200 animate-pulse"></div>
    {:else if photos.length === 0}
        <!-- FALLBACK GRADIENT (Jika belum ada foto) -->
        <div class="absolute inset-0 bg-linear-to-br transition-transform duration-1000 group-hover:scale-105
            {fallbackIndex % 3 === 0 ? 'from-[#FED7AA] to-[#F8B4C8]' : fallbackIndex % 3 === 1 ? 'from-[#DDD6FE] to-[#FDA4AF]' : 'from-[#F8B4C8] to-[#FFF7ED]'}">
        </div>
    {:else}
        <!-- SLIDESHOW FOTO PREMIUM DENGAN CROSSFADE -->
        {#each photos as photo, i (photo.id)}
            <div class="absolute inset-0 transition-opacity duration-1000 ease-in-out group-hover:scale-105 {i === activeIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}">
                <MediaPreview
                    src={photo.photo_url}
                    mediaType={photo.media_type}
                    alt="Memory Cover"
                    class="h-full w-full"
                    mediaClass="object-cover"
                    loading="lazy"
                    autoplay={isVideoMedia(photo.photo_url, photo.media_type) && i === activeIndex}
                    muted={isVideoMedia(photo.photo_url, photo.media_type)}
                    loop={isVideoMedia(photo.photo_url, photo.media_type)}
                    playsInline={true}
                />
            </div>
        {/each}
    {/if}
</div>