import { provideExperimentalZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { Api } from '../../core/api';
import { EJEMPLOS_REPORTE } from '../reportes/ejemplos';
import { AgentePage } from './agente.page';
import { EJEMPLOS_MISION } from './ejemplos';

describe('ejemplos de uso en la consola', () => {
  it('G1_los_ejemplos_de_mision_caben_en_el_limite_del_objetivo_y_no_se_repiten', () => {
    expect(new Set(EJEMPLOS_MISION).size).toBe(EJEMPLOS_MISION.length);
    for (const e of EJEMPLOS_MISION) expect(e.length > 0 && e.length <= 500).toBe(true);
  });

  it('G4_los_ejemplos_de_reporte_caben_en_el_limite_de_la_instruccion_y_no_se_repiten', () => {
    expect(new Set(EJEMPLOS_REPORTE).size).toBe(EJEMPLOS_REPORTE.length);
    for (const e of EJEMPLOS_REPORTE) expect(e.length > 0 && e.length <= 1000).toBe(true);
  });

  it('G1_al_pulsar_un_ejemplo_se_copia_al_campo_pero_no_lanza_la_mision', async () => {
    TestBed.configureTestingModule({ providers: [provideExperimentalZonelessChangeDetection()] });
    const rest = jest.fn().mockResolvedValue([]);
    const f = TestBed.createComponent(AgentePage);
    f.componentRef.setInput('api', { rest, graphql: jest.fn() } as unknown as Api);
    await f.whenStable();
    const el = f.nativeElement as HTMLElement;

    const chip = Array.from(el.querySelectorAll('.ch-ejemplos button')).find((b) => b.textContent?.includes('reservas')) as HTMLButtonElement;
    chip.click();

    expect((el.querySelector('input[aria-label="Objetivo de la misión"]') as HTMLInputElement).value).toContain('reservas');
    expect(rest).not.toHaveBeenCalledWith('POST', '/agentes/misiones', expect.anything());
  });
});
