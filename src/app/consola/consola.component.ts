import { ChangeDetectionStrategy, Component, Input, OnInit, signal, ViewEncapsulation } from '@angular/core';
import { crearApi, type Api } from '../core/api';
import { AgentePage } from '../features/agente/agente.page';
import { ExpensasPage } from '../features/expensas/expensas.page';
import { PagosPage } from '../features/pagos/pagos.page';
import { RecargosPage } from '../features/recargos/recargos.page';
import { ReservasPage } from '../features/reservas/reservas.page';
import { ReportesPage } from '../features/reportes/reportes.page';
import { SagasPage } from '../features/sagas/sagas.page';

type Pestana = 'expensas' | 'pagos' | 'recargos' | 'reservas' | 'sagas' | 'agente' | 'reportes';

const PESTANAS: { id: Pestana; titulo: string }[] = [
  { id: 'expensas', titulo: 'Expensas' },
  { id: 'pagos', titulo: 'Pagos' },
  { id: 'recargos', titulo: 'Recargos' },
  { id: 'reservas', titulo: 'Reservas' },
  { id: 'sagas', titulo: 'Sagas' },
  { id: 'agente', titulo: 'Agente' },
  { id: 'reportes', titulo: 'Reportes por voz' },
];

/** Consola del ADMIN: compone las pantallas por función. No calcula nada; los servicios decidiendo son los backends. */
@Component({
  selector: 'ch-consola',
  standalone: true,
  imports: [ExpensasPage, PagosPage, RecargosPage, ReservasPage, SagasPage, AgentePage, ReportesPage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: './consola.component.css',
  template: `
    <nav class="ch-pestanas" role="tablist" aria-label="Funciones de la consola">
      @for (p of pestanas; track p.id) {
        <button type="button" role="tab" [class.ch-activa]="actual() === p.id" [attr.aria-selected]="actual() === p.id" (click)="actual.set(p.id)">
          {{ p.titulo }}
        </button>
      }
    </nav>
    <section class="ch-panel" role="tabpanel">
      @switch (actual()) {
        @case ('expensas') { <ch-expensas [api]="api" /> }
        @case ('pagos') { <ch-pagos [api]="api" /> }
        @case ('recargos') { <ch-recargos [api]="api" /> }
        @case ('reservas') { <ch-reservas [api]="api" /> }
        @case ('sagas') { <ch-sagas [api]="api" /> }
        @case ('agente') { <ch-agente [api]="api" /> }
        @case ('reportes') { <ch-reportes [api]="api" /> }
      }
    </section>
  `,
})
export class ConsolaComponent implements OnInit {
  @Input({ required: true }) getToken!: () => string;
  readonly pestanas = PESTANAS;
  readonly actual = signal<Pestana>('expensas');
  api!: Api;

  ngOnInit(): void {
    this.api = crearApi(this.getToken);
  }
}
