import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { SimulationStateService } from '../services/simulation-state';

@Component({
  selector: 'app-metrics-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <section class="bg-slate-900 border-b border-slate-800 px-4 py-2.5">
      <div class="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        <!-- Health Status Pill -->
        <div class="flex items-center gap-2">
          <div class="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-950 border border-slate-800">
            <span class="w-2 h-2 rounded-full" [class]="statusDotClass()"></span>
            <span class="text-xs font-semibold" [class]="sim.ecosystemHealth().color">
              {{ sim.ecosystemHealth().label }}
            </span>
          </div>
          <span class="text-xs text-slate-400 hidden lg:inline max-w-sm truncate" [title]="sim.ecosystemHealth().detail || ''">
            {{ sim.ecosystemHealth().detail }}
          </span>
        </div>

        <!-- Vital Statistics Grid -->
        <div class="flex items-center gap-4 sm:gap-6 text-xs">
          <!-- Total Biomass -->
          <div class="flex items-baseline gap-1.5">
            <span class="text-slate-400 font-mono">BIOMASS:</span>
            <span class="font-mono font-bold text-slate-100">{{ currentBiomass() }}</span>
            <span class="text-xs font-mono" [class]="biomassDeltaClass()">
              {{ biomassDeltaText() }}
            </span>
          </div>

          <div class="h-3 w-px bg-slate-800"></div>

          <!-- Shannon Biodiversity H' -->
          <div class="flex items-baseline gap-1.5" title="Shannon-Wiener Biodiversity Index (H')">
            <span class="text-slate-400 font-mono">DIVERSITY (H'):</span>
            <span class="font-mono font-bold" [class]="diversityColor()">{{ currentDiversity() }}</span>
          </div>

          <div class="h-3 w-px bg-slate-800"></div>

          <!-- Extinct Species Count -->
          <div class="flex items-baseline gap-1.5">
            <span class="text-slate-400 font-mono">EXTIRPATED:</span>
            <span class="font-mono font-bold" [class]="extinctCount() > 0 ? 'text-red-400 font-bold' : 'text-slate-300'">
              {{ extinctCount() }} / 10
            </span>
          </div>

          <!-- Active Abiotic Pressures -->
          @if (hasAbioticPressures()) {
            <div class="h-3 w-px bg-slate-800 hidden md:block"></div>
            <div class="hidden md:flex items-center gap-1.5">
              @if (sim.environment().fishingPressure > 0) {
                <span class="px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/80 text-xs font-mono">
                  HARVEST: {{ sim.environment().fishingPressure }}x
                </span>
              }
              @if (sim.environment().waterTempAnomaly !== 0) {
                <span class="px-2 py-0.5 rounded bg-sky-950/80 text-sky-300 border border-sky-800/80 text-xs font-mono">
                  TEMP: {{ sim.environment().waterTempAnomaly > 0 ? '+' : '' }}{{ sim.environment().waterTempAnomaly }}°C
                </span>
              }
              @if (sim.environment().nutrientAvailability !== 1.0) {
                <span class="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 text-xs font-mono">
                  NUTRIENTS: {{ (sim.environment().nutrientAvailability * 100).toFixed(0) }}%
                </span>
              }
            </div>
          }
        </div>
      </div>
    </section>
  `
})
export class MetricsBarComponent {
  readonly sim = inject(SimulationStateService);

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
      case 'stable': return 'bg-emerald-400 animate-pulse';
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

  readonly diversityColor = computed(() => {
    const d = Number(this.currentDiversity());
    if (d >= 2.15) return 'text-emerald-400';
    if (d >= 1.80) return 'text-amber-300';
    return 'text-red-400';
  });

  readonly hasAbioticPressures = computed(() => {
    const env = this.sim.environment();
    return env.fishingPressure > 0 || env.waterTempAnomaly !== 0 || env.nutrientAvailability !== 1.0;
  });
}
