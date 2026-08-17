class UIStore {
	isNavHidden = $state(false);

	// milestone modal state (used by DoodleStreakRibbon)
	milestonePopupData = $state<{ milestone: number; at?: string } | null>(null);

	openMilestone(milestone: number) {
		this.milestonePopupData = { milestone, at: new Date().toISOString() };
	}

	closeMilestone() {
		this.milestonePopupData = null;
	}
}

export const uiStore = new UIStore();