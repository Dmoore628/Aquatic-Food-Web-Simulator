import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CausalChainEvent, SpeciesId } from '../domain/models';
import { SimulationStateService } from '../services/simulation-state';

@Component({
  selector: 'app-causal-explanation',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <div class="bg-slate-950 rounded-xl border border-slate-800 p-4 flex flex-col gap-3">
      <!-- Section Header -->
      <div class="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <div class="flex items-center gap-2">
            <mat-icon class="text-cyan-400 text-lg">schema</mat-icon>
            <h3 class="text-xs font-semibold text-slate-100 tracking-wide uppercase">
              Causal Cascade Inspector
            </h3>
            <span class="text-xs font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300">
              {{ events().length }} Events Detected
            </span>
          </div>
          <p class="text-xs text-slate-400 mt-0.5">
            Dynamic graph traversal tracing how disturbances propagate through feeding connections.
          </p>
        </div>

        @if (sim.highlightedSpeciesIds().size > 0) {
          <button
            type="button"
            (click)="sim.clearHighlights()"
            class="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs border border-slate-800 transition-colors"
          >
            Clear Highlights
          </button>
        }
      </div>

      <!-- Events List or Empty State -->
      @if (events().length === 0) {
        <div class="py-8 px-4 text-center border border-dashed border-slate-800 rounded-lg">
          <mat-icon class="text-slate-600 text-3xl mb-1">balance</mat-icon>
          <h4 class="text-xs font-semibold text-slate-300">Ecosystem In Equilibrium</h4>
          <p class="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            No significant population shifts (&ge;15%) detected yet. Modify a species population or run the simulation to observe trophic cascades.
          </p>
        </div>
      } @else {
        <div class="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
          @for (event of events(); track event.id; let idx = $index) {
            <div
              class="p-3 rounded-lg border transition-all duration-200"
              [class]="getCardClass(event)"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="flex items-center gap-2">
                  <!-- Step Sequence Number -->
                  <span class="w-5 h-5 rounded flex items-center justify-center font-mono text-[10px] font-bold bg-slate-900 border border-slate-700 text-slate-300">
                    {{ idx + 1 }}
                  </span>

                  <!-- Relationship Badge -->
                  <span
                    class="text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold"
                    [class]="getBadgeClass(event.relationship)"
                  >
                    {{ formatRelationship(event.relationship) }}
                  </span>

                  <!-- Observed Step -->
                  <span class="text-[10px] font-mono text-slate-400">
                    Observed at t={{ event.stepObserved }}
                  </span>
                </div>

                <!-- Percent delta indicator -->
                <div class="flex items-center gap-1 font-mono text-xs font-bold" [class]="getDeltaColor(event)">
                  @if (event.direction === 'extinct') {
                    <span>EXTIRPATED (-100%)</span>
                  } @else {
                    <span>{{ event.percentChange > 0 ? '+' : '' }}{{ event.percentChange }}%</span>
                  }
                </div>
              </div>

              <!-- Headline -->
              <h4 class="text-xs font-bold text-slate-100 mt-2">
                {{ event.headline }}
              </h4>

              <!-- Causal Biological Explanation -->
              <p class="text-xs text-slate-300 mt-1 leading-relaxed">
                {{ event.explanation }}
              </p>

              <!-- Footer with interactive highlight trigger -->
              <div class="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-800/80">
                <div class="flex items-center gap-2 text-[10px] text-slate-400">
                  @if (event.sourceSpeciesId; as src) {
                    <span>Origin: <strong class="text-slate-300">{{ getSpeciesName(src) }}</strong></span>
                    <span>&rarr;</span>
                  }
                  <span>Target: <strong class="text-slate-300">{{ getSpeciesName(event.targetSpeciesId) }}</strong></span>
                </div>

                <button
                  type="button"
                  (click)="highlightEventSpecies(event)"
                  class="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 text-[10px] flex items-center gap-1 transition-colors"
                  title="Highlight this causal connection in the food web diagram"
                >
                  <mat-icon class="text-xs">visibility</mat-icon>
                  <span>Highlight in Web</span>
                </button>
              </div>
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

  formatRelationship(rel: string): string {
    switch (rel) {
      case 'direct_perturbation': return 'Direct Intervention';
      case 'mesopredator_release': return 'Mesopredator Release';
      case 'predation_release': return 'Predation Release';
      case 'overgrazing': return 'Top-Down Overgrazing';
      case 'predator_starvation': return 'Bottom-Up Food Scarcity';
      case 'environmental_stress': return 'Abiotic Thermal Shock';
      case 'nutrient_limitation': return 'Nutrient Restriction';
      default: return rel.replace(/_/g, ' ');
    }
  }

  getBadgeClass(rel: string): string {
    switch (rel) {
      case 'direct_perturbation':
        return 'bg-purple-950 text-purple-300 border border-purple-800';
      case 'mesopredator_release':
        return 'bg-amber-950 text-amber-300 border border-amber-800';
      case 'predation_release':
        return 'bg-emerald-950 text-emerald-300 border border-emerald-800';
      case 'overgrazing':
      case 'predator_starvation':
        return 'bg-rose-950 text-rose-300 border border-rose-800';
      case 'environmental_stress':
      case 'nutrient_limitation':
        return 'bg-sky-950 text-sky-300 border border-sky-800';
      default:
        return 'bg-slate-800 text-slate-300 border border-slate-700';
    }
  }

  getCardClass(event: CausalChainEvent): string {
    if (this.isEventActive(event)) {
      return 'bg-slate-900 border-cyan-500 shadow-md';
    }
    if (event.severity === 'critical') {
      return 'bg-slate-950/80 border-red-900/60 hover:border-red-700/80';
    }
    return 'bg-slate-950/80 border-slate-800 hover:border-slate-700';
  }

  getDeltaColor(event: CausalChainEvent): string {
    if (event.direction === 'extinct') return 'text-red-400';
    if (event.direction === 'increased') return 'text-emerald-400';
    return 'text-amber-400';
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
