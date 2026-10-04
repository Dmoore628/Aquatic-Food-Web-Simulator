import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { SpeciesId } from '../domain/models';
import { SimulationStateService } from '../services/simulation-state';

@Component({
  selector: 'app-species-drawer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    @if (species(); as sp) {
      <div
        class="fixed inset-0 z-50 overflow-hidden flex justify-end"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="sp.commonName + ' biological dossier'"
      >
        <!-- Accessible Backdrop Button -->
        <button
          type="button"
          class="fixed inset-0 bg-slate-950/70 w-full h-full cursor-default -z-10"
          (click)="close()"
          aria-label="Close dossier backdrop"
        ></button>

        <div
          class="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full overflow-y-auto p-5 flex flex-col gap-4 shadow-2xl relative z-10"
        >
          <!-- Drawer Header -->
          <div class="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-full" [style.backgroundColor]="sp.color"></span>
                <h3 class="text-base font-bold text-slate-100">
                  {{ sp.commonName }}
                </h3>
              </div>
              <p class="text-xs text-slate-400 italic font-mono mt-0.5">
                {{ sp.scientificName }}
              </p>
            </div>

            <button
              type="button"
              (click)="close()"
              class="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 flex items-center justify-center transition-colors"
              aria-label="Close dossier"
            >
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <!-- Trophic Badge & Health -->
          <div class="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
            <div>
              <span class="text-slate-500 block text-[10px] uppercase font-mono">Trophic Category</span>
              <span class="font-semibold text-slate-200 capitalize">
                {{ sp.trophicCategory.replace('_', ' ') }}
              </span>
            </div>
            <div class="text-right">
              <span class="text-slate-500 block text-[10px] uppercase font-mono">Trophic Level</span>
              <span class="font-mono font-bold text-cyan-400 text-sm">
                {{ sp.trophicLevel.toFixed(1) }}
              </span>
            </div>
          </div>

          <!-- Live Population Status -->
          <div class="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
            <div class="flex items-center justify-between text-xs">
              <span class="text-slate-400 font-medium">Current Normalized Population:</span>
              <span class="font-mono font-bold text-sm" [class]="currentPop() === 0 ? 'text-red-400' : 'text-slate-100'">
                {{ currentPop().toFixed(1) }} / {{ sp.carryingCapacity }}
              </span>
            </div>

            <!-- Progress / Capacity Gauge Bar -->
            <div class="w-full h-2 rounded bg-slate-800 overflow-hidden">
              <div
                class="h-full transition-all duration-300 rounded"
                [style.width.%]="capacityPercent()"
                [style.backgroundColor]="sp.color"
              ></div>
            </div>

            <!-- Flux breakdown in simulation -->
            @if (currentRecord(); as rec) {
              <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[10px] font-mono">
                <div>
                  <span class="text-slate-500 block">GROWTH TERM:</span>
                  <span class="text-emerald-400">+{{ rec.growthTerms[sp.id] || 0 }} / step</span>
                </div>
                <div>
                  <span class="text-slate-500 block">PREDATION LOSS:</span>
                  <span class="text-rose-400">-{{ rec.predationLosses[sp.id] || 0 }} / step</span>
                </div>
                <div>
                  <span class="text-slate-500 block">NATURAL MORTALITY:</span>
                  <span class="text-amber-400">-{{ rec.mortalityLosses[sp.id] || 0 }} / step</span>
                </div>
                <div>
                  <span class="text-slate-500 block">HARVEST LOSS:</span>
                  <span class="text-orange-400">-{{ rec.fishingLosses[sp.id] || 0 }} / step</span>
                </div>
              </div>
            }
          </div>

          <!-- Quick Population Controls -->
          <div class="flex items-center gap-2">
            @if (currentPop() > 0) {
              <button
                type="button"
                (click)="sim.removeSpecies(sp.id)"
                class="flex-1 py-1.5 px-3 rounded-lg bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-800 text-xs font-medium flex items-center justify-center gap-1 transition-colors"
              >
                <mat-icon class="text-sm">delete</mat-icon>
                <span>Extirpate (Set to 0)</span>
              </button>
            } @else {
              <button
                type="button"
                (click)="sim.restoreSpecies(sp.id)"
                class="flex-1 py-1.5 px-3 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 border border-emerald-800 text-xs font-medium flex items-center justify-center gap-1 transition-colors"
              >
                <mat-icon class="text-sm">restart_alt</mat-icon>
                <span>Restore to Baseline</span>
              </button>
            }
            <button
              type="button"
              (click)="sim.setSpeciesPopulation(sp.id, Math.min(250, currentPop() + 40))"
              class="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors"
              title="Add 40 units"
            >
              +40 Units
            </button>
          </div>

          <!-- Ecological Role & Habitat -->
          <div class="space-y-2 text-xs">
            <div>
              <h4 class="font-semibold text-slate-200 uppercase text-[11px] tracking-wide mb-1">
                Ecological Role
              </h4>
              <p class="text-slate-300 leading-relaxed bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                {{ sp.ecologicalRole }}
              </p>
            </div>

            <div>
              <h4 class="font-semibold text-slate-200 uppercase text-[11px] tracking-wide mb-1">
                Habitat & Niche
              </h4>
              <p class="text-slate-300 leading-relaxed bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                {{ sp.habitat }}
              </p>
            </div>
          </div>

          <!-- Trophic Feeding Network -->
          <div class="space-y-2 text-xs">
            <h4 class="font-semibold text-slate-200 uppercase text-[11px] tracking-wide">
              Feeding Links
            </h4>

            <!-- Prey list -->
            <div class="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1.5">
              <span class="text-emerald-400 font-semibold block text-[10px] uppercase font-mono">
                Consumes (Prey):
              </span>
              @if (sp.preyIds.length === 0) {
                <span class="text-slate-500 italic">None (Primary Producer / Autotroph)</span>
              } @else {
                <div class="flex flex-wrap gap-1.5">
                  @for (preyId of sp.preyIds; track preyId) {
                    <button
                      type="button"
                      (click)="jumpToSpecies(preyId)"
                      class="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs flex items-center gap-1"
                    >
                      <span>{{ getSpeciesName(preyId) }}</span>
                      <mat-icon class="text-xs text-slate-400">arrow_forward</mat-icon>
                    </button>
                  }
                </div>
              }
            </div>

            <!-- Predator list -->
            <div class="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1.5">
              <span class="text-rose-400 font-semibold block text-[10px] uppercase font-mono">
                Consumed By (Predators):
              </span>
              @if (sp.predatorIds.length === 0) {
                <span class="text-slate-500 italic">None (Apex Predator)</span>
              } @else {
                <div class="flex flex-wrap gap-1.5">
                  @for (predId of sp.predatorIds; track predId) {
                    <button
                      type="button"
                      (click)="jumpToSpecies(predId)"
                      class="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs flex items-center gap-1"
                    >
                      <span>{{ getSpeciesName(predId) }}</span>
                      <mat-icon class="text-xs text-slate-400">arrow_forward</mat-icon>
                    </button>
                  }
                </div>
              }
            </div>
          </div>

          <!-- Natural History / Biological Facts -->
          <div class="space-y-1.5 text-xs">
            <h4 class="font-semibold text-slate-200 uppercase text-[11px] tracking-wide">
              Documented Biological Facts
            </h4>
            <ul class="space-y-1.5 bg-slate-950 p-3 rounded-lg border border-slate-800 list-disc list-inside text-slate-300">
              @for (fact of sp.biologicalFacts; track fact) {
                <li class="leading-relaxed">{{ fact }}</li>
              }
            </ul>
          </div>

          <!-- Model Parameters -->
          <div class="space-y-1.5 text-xs">
            <h4 class="font-semibold text-slate-200 uppercase text-[11px] tracking-wide">
              Model Parameters
            </h4>
            <div class="grid grid-cols-2 gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px]">
              <div>
                <span class="text-slate-500 block text-[9px]">GROWTH RATE (r):</span>
                <span class="text-slate-200 font-bold">{{ sp.growthRate }}</span>
              </div>
              <div>
                <span class="text-slate-500 block text-[9px]">CARRYING CAP (K):</span>
                <span class="text-slate-200 font-bold">{{ sp.carryingCapacity }}</span>
              </div>
              <div>
                <span class="text-slate-500 block text-[9px]">MORTALITY (m):</span>
                <span class="text-slate-200 font-bold">{{ sp.baselineMortality }}</span>
              </div>
              <div>
                <span class="text-slate-500 block text-[9px]">HARVEST VULN:</span>
                <span class="text-slate-200 font-bold">{{ (sp.fishingVulnerability * 100).toFixed(0) }}%</span>
              </div>
            </div>
          </div>

          <!-- Scientific Citations & Sources -->
          <div class="space-y-1.5 text-xs pb-4">
            <h4 class="font-semibold text-slate-200 uppercase text-[11px] tracking-wide">
              Scientific Sources
            </h4>
            <div class="space-y-2">
              @for (src of sp.sources; track src.title) {
                <div class="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px]">
                  <p class="font-semibold text-slate-200">{{ src.title }}</p>
                  <p class="text-slate-400 mt-0.5">
                    {{ src.institution }}{{ src.year ? ' (' + src.year + ')' : '' }}
                  </p>
                  @if (src.notes) {
                    <p class="text-slate-500 text-[10px] mt-1">{{ src.notes }}</p>
                  }
                  @if (src.url) {
                    <a
                      [href]="src.url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-cyan-400 hover:underline text-[10px] inline-flex items-center gap-0.5 mt-1"
                    >
                      <span>Agency Record</span>
                      <mat-icon class="text-xs">open_in_new</mat-icon>
                    </a>
                  }
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    }
  `
})
export class SpeciesDrawerComponent {
  readonly sim = inject(SimulationStateService);

  readonly Math = Math;

  readonly species = computed(() => this.sim.selectedSpecies());
  readonly currentRecord = computed(() => this.sim.currentRecord());

  readonly currentPop = computed(() => {
    const sp = this.species();
    if (!sp) return 0;
    return this.sim.currentPopulations()[sp.id] ?? 0;
  });

  readonly capacityPercent = computed(() => {
    const sp = this.species();
    if (!sp || sp.carryingCapacity === 0) return 0;
    const pop = this.currentPop();
    return Math.min(100, Math.max(0, (pop / sp.carryingCapacity) * 100));
  });

  close() {
    this.sim.selectSpecies(null);
  }

  jumpToSpecies(id: SpeciesId) {
    this.sim.selectSpecies(id);
  }

  getSpeciesName(id: SpeciesId): string {
    return this.sim.speciesMap().get(id)?.commonName || id;
  }
}
