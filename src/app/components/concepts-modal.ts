import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { EDUCATIONAL_CONCEPTS } from '../data/ecosystem-data';
import { EducationalConcept } from '../domain/models';
import { SimulationStateService } from '../services/simulation-state';

@Component({
  selector: 'app-concepts-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    @if (sim.showConceptsModal()) {
      <div
        class="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 backdrop-blur-none"
        role="dialog"
        aria-modal="true"
        aria-label="Aquatic ecology and mathematical modeling principles"
      >
        <!-- Accessible Backdrop Button -->
        <button
          type="button"
          class="fixed inset-0 bg-slate-950/80 w-full h-full cursor-default -z-10"
          (click)="close()"
          aria-label="Close modal backdrop"
        ></button>

        <div
          class="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[88vh] relative z-10"
        >
          <!-- Modal Header -->
          <div class="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
            <div class="flex items-center gap-2.5">
              <mat-icon class="text-cyan-400">school</mat-icon>
              <div>
                <h3 class="text-sm font-bold text-slate-100 uppercase tracking-wide">
                  Aquatic Ecology & Mathematical Modeling Principles
                </h3>
                <p class="text-xs text-slate-400">
                  Theoretical foundations governing this food-web simulation
                </p>
              </div>
            </div>

            <button
              type="button"
              (click)="close()"
              class="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 flex items-center justify-center transition-colors"
              aria-label="Close modal"
            >
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <!-- Body with Sidebar Tabs and Content -->
          <div class="flex-1 flex flex-col md:flex-row overflow-hidden">
            <!-- Sidebar Navigation -->
            <div class="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-950/50 p-2 overflow-y-auto flex md:flex-col gap-1">
              @for (concept of concepts; track concept.id) {
                <button
                  type="button"
                  (click)="selectConcept(concept.id)"
                  [class]="selectedConceptId() === concept.id
                    ? 'w-full text-left px-3 py-2 rounded-lg bg-cyan-950 text-cyan-200 border border-cyan-800/80 font-medium text-xs transition-colors'
                    : 'w-full text-left px-3 py-2 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-slate-200 text-xs transition-colors'"
                >
                  <span class="block font-semibold truncate">{{ concept.title }}</span>
                  <span class="text-[10px] opacity-75 font-mono">{{ concept.category }}</span>
                </button>
              }
            </div>

            <!-- Content Area -->
            <div class="flex-1 p-5 overflow-y-auto space-y-4">
              @if (activeConcept(); as c) {
                <div>
                  <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 uppercase">
                    {{ c.category }}
                  </span>
                  <h4 class="text-base font-bold text-slate-100 mt-1">
                    {{ c.title }}
                  </h4>
                </div>

                <!-- Executive Summary -->
                <div class="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span class="text-[10px] uppercase font-mono text-slate-400 block mb-1">
                    Core Biological Concept
                  </span>
                  <p class="text-xs text-slate-200 leading-relaxed">
                    {{ c.summary }}
                  </p>
                </div>

                <!-- Biological Mechanism -->
                <div>
                  <h5 class="text-xs font-bold text-slate-300 uppercase tracking-wide mb-1">
                    Underlying Mechanism
                  </h5>
                  <p class="text-xs text-slate-300 leading-relaxed">
                    {{ c.mechanism }}
                  </p>
                </div>

                <!-- Aquatic Case Study -->
                <div class="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <h5 class="text-xs font-bold text-emerald-400 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                    <mat-icon class="text-sm">waves</mat-icon>
                    <span>Real-World Marine Case Study</span>
                  </h5>
                  <p class="text-xs text-slate-300 leading-relaxed">
                    {{ c.aquaticExample }}
                  </p>
                </div>

                <!-- How It Works in this Simulator -->
                <div class="p-3 rounded-lg bg-cyan-950/40 border border-cyan-900/60">
                  <h5 class="text-xs font-bold text-cyan-300 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                    <mat-icon class="text-sm">tune</mat-icon>
                    <span>Simulation Engine Manifestation</span>
                  </h5>
                  <p class="text-xs text-slate-300 leading-relaxed">
                    {{ c.simulatorRelevance }}
                  </p>
                </div>
              }
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="px-5 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
            <span>Primary literature: Myers et al. (Science 2007), ICES, NOAA Fisheries</span>
            <button
              type="button"
              (click)="close()"
              class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class ConceptsModalComponent {
  readonly sim = inject(SimulationStateService);

  readonly concepts = EDUCATIONAL_CONCEPTS;

  readonly selectedConceptId = computed(() => {
    return this.sim.activeConceptId() || this.concepts[0].id;
  });

  readonly activeConcept = computed<EducationalConcept>(() => {
    const id = this.selectedConceptId();
    return this.concepts.find((c) => c.id === id) || this.concepts[0];
  });

  selectConcept(id: string) {
    this.sim.activeConceptId.set(id);
  }

  close() {
    this.sim.closeConceptModal();
  }
}
