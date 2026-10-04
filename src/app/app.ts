import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { SimulationStateService } from './services/simulation-state';
import { HeaderComponent } from './components/header';
import { MetricsBarComponent } from './components/metrics-bar';
import { FoodWebGraphComponent } from './components/food-web-graph';
import { PopulationChartComponent } from './components/population-chart';
import { CausalExplanationComponent } from './components/causal-explanation';
import { ControlsPanelComponent } from './components/controls-panel';
import { TrophicPyramidComponent } from './components/trophic-pyramid';
import { SpeciesDrawerComponent } from './components/species-drawer';
import { ConceptsModalComponent } from './components/concepts-modal';
import { AboutModalComponent } from './components/about-modal';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatIconModule,
    HeaderComponent,
    MetricsBarComponent,
    FoodWebGraphComponent,
    PopulationChartComponent,
    CausalExplanationComponent,
    ControlsPanelComponent,
    TrophicPyramidComponent,
    SpeciesDrawerComponent,
    ConceptsModalComponent,
    AboutModalComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  readonly sim = inject(SimulationStateService);

  // Progressive Disclosure: by default, null (clean canvas focus)
  readonly activeDrawer = signal<'causal' | 'chart' | 'pyramid' | 'controls' | null>(null);

  readonly scenario = computed(() => this.sim.activeScenario());

  readonly hasActiveDisturbance = computed(() => {
    return this.sim.causalEvents().length > 0;
  });

  toggleDrawer(drawer: 'causal' | 'chart' | 'pyramid' | 'controls') {
    if (this.activeDrawer() === drawer) {
      this.activeDrawer.set(null);
    } else {
      this.activeDrawer.set(drawer);
    }
  }

  closeDrawer() {
    this.activeDrawer.set(null);
  }
}
