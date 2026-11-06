import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import type { Api } from '../../core/api';
import { confirmar } from '../../core/confirmar';
import { ExpensasService } from './expensas.service';

@Component({
  selector: 'ch-expensas',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2>Emisión de expensas</h2>
    <p class="ch-etiqueta">Reparte el presupuesto del mes entre las unidades activas según su alícuota. Cada mes se emite una sola vez.</p>
    <div class="ch-barra">
      <label class="ch-rotulo">Mes<input class="ch-campo" #periodo type="month" aria-label="Mes a emitir" /></label>
      <label class="ch-rotulo">Presupuesto mensual<input class="ch-campo" #presupuesto type="text" inputmode="decimal" placeholder="Ej. 60000.00" aria-label="Presupuesto mensual" /></label>
      <button class="ch-boton ch-boton--ok" type="button" (click)="emitir(periodo.value, presupuesto.value)">Emitir expensas</button>
    </div>
    @if (s.error(); as e) { <p class="ch-error" role="alert">{{ e }}</p> }
    @if (s.emision(); as m) {
      <div class="ch-tarjeta" role="status">
        <p><strong>{{ s.aviso() }}</strong></p>
        <p>{{ m.unidades }} unidades · total {{ m.total }} (presupuesto {{ m.presupuesto }}) · vencen el {{ m.fechaVencimiento }}</p>
      </div>
    }
    <ul class="ch-pistas">
      <li><strong>Alícuotas al 100 %</strong><span>Si no suman 100 %, no se puede emitir.</span></li>
      <li><strong>Mes actual o futuro</strong><span>Un mes pasado se rechaza para no crear deudas ya vencidas.</span></li>
      <li><strong>Vence el día 10</strong><span>Desde el día 11, un cargo impago deja a la unidad en mora.</span></li>
    </ul>
  `,
})
export class ExpensasPage implements OnInit {
  @Input({ required: true }) api!: Api;
  s!: ExpensasService;

  ngOnInit(): void {
    this.s = new ExpensasService(this.api);
  }

  async emitir(periodo: string, presupuesto: string): Promise<void> {
    if (await confirmar(`¿Emitir las expensas de ${periodo || 'ese mes'} con un presupuesto de ${presupuesto || '…'}? Se crea un cargo por cada unidad.`, { aceptar: 'Sí, emitir' })) {
      void this.s.emitir(periodo, presupuesto);
    }
  }
}
