import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CausalChainEvent, SpeciesId } from '../domain/models';
import { SimulationStateService } from '../services/simulation-state';

@Component({
  selector: 'app-causal-explanation',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4">
      <!-- Section Header -->
      <div class="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 class="text-sm font-bold text-slate-100 uppercase tracking-wide">
            Causal Chain: Why Did This Happen?
          </h3>
          <p class="text-xs text-slate-400 mt-0.5">
            Step-by-step biological explanation of how the disturbance propagated through the food web.
          </p>
        </div>

        @if (sim.highlightedSpeciesIds().size > 0) {
          <button
            type="button"
            (click)="sim.clearHighlights()"
            class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
          >
            Clear Highlight
          </button>
        }
      </div>

      <!-- Clean Domino Chain -->
      @if (events().length === 0) {
        <div class="py-10 px-4 text-center border border-dashed border-slate-800 rounded-xl">
          <p class="text-sm font-semibold text-slate-300">Ecosystem Is In Balance</p>
          <p class="text-xs text-slate-400 max-w-md mx-auto mt-1">
            No population shifts detected yet. Try clicking "Remove Shark" or modifying an organism above, then run the simulation.
          </p>
        </div>
      } @else {
        <div class="space-y-3">
          @for (event of events(); track event.id; let idx = $index) {
            <div
              class="p-4 rounded-xl border transition-all duration-200"
              [class]="isEventActive(event)
                ? 'bg-slate-950 border-cyan-500 shadow-md ring-1 ring-cyan-500/30'
                : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'"
            >
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <!-- Step Number & Headline -->
                <div class="flex items-center gap-3">
                  <span class="w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold bg-slate-800 text-cyan-300 shrink-0">
                    {{ idx + 1 }}
                  </span>

                  <span class="text-xs font-bold text-slate-100">
                    {{ event.headline }}
                  </span>
                </div>

                <!-- Delta Pill & Action -->
                <div class="flex items-center gap-2 self-start sm:self-center">
                  <span
                    class="font-mono text-xs font-bold px-2 py-0.5 rounded"
                    [class]="getDeltaColor(event)"
                  >
                    {{ event.direction === 'extinct' ? 'EXTIRPATED' : (event.percentChange > 0 ? '+' : '') + event.percentChange + '%' }}
                  </span>

                  <button
                    type="button"
                    (click)="highlightEventSpecies(event)"
                    class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-medium flex items-center gap-1 transition-colors"
                  >
                    <span>Focus in Web</span>
                    <mat-icon class="text-xs">visibility</mat-icon>
                  </button>
                </div>
              </div>

              <!-- Plain English Explanation -->
              <p class="text-xs text-slate-300 mt-2.5 ml-9 leading-relaxed">
                {{ event.explanation }}
              </p>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class CausalExplanationComponent {
  readonly sim = inject(SimulationStateService);

  readonly events = computed(() => this.sim.causalEvents());

  getSpeciesName(id: SpeciesId): string {
    return this.sim.speciesMap().get(id)?.commonName || id;
  }

  getDeltaColor(event: CausalChainEvent): string {
    if (event.direction === 'extinct') return 'bg-red-950 text-red-300 border border-red-800';
    if (event.direction === 'increased') return 'bg-emerald-950 text-emerald-300 border border-emerald-800';
    return 'bg-amber-950 text-amber-300 border border-amber-800';
  }

  isEventActive(event: CausalChainEvent): boolean {
    const highlights = this.sim.highlightedSpeciesIds();
    return highlights.has(event.targetSpeciesId) || (!!event.sourceSpeciesId && highlights.has(event.sourceSpeciesId));
  }

  highlightEventSpecies(event: CausalChainEvent) {
    const ids: SpeciesId[] = [event.targetSpeciesId];
    if (event.sourceSpeciesId) {
      ids.push(event.sourceSpeciesId);
    }
    this.sim.highlightSpecies(ids);
    this.sim.activeCausalEventId.set(event.id);
  }
}
