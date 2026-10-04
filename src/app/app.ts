import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { SimulationStateService } from './services/simulation-state';
import { HeaderComponent } from './components/header';
import { MetricsBarComponent } from './components/metrics-bar';
import { FoodWebGraphComponent } from './components/food-web-graph';
import { PopulationChartComponent } from './components/population-chart';
import { CausalExplanationComponent } from './components/causal-explanation';
import { ControlsPanelComponent } from './components/controls-panel';
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
    SpeciesDrawerComponent,
    ConceptsModalComponent,
    AboutModalComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  readonly sim = inject(SimulationStateService);

  readonly rightTab = signal<'causal' | 'controls'>('causal');

  readonly scenario = computed(() => this.sim.activeScenario());
}
