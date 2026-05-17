<script lang="ts">
    import Button from '$lib/components/common/Button.svelte';
    import AlertDialog from '$lib/components/common/AlertDialog.svelte';

    interface Props {
        label?: string;
        dialogTitle?: string;
        dialogMessage?: string;
        onDelete: () => Promise<void> | void;
        class?: string;
    }

    let {
        label = 'Delete',
        dialogTitle = 'Are you sure?',
        dialogMessage = 'This action cannot be undone.',
        onDelete,
        class: className = ''
    }: Props = $props();

    let isDialogOpen = $state(false);
    let isDeleting = $state(false);

    async function handleConfirmDelete() {
        isDeleting = true;
        try {
            await onDelete();
        } finally {
            isDeleting = false;
        }
    }
</script>

<Button variant="ghost" class="w-full text-red-500 hover:text-red-600 hover:bg-red-50 {className}" onclick={() => isDialogOpen = true} isLoading={isDeleting}>
    <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
    {label}
</Button>

<AlertDialog 
    bind:isOpen={isDialogOpen}
    title={dialogTitle}
    message={dialogMessage}
    confirmText="Delete"
    cancelText="Cancel"
    isDestructive={true}
    onConfirm={handleConfirmDelete}
/>