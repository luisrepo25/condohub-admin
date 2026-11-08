import { provideExperimentalZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { Api } from '../../core/api';
import { ReportesPage } from './reportes.page';
import { ReportesService } from './reportes.service';

/**
 * G4: el selector de formato siempre mandaba «Excel» y ese valor pesa más que lo que se dice: «…en PDF» salía en Excel.
 * Con «Según la instrucción» el formato no se envía y el servicio lo toma de la orden (por defecto, Excel).
 */
describe('G4_formato_segun_la_instruccion', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  function servicio() {
    const rest = jest.fn().mockResolvedValue({ id: 'r1', estado: 'PROCESANDO' });
    return { rest, s: new ReportesService({ rest, graphql: jest.fn() } as unknown as Api) };
  }

  it('G4_por_texto_sin_formato_elegido_no_envia_el_campo_formato', async () => {
    const { rest, s } = servicio();

    await s.crearPorTexto('pagos pendientes en PDF', '');

    const cuerpo = rest.mock.calls[0][2] as FormData;
    expect(cuerpo.has('formato')).toBe(false);
    expect(cuerpo.get('instruccion')).toBe('pagos pendientes en PDF');
    s.detener();
  });

  it('G4_por_audio_sin_formato_elegido_no_envia_el_campo_formato', async () => {
    const { rest, s } = servicio();

    await s.crear(new Blob(['a']), '');

    expect((rest.mock.calls[0][2] as FormData).has('formato')).toBe(false);
    s.detener();
  });

  it('G4_un_formato_elegido_a_mano_se_sigue_enviando', async () => {
    const { rest, s } = servicio();

    await s.crearPorTexto('morosos', 'PDF');

    expect((rest.mock.calls[0][2] as FormData).get('formato')).toBe('PDF');
    s.detener();
  });

  it('G4_el_selector_arranca_en_segun_la_instruccion_y_ofrece_excel_y_pdf', async () => {
    jest.useRealTimers();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideExperimentalZonelessChangeDetection()] });
    const f = TestBed.createComponent(ReportesPage);
    f.componentRef.setInput('api', { rest: jest.fn().mockResolvedValue([]), graphql: jest.fn() } as unknown as Api);
    await f.whenStable();

    const selector = (f.nativeElement as HTMLElement).querySelector('select[aria-label="Formato del reporte"]') as HTMLSelectElement;
    const opciones = Array.from(selector.options).map((o) => [o.value, o.textContent?.trim()]);

    expect(selector.value).toBe('');
    expect(opciones).toEqual([['', 'Según la instrucción'], ['EXCEL', 'Excel'], ['PDF', 'PDF']]);
  });
});
