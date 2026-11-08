import { provideExperimentalZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { Resumen } from './resumen.service';
import { RielComponent } from './riel.component';

describe('RielComponent: columna de apoyo', () => {
  async function pintar(datos: Partial<Resumen>) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideExperimentalZonelessChangeDetection()] });
    const f = TestBed.createComponent(RielComponent);
    f.componentRef.setInput('datos', datos as Resumen);
    let aperturas = 0;
    f.componentInstance.abrir.subscribe(() => aperturas++);
    await f.whenStable();
    return { el: f.nativeElement as HTMLElement, aperturas: () => aperturas };
  }

  it('G1_la_columna_no_tiene_un_segundo_campo_para_lanzar_misiones', async () => {
    const { el } = await pintar({});

    expect(el.querySelector('input')).toBeNull();
    expect(el.textContent).not.toContain('Pedir al agente');
  });

  it('G1_el_boton_abrir_agente_lleva_a_la_pantalla_de_misiones', async () => {
    const { el, aperturas } = await pintar({});

    (el.querySelector('button[aria-label="Abrir el agente"]') as HTMLButtonElement).click();

    expect(aperturas()).toBe(1);
  });

  it('G5_el_resumen_del_monitoreo_se_muestra_con_su_nombre', async () => {
    const { el } = await pintar({ lectura: { resumen: '3 alertas' } } as Partial<Resumen>);

    expect(el.textContent).toContain('Último informe de monitoreo');
    expect(el.textContent).toContain('3 alertas');
  });

  it('G5_sin_informe_de_monitoreo_no_se_muestra_ese_bloque', async () => {
    const { el } = await pintar({});

    expect(el.textContent).not.toContain('Último informe de monitoreo');
  });
});
