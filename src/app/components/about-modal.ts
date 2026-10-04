import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { SimulationStateService } from '../services/simulation-state';

@Component({
  selector: 'app-about-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    @if (sim.showAboutModal()) {
      <div
        class="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 backdrop-blur-none"
        role="dialog"
        aria-modal="true"
        aria-label="About this project and scientific sources"
      >
        <!-- Accessible Backdrop Button -->
        <button
          type="button"
          class="fixed inset-0 bg-slate-950/80 w-full h-full cursor-default -z-10"
          (click)="close()"
          aria-label="Close modal backdrop"
        ></button>

        <div
          class="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] relative z-10"
        >
          <!-- Header -->
          <div class="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
            <div class="flex items-center gap-2">
              <mat-icon class="text-cyan-400">info</mat-icon>
              <h3 class="text-sm font-bold text-slate-100 uppercase tracking-wide">
                About This Project & Scientific Sources
              </h3>
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

          <!-- Body -->
          <div class="p-6 overflow-y-auto space-y-5 text-xs text-slate-300 leading-relaxed">
            <!-- Why I Built It -->
            <div>
              <h4 class="text-xs font-bold uppercase tracking-wider text-slate-100 mb-1.5 flex items-center gap-1.5">
                <mat-icon class="text-cyan-400 text-sm">flag</mat-icon>
                <span>Why I Built It</span>
              </h4>
              <p class="bg-slate-950 p-3.5 rounded-lg border border-slate-800 text-slate-200">
                I wanted to explore how interconnected aquatic ecosystems are and use computer science to build an interactive, hands-on environment where anyone can experiment with ecological relationships. Rather than reading static food-chain diagrams in a textbook, this simulator lets you disrupt one node and trace the real-time causal consequences as they ripple across trophic tiers.
              </p>
            </div>

            <!-- What I Learned -->
            <div>
              <h4 class="text-xs font-bold uppercase tracking-wider text-slate-100 mb-1.5 flex items-center gap-1.5">
                <mat-icon class="text-emerald-400 text-sm">psychology</mat-icon>
                <span>What I Learned</span>
              </h4>
              <div class="space-y-2 bg-slate-950 p-3.5 rounded-lg border border-slate-800 text-slate-300">
                <p>
                  <strong>Trophic cascades are non-linear:</strong> Removing an apex predator does not simply "reduce predators"; it releases mid-tier mesopredators, which in turn causes dramatic suppression of foundational forage fish and benthic filter-feeders.
                </p>
                <p>
                  <strong>Holling Type II saturation matters:</strong> Predator intake does not increase linearly to infinity. Incorporating prey handling time and saturating functional responses creates natural ecosystem resilience and prevents chaotic boom-and-bust cycles.
                </p>
                <p>
                  <strong>Decomposers close the loop:</strong> Without microbial remineralization returning biomass back to inorganic nitrates and phosphates, surface phytoplankton cannot sustain continuous primary production.
                </p>
              </div>
            </div>

            <!-- Important Limitations -->
            <div>
              <h4 class="text-xs font-bold uppercase tracking-wider text-rose-300 mb-1.5 flex items-center gap-1.5">
                <mat-icon class="text-rose-400 text-sm">warning</mat-icon>
                <span>Important Limitations & Model Assumptions</span>
              </h4>
              <div class="p-3.5 rounded-lg bg-rose-950/30 border border-rose-900/60 text-slate-300 space-y-1.5">
                <p>
                  <strong>Educational model, not predictive stock assessment:</strong> All population values are normalized (baseline index 100) and represent relative biomass densities rather than actual wild fish counts.
                </p>
                <p>
                  <strong>Spatial and seasonal simplification:</strong> The real Northwest Atlantic Shelf encompasses complex migratory circuits, ocean currents, larval advection, and multi-year age-class cohorts that are intentionally simplified to highlight trophic mechanics.
                </p>
              </div>
            </div>

            <!-- Primary Literature & Agency Sources -->
            <div>
              <h4 class="text-xs font-bold uppercase tracking-wider text-slate-100 mb-2 flex items-center gap-1.5">
                <mat-icon class="text-cyan-400 text-sm">library_books</mat-icon>
                <span>Primary Scientific Sources</span>
              </h4>
              <div class="space-y-2 font-mono text-[11px]">
                <div class="p-2.5 rounded bg-slate-950 border border-slate-800">
                  <p class="font-bold text-slate-200">Myers, R. A., et al. (2007)</p>
                  <p class="text-slate-400">Cascading effects of the loss of apex predatory sharks from a coastal ocean.</p>
                  <p class="text-cyan-400 text-[10px]">Science, 315(5820), 1846-1850.</p>
                </div>
                <div class="p-2.5 rounded bg-slate-950 border border-slate-800">
                  <p class="font-bold text-slate-200">NOAA Northeast Fisheries Science Center (2023-2024)</p>
                  <p class="text-slate-400">State of the Ecosystem Reports: Northeast Continental Shelf.</p>
                  <p class="text-cyan-400 text-[10px]">NOAA Fisheries Technical Memoranda.</p>
                </div>
                <div class="p-2.5 rounded bg-slate-950 border border-slate-800">
                  <p class="font-bold text-slate-200">Atlantic States Marine Fisheries Commission (ASMFC)</p>
                  <p class="text-slate-400">Atlantic Menhaden & Striped Bass Benchmark Stock Assessments.</p>
                  <p class="text-cyan-400 text-[10px]">ASMFC Biological Reference Reports.</p>
                </div>
                <div class="p-2.5 rounded bg-slate-950 border border-slate-800">
                  <p class="font-bold text-slate-200">Smithsonian Ocean Portal & SERC</p>
                  <p class="text-slate-400">Marine Food Webs, Plankton Ecology, and Coastal Bivalve Filtration.</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-5 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
            <span>Built with Angular 21 • Clean Architecture</span>
            <button
              type="button"
              (click)="close()"
              class="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class AboutModalComponent {
  readonly sim = inject(SimulationStateService);

  close() {
    this.sim.closeAboutModal();
  }
}
