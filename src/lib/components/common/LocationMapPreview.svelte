<script lang="ts">
    import { browser } from '$app/environment';

    type LeafletMap = {
        setView: (latlng: [number, number], zoom: number) => LeafletMap;
        remove: () => void;
    };

    type LeafletNamespace = {
        map: (element: HTMLElement, options?: Record<string, unknown>) => LeafletMap;
        tileLayer: (url: string, options?: Record<string, unknown>) => { addTo: (map: LeafletMap) => void };
        marker: (latlng: [number, number]) => { addTo: (map: LeafletMap) => void };
    };

    type WindowWithLeaflet = Window & { L?: LeafletNamespace };

    interface Props {
        latitude: number;
        longitude: number;
        locationName?: string;
    }
    let { latitude, longitude, locationName }: Props = $props();

    let mapElement = $state<HTMLElement | null>(null);
    let mapInstance: LeafletMap | null = null;

    $effect(() => {
        const leafletWindow = window as WindowWithLeaflet;

        if (browser && mapElement && leafletWindow.L && !mapInstance) {
            const L = leafletWindow.L;
            mapInstance = L.map(mapElement, {
                zoomControl: false,
                dragging: false,
                scrollWheelZoom: false,
                doubleClickZoom: false
            });
            mapInstance.setView([latitude, longitude], 15);
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '© OpenStreetMap'
            }).addTo(mapInstance!);
            
            L.marker([latitude, longitude]).addTo(mapInstance!);
        }

        return () => {
            if (mapInstance) {
                mapInstance.remove();
                mapInstance = null;
            }
        };
    });
</script>

<svelte:head>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
</svelte:head>

<div class="relative mt-2 w-full rounded-[24px] overflow-hidden shadow-[0_4px_20px_-8px_rgba(0,0,0,0.06)] border border-white/60 bg-white/40 p-2 backdrop-blur-xl">
    <div class="h-44 w-full rounded-[16px] z-0 overflow-hidden" bind:this={mapElement}></div>

    <div class="mt-3 flex items-center justify-between px-2 pb-1">
        <div class="flex-1 truncate pr-4">
            <span class="text-[13px] font-bold text-gray-800 tracking-tight truncate block">
                {locationName || 'Saved Location'}
            </span>
        </div>
        
        <a 
            href={`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`} 
            target="_blank" 
            rel="noopener noreferrer"
            class="flex shrink-0 items-center gap-1.5 rounded-full bg-gray-900 text-white px-4 py-2 text-[11px] font-black uppercase tracking-wider shadow-[0_4px_15px_-5px_rgba(0,0,0,0.3)] hover:bg-gray-800 hover:scale-105 active:scale-95 transition-all"
        >
            <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            Open in Maps
        </a>
    </div>
</div>