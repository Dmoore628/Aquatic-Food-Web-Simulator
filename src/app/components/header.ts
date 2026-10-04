import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { SimulationStateService } from '../services/simulation-state';

@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <header class="border-b border-slate-800 bg-slate-950 px-4 sm:px-6 py-3">
      <div class="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <!-- Brand / Identity -->
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400">
            <mat-icon class="text-lg">waves</mat-icon>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-sm font-bold tracking-wider text-slate-100 uppercase">
                Aquatic Food-Web Simulator
              </h1>
              <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                NW Atlantic Shelf
              </span>
            </div>
            <p class="text-[11px] text-slate-400">
              Discrete-Time Marine Trophic Dynamics Laboratory
            </p>
          </div>
        </div>

        <!-- Secondary Controls & Reference Navigation -->
        <div class="flex items-center gap-3">
          <!-- Scenario Preset Select -->
          <div class="flex items-center gap-1.5">
            <span class="text-xs text-slate-400">Scenario:</span>
            <select
              [value]="sim.activeScenarioId()"
              (change)="onScenarioChange($event)"
              class="px-2.5 py-1.5 rounded-lg bg-slate-900 text-slate-200 border border-slate-800 text-xs focus:outline-none focus:border-cyan-500 max-w-[220px] truncate"
              aria-label="Select ecological scenario"
            >
              <option value="baseline">Baseline Equilibrium</option>
              @for (sc of sim.scenarios(); track sc.id) {
                <option [value]="sc.id">{{ sc.title }}</option>
              }
            </select>
          </div>

          <div class="h-4 w-px bg-slate-800 hidden sm:block"></div>

          <!-- Theoretical Concepts Trigger -->
          <button
            type="button"
            (click)="sim.openConceptModal()"
            class="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs flex items-center gap-1 border border-slate-800 transition-colors"
            title="Biological & Mathematical Foundations"
          >
            <mat-icon class="text-sm text-cyan-400">menu_book</mat-icon>
            <span class="hidden md:inline">Foundations</span>
          </button>

          <!-- About Project Trigger -->
          <button
            type="button"
            (click)="sim.openAboutModal()"
            class="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs flex items-center gap-1 border border-slate-800 transition-colors"
            title="Scientific Sources & Project Limitations"
          >
            <mat-icon class="text-sm text-slate-400">info</mat-icon>
            <span class="hidden md:inline">About</span>
          </button>
        </div>
      </div>
    </header>
  `
})
export class HeaderComponent {
  readonly sim = inject(SimulationStateService);

  onScenarioChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.sim.loadScenario(select.value);
  }
}
