import { provideExperimentalZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { InformeTarjeta } from './informe.tarjeta';
import type { Informe } from './agente.service';

const informe = (extra: Partial<Informe> = {}): Informe => ({
  id: 'i1', generadoEn: '2026-10-31T05:07:00Z', resumen: '60 unidades morosas', origen: 'MANUAL', notificado: false, lineaBase: false,
  metricas: { unidadesMorosas: 60, deudaVencida: '27000.00', pagosPendientes: 4, diasPagoMasAntiguo: 18 },
  alertas: [{ tipo: 'PAGOS_SIN_CONCILIAR', severidad: 'ALTA', mensaje: 'Hay 4 pagos PENDIENTE de conciliar' }], ...extra,
});

async function pintar(i: Informe): Promise<string> {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [provideExperimentalZonelessChangeDetection()] });
  const f = TestBed.createComponent(InformeTarjeta);
  f.componentRef.setInput('informe', i);
  await f.whenStable();
  return ((f.nativeElement as HTMLElement).textContent ?? '').replace(/\s+/g, '');
}

describe('InformeTarjeta: lo que lee el agente de monitoreo (G5)', () => {
  it('G5_muestra_las_cuatro_metricas_de_la_lectura', async () => {
    const t = await pintar(informe());
    expect(t).toContain('Unidadesmorosas60');
    expect(t).toContain('Deudavencida27000.00');
    expect(t).toContain('Pagospendientes4');
    expect(t).toContain('Pagomásantiguo18días');
  });

  it('G5_marca_la_alerta_ALTA_y_dice_si_se_aviso_al_ADMIN', async () => {
    expect(await pintar(informe())).toContain('ALTA·Hay4pagosPENDIENTE');
    expect(await pintar(informe())).toContain('AúnnoseavisóalADMIN');
    expect(await pintar(informe({ notificado: true }))).toContain('SeavisóalADMIN');
  });

  it('G5_la_primera_lectura_se_marca_como_linea_base_sin_comparacion', async () => {
    expect(await pintar(informe({ lineaBase: true, alertas: [] }))).toContain('Primeralectura');
  });

  it('G5_sin_metricas_no_rompe', async () => {
    expect(await pintar(informe({ metricas: undefined }))).toContain('60unidadesmorosas');
  });
});
