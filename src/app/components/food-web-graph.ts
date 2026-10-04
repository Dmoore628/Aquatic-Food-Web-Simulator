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
    <div class="relative w-full h-[620px] lg:h-[680px] bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex flex-col select-none shadow-sm">
      <!-- Subdued Legend / Info Header -->
      <div class="px-5 py-3 bg-slate-900/80 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 z-10">
        <div class="flex items-center gap-3">
          <span class="text-xs font-bold text-slate-200 tracking-wider uppercase">
            Marine Food Web Network
          </span>
          <span class="text-xs text-slate-400 hidden md:inline">
            Directed energy flow (Prey &rarr; Predator). Node size represents population volume.
          </span>
        </div>

        <!-- High-Contrast Status Legend -->
        <div class="flex items-center gap-4 text-xs font-mono">
          <div class="flex items-center gap-1.5">
            <span class="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-400"></span>
            <span class="text-slate-300 font-sans">Surging (&gt;+15%)</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-3 h-3 rounded-full bg-slate-500 border border-slate-400"></span>
            <span class="text-slate-300 font-sans">Stable</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-3 h-3 rounded-full bg-amber-500 border border-amber-400"></span>
            <span class="text-slate-300 font-sans">Declining (&lt;-18%)</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-3 h-3 rounded-full bg-red-600 border border-red-500"></span>
            <span class="text-slate-300 font-sans">Extirpated</span>
          </div>
        </div>
      </div>

      <!-- Main Interactive SVG Canvas -->
      <div class="relative flex-1 w-full h-full bg-slate-950 overflow-hidden">
        <svg
          class="w-full h-full"
          viewBox="0 0 1000 660"
          preserveAspectRatio="xMidYMid meet"
        >
          <!-- Background click catcher -->
          <rect
            width="1000"
            height="660"
            fill="transparent"
            (click)="clearSelection()"
            class="cursor-default"
          />

          <!-- SVG Definitions for Marker Heads -->
          <defs>
            <marker
              id="arrow-default"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#475569" />
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

          <!-- Trophic Level Guidelines (Clear & Quiet) -->
          <g class="trophic-bands opacity-30 pointer-events-none">
            <!-- Tier 5 -->
            <line x1="30" y1="80" x2="970" y2="80" stroke="#334155" stroke-dasharray="3 4" stroke-width="1" />
            <text x="35" y="72" fill="#94a3b8" font-size="10" font-family="monospace">TIER 5 • APEX PREDATOR</text>

            <!-- Tier 4 -->
            <line x1="30" y1="190" x2="970" y2="190" stroke="#334155" stroke-dasharray="3 4" stroke-width="1" />
            <text x="35" y="182" fill="#94a3b8" font-size="10" font-family="monospace">TIER 4 • TERTIARY CONSUMERS</text>

            <!-- Tier 3 -->
            <line x1="30" y1="310" x2="970" y2="310" stroke="#334155" stroke-dasharray="3 4" stroke-width="1" />
            <text x="35" y="302" fill="#94a3b8" font-size="10" font-family="monospace">TIER 3 • SECONDARY CONSUMERS & FORAGE FISH</text>

            <!-- Tier 2 -->
            <line x1="30" y1="430" x2="970" y2="430" stroke="#334155" stroke-dasharray="3 4" stroke-width="1" />
            <text x="35" y="422" fill="#94a3b8" font-size="10" font-family="monospace">TIER 2 • PRIMARY CONSUMERS & ZOOPLANKTON</text>

            <!-- Tier 1 -->
            <line x1="30" y1="550" x2="970" y2="550" stroke="#334155" stroke-dasharray="3 4" stroke-width="1" />
            <text x="35" y="542" fill="#94a3b8" font-size="10" font-family="monospace">TIER 1 • PRIMARY PRODUCERS & RECYCLERS</text>
          </g>

          <!-- Directed Feeding Edges -->
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
                role="button"
                (keydown.enter)="onNodeClick($event, node.species)"
                (keydown.space)="onNodeClick($event, node.species)"
                [attr.aria-label]="node.species.commonName + ' population ' + node.population"
              >
                <!-- Selection / Cascade Halo -->
                @if (isSelected(node.species.id) || isHighlighted(node.species.id)) {
                  <circle
                    [attr.r]="node.radius + 12"
                    fill="none"
                    stroke="#38bdf8"
                    stroke-width="2.5"
                    stroke-dasharray="4 3"
                    class="opacity-90"
                  />
                }

                <!-- Booming Status Outward Pulse Glow -->
                @if (node.isSurging) {
                  <circle
                    [attr.r]="node.radius + 8"
                    fill="none"
                    stroke="#10b981"
                    stroke-width="2"
                    class="opacity-60"
                  />
                }

                <!-- Declining Warning Halo -->
                @if (node.isDeclining) {
                  <circle
                    [attr.r]="node.radius + 8"
                    fill="none"
                    stroke="#f59e0b"
                    stroke-width="2"
                    stroke-dasharray="3 3"
                    class="opacity-70"
                  />
                }

                <!-- Extinct Diagonal Slashes -->
                @if (node.isExtinct) {
                  <circle
                    [attr.r]="node.radius"
                    fill="#1e293b"
                    stroke="#ef4444"
                    stroke-width="3"
                    stroke-dasharray="4 3"
                    class="opacity-80"
                  />
                  <line x1="-14" y1="-14" x2="14" y2="14" stroke="#ef4444" stroke-width="2.5" />
                  <line x1="14" y1="-14" x2="-14" y2="14" stroke="#ef4444" stroke-width="2.5" />
                } @else {
                  <!-- Active Node Body (Radius reflects biomass volume) -->
                  <circle
                    [attr.r]="node.radius"
                    [attr.fill]="node.isHovered ? '#1e293b' : '#090d16'"
                    [attr.stroke]="node.strokeColor"
                    [attr.stroke-width]="node.strokeWidth"
                    class="transition-all duration-300"
                  />

                  <!-- Core Proportional Biomass Disc -->
                  <circle
                    [attr.r]="node.innerRadius"
                    [attr.fill]="node.species.color"
                    [attr.opacity]="node.innerOpacity"
                    class="transition-all duration-300 pointer-events-none"
                  />
                }

                <!-- Large High-Contrast Numeric Population Index in Center -->
                <text
                  x="0"
                  [attr.y]="node.isExtinct ? 0 : -3"
                  text-anchor="middle"
                  dominant-baseline="central"
                  class="font-mono font-bold select-none pointer-events-none tracking-tight"
                  [attr.fill]="node.isExtinct ? '#ef4444' : '#f8fafc'"
                  [attr.font-size]="node.isExtinct ? '11' : (node.radius > 32 ? '15' : '13')"
                >
                  {{ node.isExtinct ? '0' : node.population.toFixed(0) }}
                </text>

                <!-- High-Signal Status Delta Badge (Loud state indicator right on node) -->
                @if (node.isExtinct) {
                  <g transform="translate(0, 15)">
                    <rect x="-30" y="-8" width="60" height="15" rx="3" fill="#450a0a" stroke="#b91c1c" stroke-width="1" />
                    <text x="0" y="2" text-anchor="middle" dominant-baseline="central" fill="#fca5a5" font-size="8" font-family="monospace" font-weight="bold">
                      EXTIRPATED
                    </text>
                  </g>
                } @else if (node.deltaFromBase !== 0) {
                  <g [attr.transform]="'translate(0, ' + (node.radius > 32 ? 14 : 12) + ')'">
                    <rect
                      [attr.x]="node.deltaFromBase >= 0 ? -22 : -22"
                      y="-7"
                      width="44"
                      height="14"
                      rx="3"
                      [attr.fill]="node.deltaFromBase > 0 ? '#064e3b' : '#450a0a'"
                      [attr.stroke]="node.deltaFromBase > 0 ? '#059669' : '#dc2626'"
                      stroke-width="1"
                    />
                    <text
                      x="0"
                      y="1"
                      text-anchor="middle"
                      dominant-baseline="central"
                      [attr.fill]="node.deltaFromBase > 0 ? '#6ee7b7' : '#fca5a5'"
                      font-size="9"
                      font-family="monospace"
                      font-weight="bold"
                    >
                      {{ node.deltaFromBase > 0 ? '▲ +' : '▼ ' }}{{ node.deltaFromBase.toFixed(0) }}%
                    </text>
                  </g>
                }

                <!-- High-Contrast Species Name & Trophic Level Below Node -->
                <g [attr.transform]="'translate(0,' + (node.radius + 20) + ')'" class="pointer-events-none">
                  <text
                    x="0"
                    y="0"
                    text-anchor="middle"
                    class="font-bold select-none text-[12px] tracking-wide"
                    [attr.fill]="node.isHovered || isSelected(node.species.id) ? '#38bdf8' : '#f1f5f9'"
                  >
                    {{ node.species.commonName }}
                  </text>
                  <text
                    x="0"
                    y="14"
                    text-anchor="middle"
                    class="select-none font-mono text-[10px]"
                    fill="#94a3b8"
                  >
                    TL {{ node.species.trophicLevel.toFixed(1) }}
                  </text>
                </g>

                <!-- Direct On-Node Hover Controls (No need to navigate elsewhere to perturb) -->
                @if (node.isHovered) {
                  <g transform="translate(0, -42)" class="pointer-events-auto">
                    <!-- Reduce Button -->
                    <g (click)="onNodeQuickAdjust($event, node.species.id, -25)" class="cursor-pointer" title="Reduce population by 25%">
                      <circle cx="-26" cy="0" r="11" fill="#0f172a" stroke="#475569" stroke-width="1.5" />
                      <text x="-26" y="0" text-anchor="middle" dominant-baseline="central" fill="#e2e8f0" font-size="12" font-weight="bold">-</text>
                    </g>

                    <!-- Increase Button -->
                    <g (click)="onNodeQuickAdjust($event, node.species.id, 25)" class="cursor-pointer" title="Increase population by 25%">
                      <circle cx="0" cy="0" r="11" fill="#0f172a" stroke="#475569" stroke-width="1.5" />
                      <text x="0" y="0" text-anchor="middle" dominant-baseline="central" fill="#e2e8f0" font-size="12" font-weight="bold">+</text>
                    </g>

                    <!-- Extirpate / Restore Toggle Button -->
                    @if (node.population > 0) {
                      <g (click)="onNodeToggleExtirpate($event, node.species.id, true)" class="cursor-pointer" title="Extirpate species (set to 0)">
                        <circle cx="26" cy="0" r="11" fill="#450a0a" stroke="#dc2626" stroke-width="1.5" />
                        <text x="26" y="0" text-anchor="middle" dominant-baseline="central" fill="#fca5a5" font-size="11" font-weight="bold">&times;</text>
                      </g>
                    } @else {
                      <g (click)="onNodeToggleExtirpate($event, node.species.id, false)" class="cursor-pointer" title="Restore species to baseline">
                        <circle cx="26" cy="0" r="11" fill="#064e3b" stroke="#059669" stroke-width="1.5" />
                        <text x="26" y="0" text-anchor="middle" dominant-baseline="central" fill="#6ee7b7" font-size="10" font-weight="bold">&#8635;</text>
                      </g>
                    }
                  </g>
                }
              </g>
            }
          </g>
        </svg>

        <!-- Subtle Floating Helper Prompt (Bottom-Right) -->
        <div class="absolute bottom-4 right-4 bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-400 pointer-events-none hidden sm:block">
          <span class="text-slate-200 font-medium">Tip:</span> Hover any node to adjust with [-] / [+], or click for full biological dossier.
        </div>
      </div>
    </div>
  `
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

      // Coordinate scaling: percentage -> 1000 x 660 svg space
      const cx = (species.diagramPosition.x / 100) * 880 + 60;
      const cy = (species.diagramPosition.y / 100) * 540 + 60;

      // Dynamic Size: Radius scales with normalized biomass volume (22px to 44px)
      const ratio = Math.max(0.2, Math.min(pop / species.carryingCapacity, 1.8));
      const radius = isExtinct ? 22 : Math.max(22, Math.min(22 + ratio * 14, 44));

      const innerRadius = Math.max(8, radius - 8);
      const innerOpacity = isExtinct ? 0 : Math.min(0.85, 0.25 + ratio * 0.4);

      // Obvious visual states
      const isSurging = !isExtinct && deltaFromBase >= 15;
      const isDeclining = !isExtinct && deltaFromBase <= -18;

      let strokeColor = '#475569';
      let strokeWidth = 2;

      if (isExtinct) {
        strokeColor = '#ef4444';
        strokeWidth = 3;
      } else if (isSurging) {
        strokeColor = '#10b981'; // Bright emerald
        strokeWidth = 3.5;
      } else if (isDeclining) {
        strokeColor = '#f59e0b'; // Amber warning
        strokeWidth = 3;
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
        innerRadius,
        innerOpacity,
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
        const x2 = predNode.cx - Math.cos(angle) * (predNode.radius + 6);
        const y2 = predNode.cy - Math.sin(angle) * (predNode.radius + 6);

        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const curvature = dist * 0.14;
        const perpX = -Math.sin(angle) * curvature * (dx > 0 ? 1 : -1);
        const perpY = Math.cos(angle) * curvature * 0.35;

        const cx = midX + perpX;
        const cy = midY + perpY;

        result.push({
          id: `${preyId}->${predNode.species.id}`,
          preyId,
          predatorId: predNode.species.id,
          x1,
          y1,
          x2,
          y2,
          path: `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`
        });
      }
    }

    return result;
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

  onNodeQuickAdjust(event: Event, speciesId: SpeciesId, deltaPercent: number) {
    event.stopPropagation();
    const current = this.sim.currentPopulations()[speciesId] ?? 100;
    const next = Math.max(0, current * (1 + deltaPercent / 100));
    this.sim.setSpeciesPopulation(speciesId, next);
  }

  onNodeToggleExtirpate(event: Event, speciesId: SpeciesId, extirpate: boolean) {
    event.stopPropagation();
    if (extirpate) {
      this.sim.removeSpecies(speciesId);
    } else {
      this.sim.restoreSpecies(speciesId);
    }
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
        return '#10b981'; // Green (food entering active predator)
      }
      if (edge.preyId === activeId) {
        return '#f43f5e'; // Rose (prey consumed by predators)
      }
    }

    return '#334155';
  }

  getEdgeWidth(edge: FoodWebEdge): number {
    const isPairHighlighted =
      this.sim.highlightedSpeciesIds().has(edge.predatorId) &&
      this.sim.highlightedSpeciesIds().has(edge.preyId);

    if (isPairHighlighted) {
      return 3.5;
    }

    const activeId = this.hoveredNodeId() || this.sim.selectedSpeciesId();
    if (activeId && (edge.predatorId === activeId || edge.preyId === activeId)) {
      return 2.5;
    }
    return 1.2;
  }

  getEdgeDash(edge: FoodWebEdge): string | null {
    const isPairHighlighted =
      this.sim.highlightedSpeciesIds().has(edge.predatorId) &&
      this.sim.highlightedSpeciesIds().has(edge.preyId);

    if (isPairHighlighted) {
      return '5 3';
    }
    return null;
  }

  getEdgeOpacity(edge: FoodWebEdge): number {
    const isPairHighlighted =
      this.sim.highlightedSpeciesIds().has(edge.predatorId) &&
      this.sim.highlightedSpeciesIds().has(edge.preyId);

    if (isPairHighlighted) {
      return 1.0;
    }

    const activeId = this.hoveredNodeId() || this.sim.selectedSpeciesId();
    if (activeId) {
      if (edge.predatorId === activeId || edge.preyId === activeId) {
        return 1.0;
      }
      return 0.12;
    }

    if (this.sim.highlightedSpeciesIds().size > 0) {
      return 0.15;
    }
    return 0.45;
  }

  getEdgeMarker(edge: FoodWebEdge): string {
    const isPairHighlighted =
      this.sim.highlightedSpeciesIds().has(edge.predatorId) &&
      this.sim.highlightedSpeciesIds().has(edge.preyId);

    if (isPairHighlighted) {
      return 'url(#arrow-highlighted)';
    }

    const activeId = this.hoveredNodeId() || this.sim.selectedSpeciesId();
    if (activeId) {
      if (edge.predatorId === activeId) return 'url(#arrow-prey)';
      if (edge.preyId === activeId) return 'url(#arrow-predator)';
    }
    return 'url(#arrow-default)';
  }
}
