import { ChangeDetectionStrategy, Component, computed, Input, OnInit, signal } from '@angular/core';
import type { Api } from '../../core/api';
import { confirmar, pedirMotivo } from '../../core/confirmar';
import { filtrarRecargos } from '../../core/listas';
import { RecargosService } from './recargos.service';

@Component({
  selector: 'ch-recargos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ch-barra">
      <h2>Recargos propuestos</h2>
      <button class="ch-boton" type="button" (click)="s.cargar()">Actualizar</button>
    </div>
    <p class="ch-etiqueta">Un recargo no se cobra hasta que lo confirmes.</p>
    @if (s.error(); as e) { <p class="ch-error" role="alert">{{ e }}</p> }
    @if (s.aviso(); as a) { <p class="ch-aviso" role="status">{{ a }}</p> }
    @if (s.recargos().length === 0) {
      <p class="ch-vacio">No hay recargos esperando confirmación.</p>
    } @else {
      <div class="ch-filtros">
        <input class="ch-campo" type="search" #q placeholder="Buscar unidad (ej. A-132)" aria-label="Buscar por unidad" (input)="busqueda.set(q.value)" />
        <select class="ch-campo" #o aria-label="Filtrar por origen" (change)="origen.set(o.value)">
          <option value="TODOS">Todos los orígenes</option><option value="AGENTE">Propuestos por el agente</option>
          <option value="SISTEMA">Propuestos por el sistema</option><option value="ADMIN">Propuestos por el admin</option>
        </select>
        <span class="ch-etiqueta">Mostrando {{ visibles().length }} de {{ s.recargos().length }}</span>
      </div>
      @if (visibles().length === 0) { <p class="ch-vacio">Ningún recargo coincide con el filtro.</p> }
      <div class="ch-scroll"><table class="ch-tabla">
        <thead><tr><th>Unidad</th><th>Periodo</th><th class="ch-der">Base</th><th class="ch-der">%</th><th class="ch-der">Monto</th><th>Origen</th><th class="ch-der">Acciones</th></tr></thead>
        <tbody>
          @for (r of visibles(); track r.id) {
            <tr>
              <td>{{ r.unidad }}</td><td>{{ r.periodo }}</td><td class="ch-der">{{ r.base }}</td>
              <td class="ch-der">{{ r.porcentaje }}</td><td class="ch-der">{{ r.monto }}</td><td>{{ r.origen }}</td>
              <td class="ch-acciones">
                <button class="ch-boton ch-boton--ok" type="button" (click)="confirmarRecargo(r.id, r.unidad, r.monto)">Confirmar</button>
                <button class="ch-boton ch-boton--no" type="button" (click)="rechazarRecargo(r.id)">Rechazar</button>
              </td>
            </tr>
          }
        </tbody>
      </table></div>
    }
  `,
})
export class RecargosPage implements OnInit {
  @Input({ required: true }) api!: Api;
  s!: RecargosService;
  readonly busqueda = signal('');
  readonly origen = signal('TODOS');
  readonly visibles = computed(() => filtrarRecargos(this.s.recargos(), { busqueda: this.busqueda(), origen: this.origen() }));

  ngOnInit(): void {
    this.s = new RecargosService(this.api);
    void this.s.cargar();
  }

  async confirmarRecargo(id: string, unidad: string, monto: string): Promise<void> {
    if (await confirmar(`¿Aplicar un recargo de ${monto} a la unidad ${unidad}? Se creará el cargo.`, { aceptar: 'Sí, aplicar recargo' })) void this.s.confirmar(id);
  }

  async rechazarRecargo(id: string): Promise<void> {
    const motivo = await pedirMotivo('Motivo del rechazo (opcional):');
    if (motivo !== null) void this.s.rechazar(id, motivo.trim());
  }
}
