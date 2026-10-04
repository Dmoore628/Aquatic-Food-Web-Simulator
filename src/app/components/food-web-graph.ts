import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Species, SpeciesId } from '../domain/models';
import { SimulationStateService } from '../services/simulation-state';

interface FoodWebEdge {
  id: string;
  preyId: SpeciesId;
  predatorId: SpeciesId;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  path: string;
}

@Component({
  selector: 'app-food-web-graph',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <div class="relative w-full bg-slate-950 rounded-2xl border border-slate-800/80 overflow-hidden flex flex-col select-none">
      <!-- Quiet, Subtle Canvas Header -->
      <div class="px-5 py-3 border-b border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
        <div class="flex items-center gap-2">
          <span class="font-bold text-slate-200 uppercase tracking-wide">Food Web Topology</span>
          <span class="text-slate-500">•</span>
          <span class="hidden sm:inline">Hover or click any organism to see its direct feeding links</span>
        </div>

        <div class="flex items-center gap-4 text-[11px] font-mono">
          <span class="flex items-center gap-1.5 text-emerald-400">
            <span class="w-2 h-2 rounded-full bg-emerald-400"></span> Increasing
          </span>
          <span class="flex items-center gap-1.5 text-slate-400">
            <span class="w-2 h-2 rounded-full bg-slate-500"></span> Stable
          </span>
          <span class="flex items-center gap-1.5 text-red-400">
            <span class="w-2 h-2 rounded-full bg-red-400"></span> Declining
          </span>
        </div>
      </div>

      <!-- Main SVG Canvas Area (Clean, Generous Spacing, High Contrast) -->
      <div class="relative w-full h-[580px] lg:h-[640px] bg-slate-950">
        <svg
          class="w-full h-full"
          viewBox="0 0 1000 620"
          preserveAspectRatio="xMidYMid meet"
        >
          <!-- Background click catcher to unselect -->
          <rect
            width="1000"
            height="620"
            fill="transparent"
            (click)="clearSelection()"
            class="cursor-default"
          />

          <!-- Clean Arrowhead Markers -->
          <defs>
            <marker
              id="arrow-default"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 2 L 7 5 L 0 8 z" fill="#334155" />
            </marker>
            <marker
              id="arrow-prey"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#10b981" />
            </marker>
            <marker
              id="arrow-predator"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#f43f5e" />
            </marker>
            <marker
              id="arrow-highlighted"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="8"
              markerHeight="8"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38bdf8" />
            </marker>
          </defs>

          <!-- Quiet Left-Aligned Trophic Level Indicators (No harsh dashed lines across screen) -->
          <g class="trophic-labels opacity-35 pointer-events-none font-mono text-[10px]">
            <text x="30" y="65" fill="#94a3b8">TIER 5 • APEX PREDATORS</text>
            <text x="30" y="180" fill="#94a3b8">TIER 4 • TERTIARY CONSUMERS</text>
            <text x="30" y="295" fill="#94a3b8">TIER 3 • SECONDARY CONSUMERS</text>
            <text x="30" y="415" fill="#94a3b8">TIER 2 • PRIMARY CONSUMERS</text>
            <text x="30" y="535" fill="#94a3b8">TIER 1 • PRIMARY PRODUCERS & RECYCLERS</text>
          </g>

          <!-- Directed Feeding Connections (Calm by default, crystal-clear when focused) -->
          <g class="edges">
            @for (edge of edges(); track edge.id) {
              <path
                [attr.d]="edge.path"
                [attr.stroke]="getEdgeStroke(edge)"
                [attr.stroke-width]="getEdgeWidth(edge)"
                [attr.opacity]="getEdgeOpacity(edge)"
                [attr.marker-end]="getEdgeMarker(edge)"
                fill="none"
                class="transition-all duration-300"
              />
            }
          </g>

          <!-- Organism Nodes (Clean, Uncluttered, High Contrast) -->
          <g class="nodes">
            @for (node of nodeViews(); track node.species.id) {
              <g
                [attr.transform]="'translate(' + node.cx + ',' + node.cy + ')'"
                (click)="onNodeClick($event, node.species)"
                (mouseenter)="onNodeMouseEnter(node.species)"
                (mouseleave)="onNodeMouseLeave()"
                class="cursor-pointer"
                tabindex="0"
                role="button"
                (keydown.enter)="onNodeClick($event, node.species)"
                (keydown.space)="onNodeClick($event, node.species)"
                [attr.aria-label]="node.species.commonName + ' population ' + node.population"
              >
                <!-- Focus Ring (Only when selected or highlighted) -->
                @if (isSelected(node.species.id) || isHighlighted(node.species.id)) {
                  <circle
                    [attr.r]="node.radius + 8"
                    fill="none"
                    stroke="#38bdf8"
                    stroke-width="2"
                    stroke-dasharray="3 3"
                    class="opacity-90"
                  />
                }

                <!-- Clean Main Body Circle -->
                <circle
                  [attr.r]="node.radius"
                  [attr.fill]="node.bodyFill"
                  [attr.stroke]="node.strokeColor"
                  [attr.stroke-width]="node.strokeWidth"
                  class="transition-all duration-200"
                />

                <!-- Extinct Slash Indicator if Population is 0 -->
                @if (node.isExtinct) {
                  <line x1="-12" y1="-12" x2="12" y2="12" stroke="#ef4444" stroke-width="2" />
                  <line x1="12" y1="-12" x2="-12" y2="12" stroke="#ef4444" stroke-width="2" />
                }

                <!-- Large, Clear Population Value in Center -->
                <text
                  x="0"
                  y="1"
                  text-anchor="middle"
                  dominant-baseline="central"
                  class="font-mono font-bold select-none pointer-events-none"
                  [attr.fill]="node.isExtinct ? '#ef4444' : '#f8fafc'"
                  [attr.font-size]="node.isExtinct ? '11' : (node.radius >= 32 ? '15' : '13')"
                >
                  {{ node.isExtinct ? '0' : node.population.toFixed(0) }}
                </text>

                <!-- Clean Species Label Below Node -->
                <g [attr.transform]="'translate(0,' + (node.radius + 16) + ')'" class="pointer-events-none">
                  <text
                    x="0"
                    y="0"
                    text-anchor="middle"
                    class="font-semibold select-none text-[12px] tracking-wide"
                    [attr.fill]="node.isHovered || isSelected(node.species.id) ? '#38bdf8' : '#f8fafc'"
                  >
                    {{ node.species.commonName }}
                  </text>

                  <!-- Delta Badge (Only shown if noticeably changed from baseline) -->
                  @if (node.isExtinct) {
                    <text
                      x="0"
                      y="13"
                      text-anchor="middle"
                      class="font-mono font-bold text-[9px]"
                      fill="#ef4444"
                    >
                      EXTIRPATED
                    </text>
                  } @else if (node.deltaFromBase !== 0 && Math.abs(node.deltaFromBase) >= 8) {
                    <text
                      x="0"
                      y="13"
                      text-anchor="middle"
                      class="font-mono font-bold text-[10px]"
                      [attr.fill]="node.deltaFromBase > 0 ? '#34d399' : '#f87171'"
                    >
                      {{ node.deltaFromBase > 0 ? '▲ +' : '▼ ' }}{{ node.deltaFromBase.toFixed(0) }}%
                    </text>
                  }
                </g>
              </g>
            }
          </g>
        </svg>

        <!-- Selected Species Action Strip (Clean, Focused, 1-Click Controls) -->
        @if (selectedNode(); as sel) {
          <div class="absolute bottom-4 left-4 right-4 bg-slate-900/95 border border-slate-700/80 rounded-xl p-3 shadow-xl flex flex-wrap items-center justify-between gap-3 z-20">
            <div class="flex items-center gap-3">
              <span class="w-3.5 h-3.5 rounded-full" [style.backgroundColor]="sel.species.color"></span>
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-bold text-slate-100 text-sm">{{ sel.species.commonName }}</span>
                  <span class="text-xs text-slate-400 italic">({{ sel.species.scientificName }})</span>
                  <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
                    TL {{ sel.species.trophicLevel.toFixed(1) }}
                  </span>
                </div>
                <div class="text-xs text-slate-400 mt-0.5">
                  Population: <strong class="text-slate-200 font-mono">{{ sel.population.toFixed(1) }}</strong>
                  <span class="mx-1.5">•</span>
                  Carrying Capacity (K): <span class="font-mono text-slate-300">{{ sel.species.carryingCapacity }}</span>
                  @if (sel.deltaFromBase !== 0) {
                    <span class="mx-1.5">•</span>
                    <span [class]="sel.deltaFromBase > 0 ? 'text-emerald-400 font-mono' : 'text-red-400 font-mono'">
                      {{ sel.deltaFromBase > 0 ? '+' : '' }}{{ sel.deltaFromBase.toFixed(0) }}% from baseline
                    </span>
                  }
                </div>
              </div>
            </div>

            <!-- Direct 1-Click Action Buttons -->
            <div class="flex items-center gap-2">
              <button
                type="button"
                (click)="modifyPop(sel.species.id, -25)"
                class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono border border-slate-700 transition-colors"
                title="Reduce population by 25%"
              >
                -25%
              </button>
              <button
                type="button"
                (click)="modifyPop(sel.species.id, 25)"
                class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono border border-slate-700 transition-colors"
                title="Increase population by 25%"
              >
                +25%
              </button>

              @if (sel.population > 0) {
                <button
                  type="button"
                  (click)="removeSpecies(sel.species.id)"
                  class="px-3 py-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 text-red-200 text-xs border border-red-800 transition-colors"
                  title="Remove from ecosystem"
                >
                  Extirpate (Set 0)
                </button>
              } @else {
                <button
                  type="button"
                  (click)="restoreSpecies(sel.species.id)"
                  class="px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 text-xs border border-emerald-800 transition-colors"
                  title="Restore to baseline"
                >
                  Restore
                </button>
              }

              <button
                type="button"
                (click)="openFullDossier(sel.species.id)"
                class="px-3 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 text-xs border border-cyan-800 transition-colors"
              >
                Full Dossier
              </button>

              <button
                type="button"
                (click)="clearSelection()"
                class="p-1 rounded text-slate-400 hover:text-slate-200 ml-1"
                aria-label="Dismiss quick bar"
              >
                <mat-icon class="text-sm">close</mat-icon>
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class FoodWebGraphComponent {
  readonly sim = inject(SimulationStateService);

  readonly Math = Math;
  readonly hoveredNodeId = signal<SpeciesId | null>(null);

  readonly nodeViews = computed(() => {
    const list = this.sim.speciesList();
    const pops = this.sim.currentPopulations();
    const basePops = this.sim.history()[0]?.populations || {};
    const hoveredId = this.hoveredNodeId();

    return list.map((species) => {
      const pop = pops[species.id] ?? 0;
      const base = basePops[species.id] ?? 100;
      const isExtinct = pop <= 0.05;
      const deltaFromBase = base > 0 ? ((pop - base) / base) * 100 : 0;

      // Coordinate scaling: percentage -> 1000 x 620 svg space
      const cx = (species.diagramPosition.x / 100) * 880 + 60;
      const cy = (species.diagramPosition.y / 100) * 500 + 60;

      // Clean Radius Scaling (24px to 38px)
      const ratio = Math.max(0.3, Math.min(pop / species.carryingCapacity, 1.6));
      const radius = isExtinct ? 24 : Math.max(24, Math.min(24 + ratio * 10, 38));

      // Obvious visual states with clean fills
      const isSurging = !isExtinct && deltaFromBase >= 12;
      const isDeclining = !isExtinct && deltaFromBase <= -12;

      let bodyFill = '#0f172a'; // clean dark slate
      let strokeColor = '#334155';
      let strokeWidth = 1.5;

      if (isExtinct) {
        bodyFill = '#1e293b';
        strokeColor = '#ef4444';
        strokeWidth = 2;
      } else if (isSurging) {
        bodyFill = '#064e3b'; // rich dark green
        strokeColor = '#10b981'; // vivid emerald
        strokeWidth = 2.5;
      } else if (isDeclining) {
        bodyFill = '#450a0a'; // rich dark red
        strokeColor = '#ef4444'; // vivid coral
        strokeWidth = 2.5;
      }

      return {
        species,
        cx,
        cy,
        population: pop,
        deltaFromBase,
        isExtinct,
        isSurging,
        isDeclining,
        radius,
        bodyFill,
        strokeColor,
        strokeWidth,
        isHovered: hoveredId === species.id
      };
    });
  });

  readonly edges = computed<FoodWebEdge[]>(() => {
    const nodes = this.nodeViews();
    const nodeMap = new Map(nodes.map((n) => [n.species.id, n]));
    const result: FoodWebEdge[] = [];

    for (const predNode of nodes) {
      for (const preyId of predNode.species.preyIds) {
        const preyNode = nodeMap.get(preyId);
        if (!preyNode) continue;

        const dx = predNode.cx - preyNode.cx;
        const dy = predNode.cy - preyNode.cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        const x1 = preyNode.cx + Math.cos(angle) * (preyNode.radius + 2);
        const y1 = preyNode.cy + Math.sin(angle) * (preyNode.radius + 2);
        const x2 = predNode.cx - Math.cos(angle) * (predNode.radius + 5);
        const y2 = predNode.cy - Math.sin(angle) * (predNode.radius + 5);

        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const curvature = dist * 0.12;
        const perpX = -Math.sin(angle) * curvature * (dx > 0 ? 1 : -1);
        const perpY = Math.cos(angle) * curvature * 0.3;

        result.push({
          id: `${preyId}->${predNode.species.id}`,
          preyId,
          predatorId: predNode.species.id,
          x1,
          y1,
          x2,
          y2,
          path: `M ${x1} ${y1} Q ${midX + perpX} ${midY + perpY} ${x2} ${y2}`
        });
      }
    }

    return result;
  });

  readonly selectedNode = computed(() => {
    const selId = this.sim.selectedSpeciesId();
    if (!selId) return null;
    return this.nodeViews().find((n) => n.species.id === selId) || null;
  });

  isSelected(id: SpeciesId): boolean {
    return this.sim.selectedSpeciesId() === id;
  }

  isHighlighted(id: SpeciesId): boolean {
    return this.sim.highlightedSpeciesIds().has(id);
  }

  onNodeClick(event: Event, species: Species) {
    event.stopPropagation();
    this.sim.selectSpecies(species.id);
  }

  onNodeMouseEnter(species: Species) {
    this.hoveredNodeId.set(species.id);
    this.sim.setHoveredSpecies(species.id);
  }

  onNodeMouseLeave() {
    this.hoveredNodeId.set(null);
    this.sim.setHoveredSpecies(null);
  }

  clearSelection() {
    this.sim.selectSpecies(null);
    this.sim.clearHighlights();
  }

  modifyPop(speciesId: SpeciesId, deltaPercent: number) {
    const current = this.sim.currentPopulations()[speciesId] ?? 100;
    const next = Math.max(0, current * (1 + deltaPercent / 100));
    this.sim.setSpeciesPopulation(speciesId, next);
  }

  removeSpecies(speciesId: SpeciesId) {
    this.sim.removeSpecies(speciesId);
  }

  restoreSpecies(speciesId: SpeciesId) {
    this.sim.restoreSpecies(speciesId);
  }

  openFullDossier(speciesId: SpeciesId) {
    this.sim.selectSpecies(speciesId);
  }

  getEdgeStroke(edge: FoodWebEdge): string {
    const isPairHighlighted =
      this.sim.highlightedSpeciesIds().has(edge.predatorId) &&
      this.sim.highlightedSpeciesIds().has(edge.preyId);

    if (isPairHighlighted) {
      return '#38bdf8'; // Vivid Cyan
    }

    const hovered = this.hoveredNodeId();
    const selected = this.sim.selectedSpeciesId();
    const activeId = hovered || selected;

    if (activeId) {
      if (edge.predatorId === activeId) {
        return '#10b981'; // Green: energy entering predator
      }
      if (edge.preyId === activeId) {
        return '#f43f5e'; // Rose: prey consumed by predator
      }
    }

    return '#1e293b'; // Low-noise calm slate
  }

  getEdgeWidth(edge: FoodWebEdge): number {
    const isPairHighlighted =
      this.sim.highlightedSpeciesIds().has(edge.predatorId) &&
      this.sim.highlightedSpeciesIds().has(edge.preyId);

    if (isPairHighlighted) return 3.0;

    const activeId = this.hoveredNodeId() || this.sim.selectedSpeciesId();
    if (activeId && (edge.predatorId === activeId || edge.preyId === activeId)) {
      return 2.2;
    }
    return 1.0;
  }

  getEdgeOpacity(edge: FoodWebEdge): number {
    const isPairHighlighted =
      this.sim.highlightedSpeciesIds().has(edge.predatorId) &&
      this.sim.highlightedSpeciesIds().has(edge.preyId);

    if (isPairHighlighted) return 1.0;

    const activeId = this.hoveredNodeId() || this.sim.selectedSpeciesId();
    if (activeId) {
      if (edge.predatorId === activeId || edge.preyId === activeId) {
        return 1.0;
      }
      return 0.05; // Faint out non-relevant lines completely
    }

    if (this.sim.highlightedSpeciesIds().size > 0) {
      return 0.08;
    }
    return 0.22; // Very quiet background default
  }

  getEdgeMarker(edge: FoodWebEdge): string {
    const isPairHighlighted =
      this.sim.highlightedSpeciesIds().has(edge.predatorId) &&
      this.sim.highlightedSpeciesIds().has(edge.preyId);

    if (isPairHighlighted) return 'url(#arrow-highlighted)';

    const activeId = this.hoveredNodeId() || this.sim.selectedSpeciesId();
    if (activeId) {
      if (edge.predatorId === activeId) return 'url(#arrow-prey)';
      if (edge.preyId === activeId) return 'url(#arrow-predator)';
    }
    return 'url(#arrow-default)';
  }
}
