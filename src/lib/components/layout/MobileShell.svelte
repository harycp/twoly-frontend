<script lang="ts">
    import type { Snippet } from 'svelte';
    import BottomNavigation from './BottomNavigation.svelte';

    interface Props {
        children: Snippet;
    }

    let { children }: Props = $props();
</script>

<!-- Menggunakan background Warm Cream (orange-50) yang sangat soft -->
<div class="relative min-h-screen bg-[#FFF7ED] pb-32 selection:bg-rose-200">
    <!-- max-w-md untuk membatasi ukuran layar agar terasa seperti mobile app -->
    <div class="mx-auto max-w-md min-h-screen shadow-[0_0_40px_rgba(0,0,0,0.03)] bg-[#FFF7ED]">
        {@render children()}
    </div>
    
    <div class="mx-auto max-w-md">
        <BottomNavigation />
    </div>
</div>