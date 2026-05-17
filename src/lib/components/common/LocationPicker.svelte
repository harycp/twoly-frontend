<script lang="ts">
    import { browser } from '$app/environment';

    interface Props {
        locationName?: string;
        latitude?: number | undefined;
        longitude?: number | undefined;
    }

    let {
        locationName = $bindable(''),
        latitude = $bindable(undefined),
        longitude = $bindable(undefined)
    }: Props = $props();

    let isLocating = $state(false);
    let isSearching = $state(false);
    let locationError = $state('');

    let mapElement = $state<HTMLElement | null>(null);
    let mapInstance: any = null;
    let markerInstance: any = null;

    async function searchLocation() {
        if (!locationName.trim()) return;
        
        isSearching = true;
        locationError = '';
        
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}&limit=1`);
            const data = await res.json();
            
            if (data && data.length > 0) {
                latitude = parseFloat(data[0].lat);
                longitude = parseFloat(data[0].lon);
                updateMapPosition(latitude, longitude, true);
            } else {
                locationError = "Location not found. Please pinpoint manually on the map.";
            }
        } catch (err) {
            locationError = "Search failed. Check your connection.";
        } finally {
            isSearching = false;
        }
    }

    async function handleGetLocation() {
        if (!navigator.geolocation) {
            locationError = "Geolocation is not supported by your browser.";
            return;
        }

        isLocating = true;
        locationError = '';

        navigator.geolocation.getCurrentPosition(
            (position) => {
                latitude = parseFloat(position.coords.latitude.toFixed(6));
                longitude = parseFloat(position.coords.longitude.toFixed(6));
                updateMapPosition(latitude, longitude, true);
                isLocating = false;
            },
            (error) => {
                isLocating = false;
                locationError = "Please allow location access to use this feature.";
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }

    function updateMapPosition(lat: number, lng: number, recenter: boolean = false) {
        if (!mapInstance || !(window as any).L) return;
        
        const L = (window as any).L;
        const latlng = [lat, lng];

        if (recenter) mapInstance.setView(latlng, 15);

        if (markerInstance) {
            markerInstance.setLatLng(latlng);
        } else {
            markerInstance = L.marker(latlng, { draggable: true }).addTo(mapInstance);
            
            markerInstance.on('dragend', function(e: any) {
                const pos = e.target.getLatLng();
                latitude = parseFloat(pos.lat.toFixed(6));
                longitude = parseFloat(pos.lng.toFixed(6));
            });
        }
    }

    $effect(() => {
        if (browser && mapElement && (window as any).L && !mapInstance) {
            const L = (window as any).L;
            const initialLat = latitude || -6.200000; 
            const initialLng = longitude || 106.816666;

            mapInstance = L.map(mapElement).setView([initialLat, initialLng], 13);
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '© OpenStreetMap'
            }).addTo(mapInstance);

            if (latitude && longitude) {
                updateMapPosition(latitude, longitude, true);
            }

            mapInstance.on('click', (e: any) => {
                latitude = parseFloat(e.latlng.lat.toFixed(6));
                longitude = parseFloat(e.latlng.lng.toFixed(6));
                updateMapPosition(latitude, longitude, false);
            });
        }

        return () => {
            if (mapInstance) {
                mapInstance.remove();
                mapInstance = null;
                markerInstance = null;
            }
        };
    });
</script>

<svelte:head>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
</svelte:head>

<div class="flex flex-col gap-4 w-full">
    <!-- SEARCH BAR PINTAR -->
    <div class="flex flex-col gap-2 w-full">
        <label for="locationSearch" class="text-[12px] font-black text-gray-500 uppercase tracking-widest ml-1">Search Location</label>
        <div class="relative flex items-center">
            <input
                id="locationSearch"
                type="text"
                placeholder="e.g. The Rooftop Cafe, Jakarta"
                bind:value={locationName}
                onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), searchLocation())}
                class="h-14 w-full rounded-2xl border border-white/60 bg-white/40 backdrop-blur-xl pl-5 pr-14 text-base font-semibold text-gray-900 transition-all duration-300 placeholder:text-gray-400 focus:border-[#FDA4AF] focus:bg-white/70 focus:outline-none focus:ring-4 focus:ring-[#FDA4AF]/15 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.03)]"
            />
            <button
                type="button"
                onclick={searchLocation}
                disabled={isSearching}
                class="absolute right-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900 text-white shadow-sm hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-70"
            >
                {#if isSearching}
                    <svg class="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                {:else}
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                {/if}
            </button>
        </div>
        {#if locationError}
            <span class="text-[11px] font-bold text-red-500 ml-1 mt-1">{locationError}</span>
        {/if}
    </div>

    <!-- PETA INTERAKTIF (Bisa digeser, di-drag, diklik) -->
    <div class="relative w-full rounded-[24px] border border-white/60 bg-white/40 backdrop-blur-xl p-2 shadow-[0_4px_15px_-5px_rgba(0,0,0,0.02)]">
        <div class="h-56 w-full rounded-[18px] z-0 overflow-hidden relative" bind:this={mapElement}></div>
        
        <div class="mt-3 flex items-center justify-between px-2 pb-1">
            <div class="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest {latitude && longitude ? 'text-[#FDA4AF]' : 'text-gray-400'}">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                {latitude && longitude ? 'Pin set. Drag to adjust.' : 'Map Preview'}
            </div>
            
            <button 
                type="button" 
                onclick={handleGetLocation} 
                disabled={isLocating}
                class="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-gray-700 shadow-sm hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-70 border border-gray-100"
            >
                <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
                Use GPS
            </button>
        </div>
    </div>
</div>