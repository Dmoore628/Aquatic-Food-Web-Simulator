import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TrophicTierSummary, SpeciesId } from '../domain/models';
import { SimulationStateService } from '../services/simulation-state';

@Component({
  selector: 'app-trophic-pyramid',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <div class="bg-slate-950 rounded-xl border border-slate-800 p-4 flex flex-col gap-3">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <div class="flex items-center gap-2">
            <mat-icon class="text-cyan-400 text-lg">stacked_bar_chart</mat-icon>
            <h3 class="text-xs font-semibold text-slate-100 tracking-wide uppercase">
              Trophic Biomass Pyramid (Lindeman Structure)
            </h3>
          </div>
          <p class="text-xs text-slate-400 mt-0.5">
            Biomass distribution across trophic levels. In healthy marine ecosystems, lower tiers support higher tiers (~10% trophic transfer).
          </p>
        </div>

        <button
          type="button"
          (click)="sim.openConceptModal('trophic_cascade')"
          class="text-xs text-cyan-400 hover:underline flex items-center gap-0.5"
        >
          <span>Theory</span>
          <mat-icon class="text-xs">help_outline</mat-icon>
        </button>
      </div>

      <!-- Pyramid Tier Bars -->
      <div class="space-y-2.5 pt-1">
        @for (tier of tiers(); track tier.tier) {
          <div
            class="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors cursor-pointer"
            (click)="selectTier(tier)"
            tabindex="0"
            role="button"
            (keydown.enter)="selectTier(tier)"
            (keydown.space)="selectTier(tier)"
            [attr.aria-label]="tier.name + ' biomass ' + tier.totalBiomass"
          >
            <!-- Tier Meta Line -->
            <div class="flex items-center justify-between text-xs mb-1.5">
              <div class="flex items-center gap-2">
                <span class="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                  {{ tier.tier === 0 ? 'REC' : 'T' + tier.tier }}
                </span>
                <span class="font-semibold text-slate-200">{{ tier.name }}</span>
                <span class="text-[10px] text-slate-500 font-mono hidden sm:inline">
                  ({{ tier.speciesIds.length }} species)
                </span>
              </div>

              <!-- Biomass & Delta -->
              <div class="flex items-center gap-2 font-mono">
                <span class="text-slate-100 font-bold">{{ tier.totalBiomass.toFixed(1) }}</span>
                <span class="text-[10px]" [class]="tier.percentChange >= 0 ? 'text-emerald-400' : 'text-red-400'">
                  {{ tier.percentChange > 0 ? '+' : '' }}{{ tier.percentChange.toFixed(0) }}%
                </span>
                <span class="text-slate-500 text-[10px]">
                  ({{ (tier.fractionOfEcosystem * 100).toFixed(0) }}%)
                </span>
              </div>
            </div>

            <!-- Proportional Biomass Bar -->
            <div class="w-full h-2 rounded bg-slate-950 overflow-hidden border border-slate-800/60">
              <div
                class="h-full rounded transition-all duration-300"
                [style.width.%]="getBarWidth(tier)"
                [style.backgroundColor]="getTierColor(tier.tier)"
              ></div>
            </div>

            <!-- Species Tags -->
            <div class="flex flex-wrap gap-1 mt-1.5">
              @for (spId of tier.speciesIds; track spId) {
                <span
                  class="text-[9px] px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400"
                  [class.text-cyan-300]="isSpeciesHighlighted(spId)"
                >
                  {{ getSpeciesName(spId) }}: {{ sim.currentPopulations()[spId]?.toFixed(0) || 0 }}
                </span>
              }
            </div>
          </div>
        }
      </div>

      <!-- Trophic Energy Warning or Summary -->
      @if (pyramidInversionWarning(); as warn) {
        <div class="p-2.5 rounded-lg bg-amber-950/40 border border-amber-900/60 text-xs text-amber-200 flex items-start gap-2">
          <mat-icon class="text-amber-400 text-base shrink-0 mt-0.5">warning</mat-icon>
          <p class="leading-relaxed text-[11px]">
            {{ warn }}
          </p>
        </div>
      }
    </div>
  `
})
export class TrophicPyramidComponent {
  readonly sim = inject(SimulationStateService);

  readonly tiers = computed(() => this.sim.trophicTiers());

  readonly maxTierBiomass = computed(() => {
    const list = this.tiers();
    let max = 1;
    for (const t of list) {
      if (t.totalBiomass > max) max = t.totalBiomass;
    }
    return max;
  });

  getBarWidth(tier: TrophicTierSummary): number {
    const max = this.maxTierBiomass();
    return Math.max(4, Math.min(100, (tier.totalBiomass / max) * 100));
  }

  getTierColor(tierNum: number): string {
    switch (tierNum) {
      case 5: return '#ef4444'; // Red
      case 4: return '#eab308'; // Amber
      case 3: return '#38bdf8'; // Sky
      case 2: return '#06b6d4'; // Cyan
      case 1: return '#10b981'; // Emerald
      default: return '#84cc16'; // Lime
    }
  }

  getSpeciesName(id: SpeciesId): string {
    return this.sim.speciesMap().get(id)?.commonName || id;
  }

  isSpeciesHighlighted(id: SpeciesId): boolean {
    return this.sim.highlightedSpeciesIds().has(id);
  }

  selectTier(tier: TrophicTierSummary) {
    this.sim.highlightSpecies(tier.speciesIds);
  }

  readonly pyramidInversionWarning = computed(() => {
    const list = this.tiers();
    const apex = list.find((t) => t.tier === 5)?.totalBiomass || 0;
    const tertiary = list.find((t) => t.tier === 4)?.totalBiomass || 0;
    const secondary = list.find((t) => t.tier === 3)?.totalBiomass || 0;
    const primary = list.find((t) => t.tier === 1)?.totalBiomass || 0;

    if (tertiary > secondary * 1.5) {
      return 'Trophic Imbalance: Tertiary predator biomass exceeds secondary consumer biomass, creating severe top-down overgrazing pressure.';
    }
    if (primary < 60) {
      return 'Bottom-Up Scarcity: Primary producer base is depleted, unable to sustainably provide calories for upper consumers.';
    }
    if (apex < 5 && tertiary > 130) {
      return 'Apex Decoupling: Shark absence has allowed mesopredators to expand beyond normal ecosystem carrying capacity.';
    }
    return null;
  });
}
