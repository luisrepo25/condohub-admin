import { ChangeDetectionStrategy, Component, computed, Input, OnInit, signal, ViewEncapsulation } from '@angular/core';
import { crearApi, type Api } from '../core/api';
import { observarEscrituras } from '../core/api-observada';
import { AgentePage } from '../features/agente/agente.page';
import { ExpensasPage } from '../features/expensas/expensas.page';
import { PagosPage } from '../features/pagos/pagos.page';
import { RecargosPage } from '../features/recargos/recargos.page';
import { ReservasPage } from '../features/reservas/reservas.page';
import { ReportesPage } from '../features/reportes/reportes.page';
import { ResumenService, type Resumen } from '../features/resumen/resumen.service';
import { ResumenTarjetas } from '../features/resumen/resumen.tarjetas';
import { RielComponent } from '../features/resumen/riel.component';
import { SagasPage } from '../features/sagas/sagas.page';
import { GRUPOS, type Pestana } from './pestanas';

/** Consola del ADMIN: compone las pantallas por función. No calcula nada; los servicios decidiendo son los backends. */
@Component({
  selector: 'ch-consola',
  standalone: true,
  imports: [ExpensasPage, PagosPage, RecargosPage, ReservasPage, SagasPage, AgentePage, ReportesPage, ResumenTarjetas, RielComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['./consola.component.css', './consola.controles.css', './consola.datos.css'],
  templateUrl: './consola.component.html',
})
export class ConsolaComponent implements OnInit {
  @Input({ required: true }) getToken!: () => string;
  readonly grupos = GRUPOS;
  readonly actual = signal<Pestana>('expensas');
  readonly pedido = signal<{ texto: string } | null>(null);
  api!: Api;
  resumen!: ResumenService;
  readonly datos = computed<Resumen>(() => this.resumen.datos());

  ngOnInit(): void {
    const base = crearApi(this.getToken);
    this.resumen = new ResumenService(base);
    this.api = observarEscrituras(base, () => void this.resumen.cargar());
    void this.resumen.cargar();
  }

  ir(pestana: string): void {
    this.pedido.set(null);
    this.actual.set(pestana as Pestana);
    void this.resumen.cargar();
  }

  /** Lo que se pide en el asistente se lanza como misión en la pantalla del agente. */
  pedir(texto: string): void {
    this.pedido.set({ texto });
    this.actual.set('agente');
  }

  cuenta(pestana: Pestana): number | null {
    const d = this.datos();
    const cuentas: Partial<Record<Pestana, number | null>> = { pagos: d.pagosPendientes, recargos: d.recargosPropuestos, sagas: d.sagasEnRevision };
    return cuentas[pestana] || null;
  }
}
