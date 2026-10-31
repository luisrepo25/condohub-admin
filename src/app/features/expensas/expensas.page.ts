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
    <p class="ch-etiqueta">
      Una expensa por unidad activa = presupuesto × alícuota (F3). Cada periodo se emite una sola vez, solo el mes actual o uno
      futuro, y las alícuotas deben sumar 100 % (F2).
    </p>
    <div class="ch-barra">
      <input class="ch-campo" #periodo type="month" aria-label="Mes a emitir" />
      <input class="ch-campo" #presupuesto type="text" inputmode="decimal" placeholder="Presupuesto mensual, ej. 60000.00" aria-label="Presupuesto mensual" />
      <button class="ch-boton ch-boton--ok" type="button" (click)="emitir(periodo.value, presupuesto.value)">Emitir expensas</button>
    </div>
    @if (s.error(); as e) { <p class="ch-error" role="alert">{{ e }}</p> }
    @if (s.emision(); as m) {
      <div class="ch-tarjeta" role="status">
        <p><strong>{{ s.aviso() }}</strong></p>
        <p>{{ m.unidades }} unidades · total {{ m.total }} (presupuesto {{ m.presupuesto }}) · vencen el {{ m.fechaVencimiento }}</p>
      </div>
    }
  `,
})
export class ExpensasPage implements OnInit {
  @Input({ required: true }) api!: Api;
  s!: ExpensasService;

  ngOnInit(): void {
    this.s = new ExpensasService(this.api);
  }

  emitir(periodo: string, presupuesto: string): void {
    if (confirmar(`¿Emitir las expensas de ${periodo || 'ese mes'} con un presupuesto de ${presupuesto || '…'}? Se crea un cargo por cada unidad.`)) {
      void this.s.emitir(periodo, presupuesto);
    }
  }
}
