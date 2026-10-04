import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { SimulationStateService } from '../services/simulation-state';

@Component({
  selector: 'app-metrics-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3.5 shadow-sm">
      <!-- 1-Click Quick Experiment Presets (Immediate intuitive entry point) -->
      <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Quick Experiments:
        </span>

        <div class="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            type="button"
            (click)="sim.loadScenario('baseline')"
            [class]="sim.activeScenarioId() === 'baseline'
              ? 'px-3 py-1 rounded-lg bg-cyan-500 text-slate-950 font-bold border border-cyan-400 transition-colors'
              : 'px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors'"
          >
            Equilibrium (Baseline)
          </button>

          <button
            type="button"
            (click)="sim.loadScenario('apex_removal')"
            [class]="sim.activeScenarioId() === 'apex_removal'
              ? 'px-3 py-1 rounded-lg bg-red-500 text-white font-bold border border-red-400 transition-colors'
              : 'px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors'"
          >
            Remove Shark (Apex)
          </button>

          <button
            type="button"
            (click)="sim.loadScenario('targeted_overfishing')"
            [class]="sim.activeScenarioId() === 'targeted_overfishing'
              ? 'px-3 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold border border-amber-400 transition-colors'
              : 'px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors'"
          >
            Overfish Striped Bass
          </button>

          <button
            type="button"
            (click)="sim.loadScenario('reduced_primary_production')"
            [class]="sim.activeScenarioId() === 'reduced_primary_production'
              ? 'px-3 py-1 rounded-lg bg-emerald-500 text-slate-950 font-bold border border-emerald-400 transition-colors'
              : 'px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors'"
          >
            Plankton Collapse
          </button>

          <button
            type="button"
            (click)="sim.loadScenario('marine_heatwave')"
            [class]="sim.activeScenarioId() === 'marine_heatwave'
              ? 'px-3 py-1 rounded-lg bg-sky-500 text-slate-950 font-bold border border-sky-400 transition-colors'
              : 'px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors'"
          >
            Heatwave (+3.2°C)
          </button>
        </div>
      </div>

      <!-- Primary Action Controls & Clear Status Summary -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <!-- Main Controls -->
        <div class="flex items-center gap-2.5">
          <!-- Primary Dominant Action Button -->
          <button
            type="button"
            (click)="sim.togglePlay()"
            [class]="sim.isPlaying()
              ? 'h-10 px-5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors'
              : 'h-10 px-6 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors shadow-sm'"
            [attr.aria-label]="sim.isPlaying() ? 'Pause Simulation' : 'Run Simulation'"
          >
            <mat-icon class="text-base">{{ sim.isPlaying() ? 'pause' : 'play_arrow' }}</mat-icon>
            <span>{{ sim.isPlaying() ? 'Pause' : 'Run Simulation' }}</span>
          </button>

          <!-- Advance 1 Step -->
          <button
            type="button"
            (click)="sim.stepForward()"
            [disabled]="sim.isPlaying() || sim.currentStep() >= sim.maxSteps"
            class="h-10 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition-colors"
            title="Advance 1 Time Step (t+1)"
          >
            <mat-icon class="text-base">skip_next</mat-icon>
            <span>Step</span>
          </button>

          <!-- Reset -->
          <button
            type="button"
            (click)="sim.reset()"
            class="h-10 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 border border-slate-700 transition-colors"
            title="Reset simulation to initial step"
          >
            <mat-icon class="text-base">restart_alt</mat-icon>
            <span>Reset</span>
          </button>

          <div class="h-6 w-px bg-slate-800 mx-1 hidden sm:block"></div>

          <!-- Step Counter -->
          <div class="font-mono text-xs text-slate-400 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800">
            <span>STEP </span>
            <strong class="text-cyan-400">{{ sim.currentStep() }}</strong>
            <span class="text-slate-600"> / </span>
            <span>{{ sim.maxSteps }}</span>
          </div>
        </div>

        <!-- The One Calm, High-Signal Status Summary -->
        <div class="flex items-center gap-2 text-xs">
          <span class="w-2.5 h-2.5 rounded-full shrink-0" [class]="statusDotClass()"></span>
          <span class="text-slate-200 font-medium">
            {{ plainEnglishStatus() }}
          </span>
        </div>
      </div>
    </div>
  `
})
export class MetricsBarComponent {
  readonly sim = inject(SimulationStateService);

  readonly statusDotClass = computed(() => {
    const status = this.sim.ecosystemHealth().status;
    switch (status) {
      case 'stable': return 'bg-emerald-400';
      case 'imbalanced':
      case 'stressed':
      case 'disturbed': return 'bg-amber-400';
      case 'collapsed': return 'bg-red-500';
      default: return 'bg-slate-400';
    }
  });

  readonly plainEnglishStatus = computed(() => {
    const rec = this.sim.currentRecord();
    const scenario = this.sim.activeScenarioId();

    if (!rec || rec.step === 0) {
      if (scenario === 'apex_removal') {
        return 'Shark removed: Hit "Run Simulation" to see if Striped Bass mesopredator release occurs.';
      }
      if (scenario === 'targeted_overfishing') {
        return 'Striped Bass overfished: Hit "Run Simulation" to see if forage fish and crabs expand.';
      }
      if (scenario === 'reduced_primary_production') {
        return 'Phytoplankton depleted: Hit "Run Simulation" to see food shortage cascade upward.';
      }
      if (scenario === 'marine_heatwave') {
        return 'Heatwave (+3.2°C): Hit "Run Simulation" to see thermal stress on copepods & seals.';
      }
      return 'Equilibrium: All 10 marine species are in balance. Click any preset or organism to test an ecosystem change.';
    }

    if (rec.extinctCount >= 1) {
      return `Warning: ${rec.extinctCount} species extirpated from ecosystem. Energy pathways disrupted.`;
    }

    const shark = rec.populations.apex_shark ?? 0;
    const bass = rec.populations.predatory_fish ?? 0;
    const forage = rec.populations.forage_fish ?? 0;

    if (shark < 15 && bass > 125) {
      return `Mesopredator Release: Striped Bass surged (+${Math.round(bass - 100)}%), overgrazing Forage Fish (${Math.round(forage - 100)}%).`;
    }

    if (bass < 50 && forage > 120) {
      return `Predation Release: Forage Fish rebounded (+${Math.round(forage - 100)}%) due to low predatory bass pressure.`;
    }

    if (forage < 50) {
      return `Forage Fish Depleted: Low forage fish abundance threatens marine birds and seals.`;
    }

    return `Simulating step ${rec.step}: Populations dynamic across 5 trophic levels.`;
  });
}
