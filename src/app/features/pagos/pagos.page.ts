import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import type { Api } from '../../core/api';
import { confirmar, pedirMotivo } from '../../core/confirmar';
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
    @if (s.error(); as e) { <p class="ch-error" role="alert">{{ e }}</p> }
    @if (s.aviso(); as a) { <p class="ch-aviso" role="status">{{ a }}</p> }
    @if (s.pagos().length === 0) {
      <p class="ch-vacio">No hay pagos pendientes de conciliar.</p>
    } @else {
      <table class="ch-tabla">
        <thead><tr><th>Unidad</th><th>Monto</th><th>Fecha del comprobante</th><th>Acciones</th></tr></thead>
        <tbody>
          @for (p of s.pagos(); track p.id) {
            <tr>
              <td>{{ p.unidad }}</td>
              <td>{{ p.monto }}</td>
              <td>{{ p.fechaPago }}</td>
              <td class="ch-acciones">
                <button class="ch-boton ch-boton--ok" type="button" (click)="confirmarPago(p.id, p.unidad)">Confirmar</button>
                <button class="ch-boton ch-boton--no" type="button" (click)="rechazarPago(p.id)">Rechazar</button>
              </td>
            </tr>
          }
        </tbody>
      </table>
    }
  `,
})
export class PagosPage implements OnInit {
  @Input({ required: true }) api!: Api;
  s!: PagosService;

  ngOnInit(): void {
    this.s = new PagosService(this.api);
    void this.s.cargar();
  }

  confirmarPago(id: string, unidad: string): void {
    if (confirmar(`¿Confirmar el pago de la unidad ${unidad}? Se emite el recibo y se imputa a sus cargos.`)) void this.s.confirmar(id);
  }

  rechazarPago(id: string): void {
    const motivo = pedirMotivo('Motivo del rechazo (obligatorio):')?.trim();
    if (motivo) void this.s.rechazar(id, motivo);
  }
}
