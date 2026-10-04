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
    <div class="relative w-full h-[520px] lg:h-[580px] bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex flex-col select-none">
      <!-- Diagram Header / Legend -->
      <div class="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 z-10">
        <div class="flex items-center gap-2">
          <span class="text-xs font-semibold text-slate-200 tracking-wide uppercase">
            Trophic Food Web Topology
          </span>
          <span class="text-xs text-slate-400 hidden sm:inline">
            • Arrows indicate biological energy flow (Prey → Predator)
          </span>
        </div>

        <!-- Legend -->
        <div class="flex items-center gap-3 text-xs">
          <div class="flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span class="text-slate-400">Growing</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
            <span class="text-slate-400">Stable</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span class="text-slate-400">Declining</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full bg-red-500"></span>
            <span class="text-slate-400">Extinct</span>
          </div>
        </div>
      </div>

      <!-- Main SVG Canvas Area -->
      <div class="relative flex-1 w-full h-full bg-slate-950 overflow-hidden">
        <!-- SVG Diagram -->
        <svg
          class="w-full h-full"
          viewBox="0 0 1000 600"
          preserveAspectRatio="xMidYMid meet"
        >
          <!-- Background click catcher -->
          <rect
            width="1000"
            height="600"
            fill="transparent"
            (click)="clearSelection()"
            class="cursor-default"
          />
          <!-- SVG Definitions for Arrowheads and Gradients -->
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
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#475569" />
            </marker>
            <marker
              id="arrow-prey"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#10b981" />
            </marker>
            <marker
              id="arrow-predator"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#f43f5e" />
            </marker>
            <marker
              id="arrow-highlighted"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38bdf8" />
            </marker>
          </defs>

          <!-- Trophic Level Guidelines & Labels -->
          <g class="trophic-bands opacity-40">
            <!-- Apex (y: 60) -->
            <line x1="40" y1="90" x2="960" y2="90" stroke="#334155" stroke-dasharray="4 4" stroke-width="1" />
            <text x="50" y="80" fill="#94a3b8" font-size="11" font-family="monospace">TROPHIC TIER 5 • APEX PREDATORS</text>

            <!-- Tertiary (y: 190) -->
            <line x1="40" y1="190" x2="960" y2="190" stroke="#334155" stroke-dasharray="4 4" stroke-width="1" />
            <text x="50" y="180" fill="#94a3b8" font-size="11" font-family="monospace">TROPHIC TIER 4 • TERTIARY PREDATORS</text>

            <!-- Secondary (y: 290) -->
            <line x1="40" y1="290" x2="960" y2="290" stroke="#334155" stroke-dasharray="4 4" stroke-width="1" />
            <text x="50" y="280" fill="#94a3b8" font-size="11" font-family="monospace">TROPHIC TIER 3 • SECONDARY CONSUMERS & FORAGE FISH</text>

            <!-- Primary Consumer (y: 390) -->
            <line x1="40" y1="390" x2="960" y2="390" stroke="#334155" stroke-dasharray="4 4" stroke-width="1" />
            <text x="50" y="380" fill="#94a3b8" font-size="11" font-family="monospace">TROPHIC TIER 2 • PRIMARY CONSUMERS & ZOOPLANKTON</text>

            <!-- Primary Producer (y: 490) -->
            <line x1="40" y1="490" x2="960" y2="490" stroke="#334155" stroke-dasharray="4 4" stroke-width="1" />
            <text x="50" y="480" fill="#94a3b8" font-size="11" font-family="monospace">TROPHIC TIER 1 • PRIMARY PRODUCERS & NUTRIENT RECYCLERS</text>
          </g>

          <!-- Directed Feeding Edges (Bézier curves) -->
          <g class="edges">
            @for (edge of edges(); track edge.id) {
              <path
                [attr.d]="edge.path"
                [attr.stroke]="getEdgeStroke(edge)"
                [attr.stroke-width]="getEdgeWidth(edge)"
                [attr.stroke-dasharray]="getEdgeDash(edge)"
                [attr.opacity]="getEdgeOpacity(edge)"
                [attr.marker-end]="getEdgeMarker(edge)"
                fill="none"
                class="transition-all duration-300"
              />
            }
          </g>

          <!-- Organism Nodes -->
          <g class="nodes">
            @for (node of nodeViews(); track node.species.id) {
              <g
                [attr.transform]="'translate(' + node.cx + ',' + node.cy + ')'"
                (click)="onNodeClick($event, node.species)"
                (mouseenter)="onNodeMouseEnter(node.species)"
                (mouseleave)="onNodeMouseLeave()"
                class="cursor-pointer group"
                tabindex="0"
                (keydown.enter)="onNodeClick($event, node.species)"
                (keydown.space)="onNodeClick($event, node.species)"
                [attr.aria-label]="node.species.commonName + ' population ' + node.population"
              >
                <!-- Focus / Selected halo ring -->
                @if (isSelected(node.species.id) || isHighlighted(node.species.id)) {
                  <circle
                    r="40"
                    fill="none"
                    stroke="#38bdf8"
                    stroke-width="2"
                    stroke-dasharray="4 4"
                    class="animate-spin-slow opacity-80"
                  />
                }

                <!-- Extinct cross background if 0 -->
                @if (node.isExtinct) {
                  <circle
                    [attr.r]="node.radius"
                    fill="#1e293b"
                    stroke="#ef4444"
                    stroke-width="2.5"
                    stroke-dasharray="4 3"
                    class="opacity-70"
                  />
                  <!-- Extinct diagonal cross lines -->
                  <line x1="-12" y1="-12" x2="12" y2="12" stroke="#ef4444" stroke-width="2" />
                  <line x1="12" y1="-12" x2="-12" y2="12" stroke="#ef4444" stroke-width="2" />
                } @else {
                  <!-- Active Node Body Circle -->
                  <circle
                    [attr.r]="node.radius"
                    [attr.fill]="node.isHovered ? '#1e293b' : '#0f172a'"
                    [attr.stroke]="node.strokeColor"
                    [attr.stroke-width]="node.isHovered || isSelected(node.species.id) ? 3 : 2"
                    class="transition-all duration-200"
                  />

                  <!-- Inner Core Fill proportional to carrying capacity -->
                  <circle
                    [attr.r]="node.innerRadius"
                    [attr.fill]="node.species.color"
                    [attr.opacity]="node.innerOpacity"
                    class="transition-all duration-300 pointer-events-none"
                  />
                }

                <!-- Population Badge on Center/Top -->
                <text
                  x="0"
                  y="-2"
                  text-anchor="middle"
                  dominant-baseline="central"
                  class="font-mono font-bold select-none pointer-events-none transition-colors"
                  [attr.fill]="node.isExtinct ? '#ef4444' : '#f8fafc'"
                  [attr.font-size]="node.isExtinct ? '10' : '12'"
                >
                  {{ node.isExtinct ? '0.0' : node.population.toFixed(0) }}
                </text>

                <!-- Delta Badge below number -->
                @if (!node.isExtinct && node.deltaFromBase !== 0) {
                  <text
                    x="0"
                    y="13"
                    text-anchor="middle"
                    dominant-baseline="central"
                    class="font-mono font-medium select-none pointer-events-none"
                    [attr.fill]="node.deltaFromBase > 0 ? '#34d399' : '#f87171'"
                    font-size="9"
                  >
                    {{ node.deltaFromBase > 0 ? '+' : '' }}{{ node.deltaFromBase.toFixed(0) }}%
                  </text>
                }

                <!-- Organism Label Below Node -->
                <g [attr.transform]="'translate(0,' + (node.radius + 16) + ')'" class="pointer-events-none">
                  <!-- Name Box -->
                  <text
                    x="0"
                    y="0"
                    text-anchor="middle"
                    class="font-semibold select-none text-[11px] tracking-wide"
                    [attr.fill]="node.isHovered || isSelected(node.species.id) ? '#38bdf8' : '#e2e8f0'"
                  >
                    {{ node.species.commonName }}
                  </text>
                  <text
                    x="0"
                    y="12"
                    text-anchor="middle"
                    class="italic select-none text-[9px]"
                    fill="#94a3b8"
                  >
                    TL {{ node.species.trophicLevel.toFixed(1) }}
                  </text>
                </g>
              </g>
            }
          </g>
        </svg>

        <!-- Node Hover Quick Card (contextual overlay at bottom left of web) -->
        @if (hoveredNode(); as active) {
          <div class="absolute bottom-4 left-4 max-w-xs bg-slate-900/95 border border-slate-800 rounded-lg p-3 shadow-xl backdrop-blur-none z-20 pointer-events-auto">
            <div class="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-800">
              <div>
                <h4 class="text-xs font-bold text-slate-100">{{ active.species.commonName }}</h4>
                <p class="text-[10px] text-slate-400 italic">{{ active.species.scientificName }}</p>
              </div>
              <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300">
                TL {{ active.species.trophicLevel }}
              </span>
            </div>

            <!-- Stats -->
            <div class="grid grid-cols-2 gap-2 my-2 text-[11px] font-mono">
              <div class="bg-slate-950 p-1.5 rounded border border-slate-800/80">
                <span class="text-slate-400 block text-[9px]">POPULATION:</span>
                <span class="font-bold text-slate-100">{{ active.population.toFixed(1) }}</span>
                <span class="text-[9px] ml-1" [class]="active.deltaFromBase >= 0 ? 'text-emerald-400' : 'text-red-400'">
                  ({{ active.deltaFromBase >= 0 ? '+' : '' }}{{ active.deltaFromBase.toFixed(0) }}%)
                </span>
              </div>
              <div class="bg-slate-950 p-1.5 rounded border border-slate-800/80">
                <span class="text-slate-400 block text-[9px]">CAPACITY (K):</span>
                <span class="font-bold text-slate-300">{{ active.species.carryingCapacity }}</span>
              </div>
            </div>

            <!-- Immediate Trophic Links Summary -->
            <div class="text-[10px] space-y-1 mb-2">
              <div class="flex items-baseline gap-1">
                <span class="text-emerald-400 font-medium">Prey:</span>
                <span class="text-slate-300 truncate">
                  {{ active.species.preyIds.length > 0 ? getSpeciesNames(active.species.preyIds) : 'Autotroph (None)' }}
                </span>
              </div>
              <div class="flex items-baseline gap-1">
                <span class="text-rose-400 font-medium">Predators:</span>
                <span class="text-slate-300 truncate">
                  {{ active.species.predatorIds.length > 0 ? getSpeciesNames(active.species.predatorIds) : 'Apex (None)' }}
                </span>
              </div>
            </div>

            <!-- Quick Action Buttons -->
            <div class="flex items-center gap-1.5 pt-1.5 border-t border-slate-800">
              <button
                type="button"
                (click)="modifyPop(active.species.id, -25)"
                class="flex-1 py-1 text-[10px] rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-center"
                title="Reduce Population by 25%"
              >
                -25%
              </button>
              <button
                type="button"
                (click)="modifyPop(active.species.id, 25)"
                class="flex-1 py-1 text-[10px] rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-center"
                title="Increase Population by 25%"
              >
                +25%
              </button>
              @if (active.population > 0) {
                <button
                  type="button"
                  (click)="removeSpecies(active.species.id)"
                  class="px-2 py-1 text-[10px] rounded bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800 text-center"
                  title="Remove from ecosystem"
                >
                  Extirpate
                </button>
              } @else {
                <button
                  type="button"
                  (click)="restoreSpecies(active.species.id)"
                  class="px-2 py-1 text-[10px] rounded bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 text-center"
                  title="Restore to baseline"
                >
                  Restore
                </button>
              }
              <button
                type="button"
                (click)="openDossier(active.species.id)"
                class="px-2 py-1 text-[10px] rounded bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 text-center"
                title="Open Complete Biological Dossier"
              >
                Dossier
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    @keyframes spinSlow {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .animate-spin-slow {
      animation: spinSlow 16s linear infinite;
    }
  `]
})
export class FoodWebGraphComponent {
  readonly sim = inject(SimulationStateService);

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

      // Coordinate scaling: diagramPosition {x: 0-100, y: 0-100} -> 1000 x 600 svg
      const cx = (species.diagramPosition.x / 100) * 920 + 40;
      const cy = (species.diagramPosition.y / 100) * 520 + 40;

      // Radius scaling based on normalized population
      const normalizedRatio = Math.max(0.4, Math.min(pop / species.carryingCapacity, 1.8));
      const radius = isExtinct ? 22 : Math.max(20, Math.min(20 + normalizedRatio * 12, 36));

      // Inner fill indicator
      const innerRadius = Math.max(6, radius - 7);
      const innerOpacity = isExtinct ? 0 : Math.min(0.85, 0.2 + normalizedRatio * 0.4);

      // Stroke color by status
      let strokeColor = '#64748b'; // default slate
      if (isExtinct) {
        strokeColor = '#ef4444';
      } else if (deltaFromBase > 15) {
        strokeColor = '#10b981'; // booming
      } else if (deltaFromBase < -20) {
        strokeColor = '#f59e0b'; // declining
      }

      return {
        species,
        cx,
        cy,
        population: pop,
        deltaFromBase,
        isExtinct,
        radius,
        innerRadius,
        innerOpacity,
        strokeColor,
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

        // Calculate control point for elegant curved arrow from prey (lower) to predator (higher)
        const dx = predNode.cx - preyNode.cx;
        const dy = predNode.cy - preyNode.cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Angle
        const angle = Math.atan2(dy, dx);

        // Start at boundary of prey node, end at boundary of predator node
        const x1 = preyNode.cx + Math.cos(angle) * (preyNode.radius + 2);
        const y1 = preyNode.cy + Math.sin(angle) * (preyNode.radius + 2);
        const x2 = predNode.cx - Math.cos(angle) * (predNode.radius + 6);
        const y2 = predNode.cy - Math.sin(angle) * (predNode.radius + 6);

        // Quadratic curve offset
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const curvature = dist * 0.15;
        // Curve outwards horizontally
        const perpX = -Math.sin(angle) * curvature * (dx > 0 ? 1 : -1);
        const perpY = Math.cos(angle) * curvature * 0.4;

        const cx = midX + perpX;
        const cy = midY + perpY;

        const path = `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;

        result.push({
          id: `${preyId}->${predNode.species.id}`,
          preyId,
          predatorId: predNode.species.id,
          x1,
          y1,
          x2,
          y2,
          path
        });
      }
    }

    return result;
  });

  readonly hoveredNode = computed(() => {
    const id = this.hoveredNodeId();
    if (!id) return null;
    return this.nodeViews().find((n) => n.species.id === id) || null;
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

  openDossier(speciesId: SpeciesId) {
    this.sim.selectSpecies(speciesId);
  }

  getSpeciesNames(ids: SpeciesId[]): string {
    const map = this.sim.speciesMap();
    return ids
      .map((id) => map.get(id)?.commonName || id)
      .join(', ');
  }

  // Edge styling dynamics based on active hover or selection
  getEdgeStroke(edge: FoodWebEdge): string {
    const hovered = this.hoveredNodeId();
    const selected = this.sim.selectedSpeciesId();
    const activeId = hovered || selected;

    if (activeId) {
      if (edge.predatorId === activeId) {
        return '#10b981'; // Green: this edge is food/energy coming into active predator
      }
      if (edge.preyId === activeId) {
        return '#f43f5e'; // Rose/red: this edge is active prey being consumed by predator
      }
    }

    if (this.sim.highlightedSpeciesIds().has(edge.predatorId) && this.sim.highlightedSpeciesIds().has(edge.preyId)) {
      return '#38bdf8';
    }

    return '#334155'; // standard slate
  }

  getEdgeWidth(edge: FoodWebEdge): number {
    const hovered = this.hoveredNodeId();
    const selected = this.sim.selectedSpeciesId();
    const activeId = hovered || selected;

    if (activeId && (edge.predatorId === activeId || edge.preyId === activeId)) {
      return 2.5;
    }
    return 1.2;
  }

  getEdgeDash(edge: FoodWebEdge): string | null {
    const activeId = this.hoveredNodeId() || this.sim.selectedSpeciesId();
    if (activeId && (edge.predatorId === activeId || edge.preyId === activeId)) {
      return null; // solid highlight
    }
    return null;
  }

  getEdgeOpacity(edge: FoodWebEdge): number {
    const activeId = this.hoveredNodeId() || this.sim.selectedSpeciesId();
    if (activeId) {
      if (edge.predatorId === activeId || edge.preyId === activeId) {
        return 1.0;
      }
      return 0.15; // dim non-participating lines
    }
    return 0.55;
  }

  getEdgeMarker(edge: FoodWebEdge): string {
    const activeId = this.hoveredNodeId() || this.sim.selectedSpeciesId();
    if (activeId) {
      if (edge.predatorId === activeId) return 'url(#arrow-prey)';
      if (edge.preyId === activeId) return 'url(#arrow-predator)';
    }
    if (this.sim.highlightedSpeciesIds().has(edge.predatorId) && this.sim.highlightedSpeciesIds().has(edge.preyId)) {
      return 'url(#arrow-highlighted)';
    }
    return 'url(#arrow-default)';
  }
}
