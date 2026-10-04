import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { SpeciesId } from '../domain/models';
import { SimulationStateService } from '../services/simulation-state';

interface LinePoint {
  x: number;
  y: number;
  step: number;
  pop: number;
}

interface SpeciesLine {
  speciesId: SpeciesId;
  name: string;
  color: string;
  points: LinePoint[];
  pathData: string;
  currentValue: number;
  deltaFromBase: number;
  visible: boolean;
}

@Component({
  selector: 'app-population-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <div class="bg-slate-950 rounded-xl border border-slate-800 p-4 flex flex-col gap-3">
      <!-- Chart Controls & Header -->
      <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <div class="flex items-center gap-2">
            <h3 class="text-xs font-semibold text-slate-100 tracking-wide uppercase">
              Population Trajectory Analysis
            </h3>
            <span class="text-xs text-slate-400 font-mono">
              (t = 0 to {{ maxObservedStep() }})
            </span>
          </div>
          <p class="text-xs text-slate-400">
            Click anywhere on the timeline to scrub to that step and inspect historical ecosystem state.
          </p>
        </div>

        <!-- Quick filter presets -->
        <div class="flex items-center gap-1.5 text-xs">
          <button
            type="button"
            (click)="sim.selectKeyChartSpecies()"
            class="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-800 text-[11px]"
          >
            Cascade Core (5)
          </button>
          <button
            type="button"
            (click)="sim.selectAllChartSpecies()"
            class="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px]"
          >
            Show All
          </button>
        </div>
      </div>

      <!-- Main Chart SVG -->
      <div class="relative w-full h-56 sm:h-64 select-none">
        <svg
          class="w-full h-full cursor-crosshair focus:outline-none focus:ring-1 focus:ring-cyan-500 rounded"
          viewBox="0 0 900 240"
          preserveAspectRatio="none"
          tabindex="0"
          role="region"
          aria-label="Simulation population trajectory chart. Use left and right arrow keys to scrub through time steps, or click anywhere on the chart."
          (click)="onChartClick($event)"
          (keydown.arrowleft)="onArrowKey(-1)"
          (keydown.arrowright)="onArrowKey(1)"
        >
          <!-- Grid Lines (Horizontal: 0, 50, 100, 150, 200) -->
          <g class="grid-lines opacity-20">
            @for (yVal of yTicks; track yVal) {
              <line
                x1="45"
                [attr.y1]="scaleY(yVal)"
                x2="880"
                [attr.y2]="scaleY(yVal)"
                stroke="#64748b"
                stroke-dasharray="3 3"
                stroke-width="1"
              />
              <text
                x="40"
                [attr.y]="scaleY(yVal) + 4"
                text-anchor="end"
                fill="#94a3b8"
                font-size="10"
                font-family="monospace"
              >
                {{ yVal }}
              </text>
            }
            <!-- Baseline K=100 reference marker -->
            <line
              x1="45"
              [attr.y1]="scaleY(100)"
              x2="880"
              [attr.y2]="scaleY(100)"
              stroke="#38bdf8"
              stroke-width="1.5"
              stroke-dasharray="6 4"
              opacity="0.4"
            />
          </g>

          <!-- Step Axis Guidelines -->
          <g class="step-axis opacity-30">
            @for (s of xTicks(); track s) {
              <line
                [attr.x1]="scaleX(s)"
                y1="20"
                [attr.x2]="scaleX(s)"
                y2="215"
                stroke="#334155"
                stroke-dasharray="2 4"
              />
              <text
                [attr.x]="scaleX(s)"
                y="230"
                text-anchor="middle"
                fill="#94a3b8"
                font-size="10"
                font-family="monospace"
              >
                t={{ s }}
              </text>
            }
          </g>

          <!-- Population Trajectory Lines -->
          <g class="lines">
            @for (line of visibleLines(); track line.speciesId) {
              <path
                [attr.d]="line.pathData"
                [attr.stroke]="line.color"
                stroke-width="2.2"
                stroke-linecap="round"
                stroke-linejoin="round"
                fill="none"
                class="transition-opacity duration-200"
              />
            }
          </g>

          <!-- Current Step Scrubber Line -->
          @if (currentScrubberX(); as scrubX) {
            <g class="scrubber pointer-events-none">
              <line
                [attr.x1]="scrubX"
                y1="15"
                [attr.x2]="scrubX"
                y2="215"
                stroke="#38bdf8"
                stroke-width="2"
                stroke-dasharray="4 2"
              />
              <!-- Scrubber Head -->
              <polygon
                [attr.points]="(scrubX - 5) + ',15 ' + (scrubX + 5) + ',15 ' + scrubX + ',24'"
                fill="#38bdf8"
              />
              <text
                [attr.x]="scrubX"
                y="10"
                text-anchor="middle"
                fill="#38bdf8"
                font-size="10"
                font-weight="bold"
                font-family="monospace"
              >
                STEP {{ sim.currentStep() }}
              </text>
            </g>
          }
        </svg>
      </div>

      <!-- Species Selector Chips / Live Values Legend -->
      <div class="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800">
        @for (line of allLines(); track line.speciesId) {
          <button
            type="button"
            (click)="sim.toggleChartSpecies(line.speciesId)"
            [class]="line.visible
              ? 'px-2.5 py-1 rounded bg-slate-900 border text-slate-100 flex items-center gap-2 text-xs transition-colors'
              : 'px-2.5 py-1 rounded bg-slate-950/60 border border-slate-900 text-slate-500 opacity-60 flex items-center gap-2 text-xs transition-colors'"
            [style.borderColor]="line.visible ? line.color : '#1e293b'"
            [attr.aria-pressed]="line.visible"
          >
            <span class="w-2.5 h-2.5 rounded-full" [style.backgroundColor]="line.color"></span>
            <span class="font-medium">{{ line.name }}:</span>
            <span class="font-mono font-bold" [class]="line.currentValue === 0 ? 'text-red-400' : 'text-slate-200'">
              {{ line.currentValue.toFixed(1) }}
            </span>
            @if (line.deltaFromBase !== 0 && line.visible) {
              <span class="text-[10px] font-mono" [class]="line.deltaFromBase > 0 ? 'text-emerald-400' : 'text-red-400'">
                {{ line.deltaFromBase > 0 ? '+' : '' }}{{ line.deltaFromBase.toFixed(0) }}%
              </span>
            }
          </button>
        }
      </div>
    </div>
  `
})
export class PopulationChartComponent {
  readonly sim = inject(SimulationStateService);

  readonly yTicks = [0, 50, 100, 150, 200, 250];

  readonly maxObservedStep = computed(() => {
    const hist = this.sim.history();
    return Math.max(10, hist.length - 1);
  });

  readonly xTicks = computed(() => {
    const max = this.maxObservedStep();
    const stepInterval = Math.max(5, Math.ceil(max / 5));
    const ticks: number[] = [];
    for (let s = 0; s <= max; s += stepInterval) {
      ticks.push(s);
    }
    if (ticks[ticks.length - 1] !== max) {
      ticks.push(max);
    }
    return ticks;
  });

  // Coordinate scales: (45..880 on X, 215..20 on Y)
  scaleX(step: number): number {
    const max = Math.max(1, this.maxObservedStep());
    return 45 + (step / max) * (880 - 45);
  }

  scaleY(pop: number): number {
    const max = 250;
    const clamped = Math.max(0, Math.min(pop, max));
    return 215 - (clamped / max) * (215 - 20);
  }

  readonly currentScrubberX = computed(() => {
    const step = this.sim.currentStep();
    return this.scaleX(step);
  });

  readonly allLines = computed<SpeciesLine[]>(() => {
    const hist = this.sim.history();
    const species = this.sim.speciesList();
    const visibleSet = this.sim.visibleChartSpecies();
    const currentRecord = this.sim.currentRecord();
    const basePops = hist[0]?.populations || {};

    return species.map((sp) => {
      const points: LinePoint[] = hist.map((record) => {
        const pop = record.populations[sp.id] ?? 0;
        return {
          step: record.step,
          pop,
          x: this.scaleX(record.step),
          y: this.scaleY(pop)
        };
      });

      let pathData = '';
      if (points.length > 0) {
        pathData = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
          pathData += ` L ${points[i].x} ${points[i].y}`;
        }
      }

      const currPop = currentRecord?.populations[sp.id] ?? basePops[sp.id] ?? 100;
      const base = basePops[sp.id] ?? 100;
      const deltaFromBase = base > 0 ? ((currPop - base) / base) * 100 : 0;

      return {
        speciesId: sp.id,
        name: sp.commonName,
        color: sp.color,
        points,
        pathData,
        currentValue: currPop,
        deltaFromBase,
        visible: visibleSet.has(sp.id)
      };
    });
  });

  readonly visibleLines = computed(() => {
    return this.allLines().filter((l) => l.visible);
  });

  onChartClick(event: MouseEvent) {
    const target = event.currentTarget as SVGSVGElement;
    const rect = target.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const svgWidth = rect.width;
    // Map relative X to 0..900 coordinate space
    const xInViewBox = (clickX / svgWidth) * 900;

    // Convert xInViewBox back to step
    const minX = 45;
    const maxX = 880;
    const ratio = Math.max(0, Math.min(1, (xInViewBox - minX) / (maxX - minX)));
    const targetStep = Math.round(ratio * this.maxObservedStep());

    this.sim.scrubTo(targetStep);
  }

  onArrowKey(delta: number) {
    const current = this.sim.currentStep();
    this.sim.scrubTo(current + delta);
  }
}
