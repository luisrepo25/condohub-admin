import { provideExperimentalZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { VistaPrevia } from './reportes.service';
import { VistaPreviaTabla } from './vista-previa.tabla';

async function pintar(vista: VistaPrevia): Promise<HTMLElement> {
  TestBed.configureTestingModule({ providers: [provideExperimentalZonelessChangeDetection()] });
  const fixture = TestBed.createComponent(VistaPreviaTabla);
  fixture.componentRef.setInput('vista', vista);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

describe('vista previa del reporte (G4: verse en pantalla)', () => {
  it('G4_muestra_las_columnas_las_filas_y_cuantas_de_cuantas', async () => {
    const el = await pintar({
      columnas: ['codigo', 'deudaVencida'],
      filas: [['B-101', '540.00'], ['B-102', '270.00']],
      total: 60,
    });

    expect(Array.from(el.querySelectorAll('th')).map((c) => c.textContent?.trim())).toEqual(['codigo', 'deudaVencida']);
    const filas = Array.from(el.querySelectorAll('tbody tr')).map((f) =>
      Array.from(f.querySelectorAll('td')).map((c) => c.textContent?.trim()),
    );
    expect(filas).toEqual([
      ['B-101', '540.00'],
      ['B-102', '270.00'],
    ]);
    expect(el.querySelector('[role="status"]')?.textContent).toContain('Mostrando 2 de 60 filas');
  });

  it('G4_un_valor_nulo_se_ve_como_una_raya_y_no_como_la_palabra_null', async () => {
    const el = await pintar({ columnas: ['a', 'b'], filas: [['x', null]], total: 1 });

    expect(el.querySelectorAll('td')[1]?.textContent?.trim()).toBe('—');
  });

  it('G4_un_valor_con_marcado_se_muestra_como_texto_y_no_se_interpreta', async () => {
    const el = await pintar({ columnas: ['nombre'], filas: [['<img src=x onerror=alert(1)>']], total: 1 });

    expect(el.querySelector('img')).toBeNull();
    expect(el.querySelector('td')?.textContent).toBe('<img src=x onerror=alert(1)>');
  });

  it('G4_sin_resultados_lo_dice_en_vez_de_una_tabla_vacia', async () => {
    const el = await pintar({ columnas: [], filas: [], total: 0 });

    expect(el.querySelector('table')).toBeNull();
    expect(el.textContent).toContain('no devolvió resultados');
  });
});
