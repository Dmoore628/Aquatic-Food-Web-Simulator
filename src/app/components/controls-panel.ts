import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { SpeciesId } from '../domain/models';
import { SimulationStateService } from '../services/simulation-state';

@Component({
  selector: 'app-controls-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <div class="bg-slate-950 rounded-xl border border-slate-800 p-4 flex flex-col gap-4">
      <!-- Section Header -->
      <div class="flex items-center justify-between border-b border-slate-800 pb-3">
        <div class="flex items-center gap-2">
          <mat-icon class="text-cyan-400 text-lg">tune</mat-icon>
          <h3 class="text-xs font-semibold text-slate-100 tracking-wide uppercase">
            Ecosystem Perturbation Laboratory
          </h3>
        </div>

        <button
          type="button"
          (click)="sim.resetEnvironment()"
          class="text-xs text-slate-400 hover:text-slate-200 underline transition-colors"
        >
          Reset Variables
        </button>
      </div>

      <!-- Quick Disturbance Presets -->
      <div>
        <span class="block text-xs font-medium text-slate-300 mb-2">
          QUICK ECOLOGICAL DISTURBANCES:
        </span>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <button
            type="button"
            (click)="quickExtirpateShark()"
            class="px-2.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-rose-300 border border-slate-800 flex items-center justify-center gap-1.5 transition-colors text-center"
          >
            <mat-icon class="text-sm">close</mat-icon>
            <span>Extirpate Shark</span>
          </button>

          <button
            type="button"
            (click)="quickOverfish()"
            class="px-2.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-800 flex items-center justify-center gap-1.5 transition-colors text-center"
          >
            <mat-icon class="text-sm">phishing</mat-icon>
            <span>Overfish Stocks</span>
          </button>

          <button
            type="button"
            (click)="quickAlgaeCrash()"
            class="px-2.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-slate-800 flex items-center justify-center gap-1.5 transition-colors text-center"
          >
            <mat-icon class="text-sm">grass</mat-icon>
            <span>Halve Plankton</span>
          </button>

          <button
            type="button"
            (click)="quickHeatwave()"
            class="px-2.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-sky-300 border border-slate-800 flex items-center justify-center gap-1.5 transition-colors text-center"
          >
            <mat-icon class="text-sm">thermostat</mat-icon>
            <span>Heatwave (+3°C)</span>
          </button>
        </div>
      </div>

      <!-- Environmental Drivers Grid -->
      <div class="space-y-3 pt-2 border-t border-slate-800">
        <span class="block text-xs font-medium text-slate-300">
          ABIOTIC ENVIRONMENTAL DRIVERS:
        </span>

        <!-- Water Temperature Anomaly -->
        <div class="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
          <div class="flex items-center justify-between text-xs mb-1.5">
            <span class="text-slate-300 font-medium">Water Temperature Anomaly:</span>
            <span class="font-mono font-bold" [class]="tempColor()">
              {{ sim.environment().waterTempAnomaly > 0 ? '+' : '' }}{{ sim.environment().waterTempAnomaly }} °C
            </span>
          </div>
          <input
            type="range"
            min="-3"
            max="4"
            step="0.5"
            [value]="sim.environment().waterTempAnomaly"
            (input)="onTempChange($event)"
            class="w-full accent-cyan-400 cursor-pointer"
            aria-label="Water temperature anomaly"
          />
          <div class="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
            <span>-3.0°C (Cold)</span>
            <span>0.0°C (Baseline)</span>
            <span>+4.0°C (Heatwave)</span>
          </div>
        </div>

        <!-- Dissolved Nutrient Availability -->
        <div class="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
          <div class="flex items-center justify-between text-xs mb-1.5">
            <span class="text-slate-300 font-medium">Nutrient Influx & Upwelling:</span>
            <span class="font-mono font-bold text-cyan-300">
              {{ (sim.environment().nutrientAvailability * 100).toFixed(0) }}%
            </span>
          </div>
          <input
            type="range"
            min="0.2"
            max="2.0"
            step="0.1"
            [value]="sim.environment().nutrientAvailability"
            (input)="onNutrientChange($event)"
            class="w-full accent-cyan-400 cursor-pointer"
            aria-label="Nutrient availability"
          />
          <div class="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
            <span>20% (Depleted)</span>
            <span>100% (Baseline)</span>
            <span>200% (Eutrophic)</span>
          </div>
        </div>

        <!-- Commercial Fishing Pressure -->
        <div class="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
          <div class="flex items-center justify-between text-xs mb-1.5">
            <span class="text-slate-300 font-medium">Commercial Harvest Pressure:</span>
            <span class="font-mono font-bold" [class]="sim.environment().fishingPressure > 0 ? 'text-amber-300' : 'text-slate-400'">
              {{ sim.environment().fishingPressure.toFixed(1) }}x
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="2.0"
            step="0.2"
            [value]="sim.environment().fishingPressure"
            (input)="onFishingChange($event)"
            class="w-full accent-cyan-400 cursor-pointer"
            aria-label="Fishing harvest pressure"
          />
          <div class="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
            <span>0.0x (No Harvest)</span>
            <span>1.0x (Moderate)</span>
            <span>2.0x (Overexploited)</span>
          </div>
        </div>
      </div>

      <!-- Quick Species Modifier Row -->
      <div class="pt-2 border-t border-slate-800">
        <span class="block text-xs font-medium text-slate-300 mb-2">
          TARGET DIRECT SPECIES MANIPULATION:
        </span>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          @for (sp of sim.speciesList(); track sp.id) {
            <div class="flex items-center justify-between p-2 rounded bg-slate-900/40 border border-slate-800/80">
              <div class="flex items-center gap-1.5 truncate">
                <span class="w-2 h-2 rounded-full" [style.backgroundColor]="sp.color"></span>
                <span class="font-medium text-slate-200 truncate">{{ sp.commonName }}</span>
              </div>

              <div class="flex items-center gap-1 font-mono">
                <span class="text-[11px] text-slate-400 mr-1">
                  {{ sim.currentPopulations()[sp.id]?.toFixed(0) || 0 }}
                </span>
                <button
                  type="button"
                  (click)="adjustSpecies(sp.id, -20)"
                  class="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-center leading-none"
                  title="Reduce by 20"
                >
                  -
                </button>
                <button
                  type="button"
                  (click)="adjustSpecies(sp.id, 20)"
                  class="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-center leading-none"
                  title="Increase by 20"
                >
                  +
                </button>
                <button
                  type="button"
                  (click)="sim.removeSpecies(sp.id)"
                  class="w-5 h-5 rounded bg-red-950 hover:bg-red-900 text-red-300 text-[10px] flex items-center justify-center"
                  title="Extirpate"
                >
                  &times;
                </button>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class ControlsPanelComponent {
  readonly sim = inject(SimulationStateService);

  readonly tempColor = computed(() => {
    const t = this.sim.environment().waterTempAnomaly;
    if (t >= 2.0) return 'text-red-400';
    if (t <= -2.0) return 'text-sky-300';
    return 'text-slate-200';
  });

  onTempChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.sim.updateEnvironment({ waterTempAnomaly: Number(input.value) });
  }

  onNutrientChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.sim.updateEnvironment({ nutrientAvailability: Number(input.value) });
  }

  onFishingChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.sim.updateEnvironment({ fishingPressure: Number(input.value) });
  }

  adjustSpecies(id: SpeciesId, delta: number) {
    const curr = this.sim.currentPopulations()[id] ?? 100;
    this.sim.setSpeciesPopulation(id, Math.max(0, curr + delta));
  }

  quickExtirpateShark() {
    this.sim.removeSpecies('apex_shark');
  }

  quickOverfish() {
    this.sim.setSpeciesPopulation('predatory_fish', 20);
    this.sim.updateEnvironment({ fishingPressure: 1.6 });
  }

  quickAlgaeCrash() {
    this.sim.setSpeciesPopulation('phytoplankton', 40);
    this.sim.updateEnvironment({ nutrientAvailability: 0.4 });
  }

  quickHeatwave() {
    this.sim.updateEnvironment({ waterTempAnomaly: 3.0 });
  }
}
