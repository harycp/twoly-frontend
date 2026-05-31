class UIStore {
    isNavHidden = $state(false);

    partnerTouchBursts = $state<PartnerTouchBurst[]>([]);

    private touchBurstSeed = 0;

    registerPartnerTouch(posX: number, combo: number) {
        const burstCount = Math.min(4, 1 + Math.floor(Math.max(1, combo) / 3));
        const baseOffsetX = Math.max(-28, Math.min(28, (posX - 0.5) * 56));

        for (let index = 0; index < burstCount; index++) {
            const id = this.touchBurstSeed++;
            const spread = index * 7 - (burstCount - 1) * 3.5;
            const delayMs = index * 90;
            const scale = 0.85 + Math.min(combo, 12) * 0.04 + index * 0.08;

            this.partnerTouchBursts = [
                ...this.partnerTouchBursts,
                {
                    id,
                    offsetX: baseOffsetX + spread,
                    delayMs,
                    scale
                }
            ];

            setTimeout(() => {
                this.partnerTouchBursts = this.partnerTouchBursts.filter((burst) => burst.id !== id);
            }, 1800 + delayMs);
        }
    }

    clearPartnerTouchBursts() {
        this.partnerTouchBursts = [];
    }
}

export interface PartnerTouchBurst {
    id: number;
    offsetX: number;
    delayMs: number;
    scale: number;
}

export const uiStore = new UIStore();