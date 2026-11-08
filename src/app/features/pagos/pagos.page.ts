import { ChangeDetectionStrategy, Component, computed, Input, OnInit, signal } from '@angular/core';
import type { Api } from '../../core/api';
import { confirmar, pedirMotivo } from '../../core/confirmar';
import { fechaCorta } from '../../core/formato';
import { buscarPorUnidad, ordenarPagos, type OrdenPagos } from '../../core/listas';
import { PagosService } from './pagos.service';

@Component({
  selector: 'ch-pagos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ch-barra">
      <h2>Conciliación de pagos</h2>
      <button class="ch-boton" type="button" (click)="s.cargar()">Actualizar</button>
    </div>
    <p class="ch-etiqueta">Compara cada comprobante con el extracto. Al confirmar se emite el recibo y el pago se aplica a las deudas más antiguas.</p>
    @if (s.error(); as e) { <p class="ch-error" role="alert">{{ e }}</p> }
    @if (s.aviso(); as a) { <p class="ch-aviso" role="status">{{ a }}</p> }
    @if (s.pagos().length === 0) {
      <p class="ch-vacio">No hay pagos pendientes de conciliar.</p>
    } @else {
      <div class="ch-filtros">
        <input class="ch-campo" type="search" #q placeholder="Buscar unidad (ej. A-132)" aria-label="Buscar por unidad" (input)="busqueda.set(q.value)" />
        <select class="ch-campo" #o aria-label="Ordenar pagos" (change)="ordenar(o.value)">
          <option value="recientes">Más recientes</option><option value="antiguos">Más antiguos primero</option><option value="monto">Mayor monto</option>
        </select>
        <span class="ch-etiqueta">Mostrando {{ visibles().length }} de {{ s.pagos().length }}</span>
      </div>
      @if (visibles().length === 0) { <p class="ch-vacio">Ningún pago coincide con la búsqueda.</p> }
      <div class="ch-scroll"><table class="ch-tabla">
        <thead><tr><th>Unidad</th><th class="ch-der">Monto</th><th>Fecha del comprobante</th><th class="ch-der">Acciones</th></tr></thead>
        <tbody>
          @for (p of visibles(); track p.id) {
            <tr>
              <td>{{ p.unidad }}</td>
              <td class="ch-der">{{ p.monto }}</td>
              <td>{{ fecha(p.fechaPago) }}</td>
              <td class="ch-acciones">
                <button class="ch-boton" type="button" (click)="verComprobante(p.id)">Ver comprobante</button>
                <button class="ch-boton ch-boton--ok" type="button" (click)="confirmarPago(p.id, p.unidad)">Confirmar</button>
                <button class="ch-boton ch-boton--no" type="button" (click)="rechazarPago(p.id)">Rechazar</button>
              </td>
            </tr>
          }
        </tbody>
      </table></div>
    }
  `,
})
export class PagosPage implements OnInit {
  @Input({ required: true }) api!: Api;
  s!: PagosService;
  readonly fecha = fechaCorta;
  readonly busqueda = signal('');
  readonly orden = signal<OrdenPagos>('recientes');
  readonly visibles = computed(() => ordenarPagos(buscarPorUnidad(this.s.pagos(), this.busqueda()), this.orden()));

  ordenar(valor: string): void {
    this.orden.set(valor as OrdenPagos);
  }

  ngOnInit(): void {
    this.s = new PagosService(this.api);
    void this.s.cargar();
  }

  async verComprobante(id: string): Promise<void> {
    const url = await this.s.verComprobante(id);
    if (url) window.open(url, '_blank', 'noopener');
  }

  async confirmarPago(id: string, unidad: string): Promise<void> {
    if (await confirmar(`¿Confirmar el pago de la unidad ${unidad}? Se emite el recibo y se imputa a sus cargos.`, { aceptar: 'Sí, confirmar pago' })) void this.s.confirmar(id);
  }

  async rechazarPago(id: string): Promise<void> {
    const motivo = (await pedirMotivo('Motivo del rechazo (obligatorio):'))?.trim();
    if (motivo) void this.s.rechazar(id, motivo);
  }
}
