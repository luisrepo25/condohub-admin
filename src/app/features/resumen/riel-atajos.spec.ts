import { provideExperimentalZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ATAJOS_AGENTE } from './atajos';
import type { Resumen } from './resumen.service';
import { RielComponent } from './riel.component';

describe('RielComponent: pedir al agente', () => {
  async function pintar(datos: Partial<Resumen>) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideExperimentalZonelessChangeDetection()] });
    const f = TestBed.createComponent(RielComponent);
    f.componentRef.setInput('datos', datos as Resumen);
    const pedidos: string[] = [];
    f.componentInstance.pedir.subscribe((t) => pedidos.push(t));
    await f.whenStable();
    return { el: f.nativeElement as HTMLElement, pedidos };
  }

  it('G1_el_cuadro_se_llama_pedir_al_agente_y_explica_que_es_un_atajo_a_las_misiones', async () => {
    const { el } = await pintar({});

    expect(el.querySelector('h3')?.textContent).toContain('Pedir al agente');
    expect(el.textContent).toContain('Atajo a las misiones');
  });

  it('G2_pulsar_un_atajo_copia_el_texto_al_campo_pero_no_lanza_la_mision', async () => {
    const { el, pedidos } = await pintar({});

    (el.querySelector('.ch-ejemplos button') as HTMLButtonElement).click();

    expect((el.querySelector('input[aria-label="Pedido para el asistente"]') as HTMLInputElement).value).toBe(ATAJOS_AGENTE[0]);
    expect(pedidos).toEqual([]);
  });

  it('G5_el_resumen_del_monitoreo_se_muestra_aparte_y_con_su_nombre', async () => {
    const { el } = await pintar({ lectura: { resumen: '3 alertas' } } as Partial<Resumen>);

    expect(el.textContent).toContain('Último informe de monitoreo');
    expect(el.textContent).toContain('3 alertas');
  });

  it('G5_sin_informe_de_monitoreo_no_se_muestra_ese_bloque', async () => {
    const { el } = await pintar({});

    expect(el.textContent).not.toContain('Último informe de monitoreo');
  });
});
