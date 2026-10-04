import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { SimulationStateService } from '../services/simulation-state';

@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <header class="border-b border-slate-800 bg-slate-900/90 sticky top-0 z-30 px-4 py-3">
      <div class="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        <!-- Logo & Title -->
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400">
            <mat-icon class="text-xl">waves</mat-icon>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-base font-semibold tracking-wide text-slate-100">
                AQUATIC FOOD-WEB SIMULATOR
              </h1>
              <span class="text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                v1.0 • NW Atlantic Shelf
              </span>
            </div>
            <p class="text-xs text-slate-400">
              Discrete-Time Marine Trophic Dynamics & Ecological Cascade Laboratory
            </p>
          </div>
        </div>

        <!-- Simulation Controls Toolbar -->
        <div class="flex flex-wrap items-center gap-2">
          <!-- Step Counter Badge -->
          <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs">
            <span class="text-slate-400">STEP:</span>
            <span class="text-cyan-400 font-bold">{{ sim.currentStep() }}</span>
            <span class="text-slate-600">/</span>
            <span class="text-slate-400">{{ sim.maxSteps }}</span>
          </div>

          <!-- Play / Pause Button -->
          <button
            type="button"
            (click)="sim.togglePlay()"
            [class]="sim.isPlaying()
              ? 'px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-medium text-xs flex items-center gap-1.5 transition-colors'
              : 'px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-medium text-xs flex items-center gap-1.5 transition-colors'"
            [attr.aria-label]="sim.isPlaying() ? 'Pause Simulation' : 'Run Simulation'"
          >
            <mat-icon class="text-base">{{ sim.isPlaying() ? 'pause' : 'play_arrow' }}</mat-icon>
            <span>{{ sim.isPlaying() ? 'Pause' : 'Run Simulation' }}</span>
          </button>

          <!-- Step Forward Button -->
          <button
            type="button"
            (click)="sim.stepForward()"
            [disabled]="sim.isPlaying() || sim.currentStep() >= sim.maxSteps"
            class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 text-xs flex items-center gap-1 border border-slate-700 transition-colors"
            title="Advance 1 Step"
            aria-label="Advance 1 Step"
          >
            <mat-icon class="text-base">skip_next</mat-icon>
            <span class="hidden sm:inline">Step</span>
          </button>

          <!-- Reset Button -->
          <button
            type="button"
            (click)="sim.reset()"
            class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1 border border-slate-700 transition-colors"
            title="Reset to Step 0"
            aria-label="Reset simulation"
          >
            <mat-icon class="text-base">restart_alt</mat-icon>
            <span class="hidden sm:inline">Reset</span>
          </button>

          <div class="h-4 w-px bg-slate-800 hidden sm:block"></div>

          <!-- Scenario Dropdown -->
          <div class="flex items-center gap-1.5">
            <label for="scenario-select" class="text-xs text-slate-400 hidden xl:inline">Scenario:</label>
            <select
              id="scenario-select"
              [value]="sim.activeScenarioId()"
              (change)="onScenarioChange($event)"
              class="px-2.5 py-1.5 rounded-lg bg-slate-950 text-slate-200 border border-slate-800 text-xs focus:outline-none focus:border-cyan-500 max-w-[200px] truncate"
            >
              <option value="baseline">Baseline Equilibrium</option>
              @for (sc of sim.scenarios(); track sc.id) {
                <option [value]="sc.id">{{ sc.title }}</option>
              }
            </select>
          </div>

          <div class="h-4 w-px bg-slate-800 hidden sm:block"></div>

          <!-- Guide / Concepts Modal Trigger -->
          <button
            type="button"
            (click)="sim.openConceptModal()"
            class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 border border-slate-700 transition-colors"
            title="Ecological Concepts & Math"
          >
            <mat-icon class="text-base text-cyan-400">menu_book</mat-icon>
            <span class="hidden md:inline">Concepts</span>
          </button>

          <!-- About Project Trigger -->
          <button
            type="button"
            (click)="sim.openAboutModal()"
            class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 border border-slate-700 transition-colors"
            title="About this Project & Sources"
          >
            <mat-icon class="text-base text-slate-400">info</mat-icon>
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
