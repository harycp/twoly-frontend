<script lang="ts">
    interface Props {
        checked?: boolean;
        disabled?: boolean;
        size?: 'sm' | 'md' | 'lg';
        onchange?: (checked: boolean) => void;
        class?: string;
    }

    let {
        checked = $bindable(false),
        disabled = false,
        size = 'md',
        onchange,
        class: className = ''
    }: Props = $props();

    function toggle() {
        if (disabled) return;
        checked = !checked;
        if (onchange) onchange(checked);
    }
</script>

<button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label="Toggle setting"
    {disabled}
    onclick={toggle}
    class="relative inline-flex shrink-0 cursor-pointer items-center rounded-full p-1 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#FDA4AF]/40 transition-colors duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)]
        {checked ? 'bg-[#F8B4C8] shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]' : 'bg-gray-200 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]'}
        {size === 'sm' ? 'h-7 w-12' : size === 'md' ? 'h-8 w-14' : 'h-10 w-20'}
        {disabled ? 'opacity-50 cursor-not-allowed grayscale' : ''} 
        {className}"
>
    <!-- 
      Tombol Bulat (Thumb) Bubbly:
      - Class translate ditulis eksplisit agar tidak dihapus oleh Tailwind Purge.
      - Transisi cubic-bezier untuk efek pantulan pegas (bouncy).
    -->
    <span
        class="relative flex items-center justify-center rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.15)] transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
            {size === 'sm' ? 'h-5 w-5' : size === 'md' ? 'h-6 w-6' : 'h-8 w-8'}
            {checked ? (size === 'sm' ? 'translate-x-5' : size === 'md' ? 'translate-x-6' : 'translate-x-10') : 'translate-x-0'}"
    >
        <!-- Ikon Hati Rahasia yang mekar (muncul) saat posisi ON -->
        <svg 
            class="transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] text-[#FDA4AF] 
                {checked ? 'scale-100 opacity-100' : 'scale-0 opacity-0'} 
                {size === 'sm' ? 'h-3.5 w-3.5' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5'}" 
            fill="currentColor" 
            viewBox="0 0 24 24"
        >
            <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
        </svg>
    </span>
</button>