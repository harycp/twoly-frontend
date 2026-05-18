<script lang="ts">
    interface Props {
        isConnected: boolean;
        onInteraction: (event: MouseEvent | TouchEvent) => void;
    }

    let { isConnected, onInteraction }: Props = $props();
</script>

<button 
    type="button"
    aria-label="Send touch to partner"
    onmousedown={onInteraction}
    ontouchstart={onInteraction}
    disabled={!isConnected}
    class="relative group outline-none focus:outline-none disabled:opacity-30 disabled:cursor-not-allowed z-30 touch-none"
>
    <div class="absolute inset-0 bg-rose-500 rounded-full blur-[60px] opacity-10 transition-opacity duration-500 group-hover:opacity-30 group-active:opacity-70"></div>

    <div class="relative flex h-56 w-56 items-center justify-center rounded-full bg-gradient-to-br from-white/10 to-transparent backdrop-blur-[30px] border border-white/20 shadow-[inset_0_-20px_40px_rgba(0,0,0,0.5),0_20px_50px_-10px_rgba(0,0,0,0.8)] transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-active:scale-[0.85] group-active:shadow-[inset_0_-5px_20px_rgba(0,0,0,0.6),0_10px_20px_-10px_rgba(0,0,0,0.7)]">

        <div class="absolute inset-2 rounded-full border-t border-white/30 pointer-events-none"></div>

        <svg class="h-28 w-28 text-white/90 drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)] transition-transform duration-200 group-active:scale-95" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
        </svg>
    </div>
</button>