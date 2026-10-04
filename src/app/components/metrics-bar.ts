import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { SimulationStateService } from '../services/simulation-state';

@Component({
  selector: 'app-metrics-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <div class="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 shadow-sm">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <!-- Dominant Primary Actions -->
        <div class="flex flex-wrap items-center gap-2.5">
          <!-- Primary Dominant Action: Run / Pause -->
          <button
            type="button"
            (click)="sim.togglePlay()"
            [class]="sim.isPlaying()
              ? 'h-10 px-5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors'
              : 'h-10 px-6 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors ring-2 ring-cyan-400/20'"
            [attr.aria-label]="sim.isPlaying() ? 'Pause Simulation' : 'Run Simulation'"
          >
            <mat-icon class="text-base">{{ sim.isPlaying() ? 'pause' : 'play_arrow' }}</mat-icon>
            <span>{{ sim.isPlaying() ? 'Pause Simulation' : 'Run Simulation' }}</span>
          </button>

          <!-- Advance 1 Step -->
          <button
            type="button"
            (click)="sim.stepForward()"
            [disabled]="sim.isPlaying() || sim.currentStep() >= sim.maxSteps"
            class="h-10 px-3.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition-colors"
            title="Advance 1 Time Step (t+1)"
          >
            <mat-icon class="text-base">skip_next</mat-icon>
            <span>Step</span>
          </button>

          <!-- Reset to t=0 -->
          <button
            type="button"
            (click)="sim.reset()"
            class="h-10 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 border border-slate-700 transition-colors"
            title="Reset simulation to initial baseline"
          >
            <mat-icon class="text-base">restart_alt</mat-icon>
            <span>Reset</span>
          </button>

          <div class="h-5 w-px bg-slate-800 hidden sm:block"></div>

          <!-- Step Progression Badge -->
          <div class="flex items-center gap-2 font-mono text-xs text-slate-400 bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
            <span class="text-slate-400">TIMELINE:</span>
            <span class="text-cyan-400 font-bold">t={{ sim.currentStep() }}</span>
            <span class="text-slate-600">/</span>
            <span>{{ sim.maxSteps }}</span>
          </div>
        </div>

        <!-- The One Calm, High-Signal Status Line -->
        <div class="flex items-center justify-between lg:justify-end gap-3 flex-1">
          <div class="flex items-center gap-2 text-xs truncate max-w-xl">
            <span class="w-2.5 h-2.5 rounded-full shrink-0" [class]="statusDotClass()"></span>
            <span class="font-semibold text-slate-200 truncate">
              {{ sim.ecosystemHealth().label }}:
            </span>
            <span class="text-slate-400 truncate">
              {{ sim.ecosystemHealth().detail }}
            </span>
          </div>

          <!-- Detailed Metrics Drawer Toggle -->
          <button
            type="button"
            (click)="showMetricsDetails.set(!showMetricsDetails())"
            class="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-mono border border-slate-800 flex items-center gap-1 shrink-0 transition-colors"
            title="Toggle Detailed Ecological Metrics"
          >
            <span>{{ showMetricsDetails() ? 'Hide Metrics' : 'Metrics' }}</span>
            <mat-icon class="text-xs">{{ showMetricsDetails() ? 'expand_less' : 'expand_more' }}</mat-icon>
          </button>
        </div>
      </div>

      <!-- Progressive Disclosure: Detailed Metrics Summary Drawer (Collapsed by default) -->
      @if (showMetricsDetails()) {
        <div class="mt-3 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
          <div class="flex items-baseline gap-2">
            <span class="text-slate-400">TOTAL BIOMASS:</span>
            <span class="font-bold text-slate-100">{{ currentBiomass() }}</span>
            <span [class]="biomassDeltaClass()">{{ biomassDeltaText() }}</span>
          </div>

          <div class="flex items-baseline gap-2">
            <span class="text-slate-400">SHANNON DIVERSITY (H'):</span>
            <span class="font-bold text-slate-100">{{ currentDiversity() }}</span>
          </div>

          <div class="flex items-baseline gap-2">
            <span class="text-slate-400">EXTIRPATIONS:</span>
            <span class="font-bold" [class]="extinctCount() > 0 ? 'text-red-400' : 'text-slate-200'">
              {{ extinctCount() }} / 10 species
            </span>
          </div>

          <div class="flex items-baseline gap-2">
            <span class="text-slate-400">ABIOTIC STRESS:</span>
            <span class="text-slate-300">
              Temp {{ sim.environment().waterTempAnomaly > 0 ? '+' : '' }}{{ sim.environment().waterTempAnomaly }}°C •
              Nutrients {{ (sim.environment().nutrientAvailability * 100).toFixed(0) }}% •
              Harvest {{ sim.environment().fishingPressure.toFixed(1) }}x
            </span>
          </div>
        </div>
      }
    </div>
  `
})
export class MetricsBarComponent {
  readonly sim = inject(SimulationStateService);

  readonly showMetricsDetails = signal<boolean>(false);

  readonly currentBiomass = computed(() => {
    const rec = this.sim.currentRecord();
    return rec ? rec.totalBiomass.toFixed(0) : '1000';
  });

  readonly baselineBiomass = computed(() => {
    const hist = this.sim.history();
    return hist.length > 0 ? hist[0].totalBiomass : 1000;
  });

  readonly currentDiversity = computed(() => {
    const rec = this.sim.currentRecord();
    return rec ? rec.biodiversityIndex.toFixed(2) : '2.30';
  });

  readonly extinctCount = computed(() => {
    const rec = this.sim.currentRecord();
    return rec ? rec.extinctCount : 0;
  });

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

  readonly biomassDeltaText = computed(() => {
    const curr = Number(this.currentBiomass());
    const base = this.baselineBiomass();
    if (!base || base === 0) return '';
    const diff = curr - base;
    const pct = ((diff / base) * 100).toFixed(0);
    return diff >= 0 ? `(+${pct}%)` : `(${pct}%)`;
  });

  readonly biomassDeltaClass = computed(() => {
    const curr = Number(this.currentBiomass());
    const base = this.baselineBiomass();
    const diff = curr - base;
    if (diff > 10) return 'text-emerald-400';
    if (diff < -15) return 'text-red-400';
    return 'text-slate-400';
  });
}
