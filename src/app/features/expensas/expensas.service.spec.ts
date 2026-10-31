import type { Api } from '../../core/api';
import { ExpensasService, periodoValido, presupuestoValido } from './expensas.service';

const emision = { periodo: '2026-12', presupuesto: '60000.00', fechaVencimiento: '2026-12-10', unidades: 200, total: '60000.00' };

describe('ExpensasService (F3)', () => {
  it('F3_emite_el_periodo_con_el_presupuesto_y_muestra_cuantas_unidades_y_el_total', async () => {
    const graphql = jest.fn().mockResolvedValue({ emitirExpensas: emision });
    const servicio = new ExpensasService({ graphql, rest: jest.fn() } as unknown as Api);

    await servicio.emitir('2026-12', '60000.00');

    expect(graphql).toHaveBeenCalledWith(expect.stringContaining('emitirExpensas'), { periodo: '2026-12', presupuesto: '60000.00' });
    expect(servicio.emision()).toEqual(emision);
    expect(servicio.aviso()).toContain('2026-12');
  });

  it('F3_un_periodo_pasado_lo_rechaza_Gestion_y_se_muestra_su_codigo', async () => {
    const graphql = jest.fn().mockRejectedValue(new Error('No se puede emitir un mes pasado (F3)'));
    const servicio = new ExpensasService({ graphql, rest: jest.fn() } as unknown as Api);

    await servicio.emitir('2026-08', '60000.00');

    expect(servicio.error()).toContain('F3');
    expect(servicio.emision()).toBeNull();
  });

  it('F2_si_las_alicuotas_no_suman_100_se_muestra_el_error_de_Gestion', async () => {
    const graphql = jest.fn().mockRejectedValue(new Error('Las alícuotas no suman 100 % (F2)'));
    const servicio = new ExpensasService({ graphql, rest: jest.fn() } as unknown as Api);

    await servicio.emitir('2026-12', '1000');

    expect(servicio.error()).toContain('F2');
  });

  it('F10_un_presupuesto_o_un_mes_invalido_no_llega_a_Gestion', async () => {
    const graphql = jest.fn();
    const servicio = new ExpensasService({ graphql, rest: jest.fn() } as unknown as Api);

    await servicio.emitir('', '1000');
    expect(servicio.error()).toContain('mes');
    await servicio.emitir('2026-12', '0');
    expect(servicio.error()).toContain('presupuesto');
    await servicio.emitir('2026-12', '10.555');
    expect(servicio.error()).toContain('presupuesto');

    expect(graphql).not.toHaveBeenCalled();
  });
});

describe('validaciones de forma', () => {
  it('F10_el_presupuesto_es_un_decimal_positivo_de_hasta_2_decimales', () => {
    for (const ok of ['1', '60000', '60000.5', '60000.50', ' 10.00 ']) expect(presupuestoValido(ok)).toBe(true);
    for (const mal of ['', '0', '0.00', '-5', '10.555', 'abc', '1,5']) expect(presupuestoValido(mal)).toBe(false);
  });

  it('el_periodo_es_año_mes', () => {
    expect(periodoValido('2026-11')).toBe(true);
    for (const mal of ['', '2026-13', '2026-00', '26-11', '2026/11']) expect(periodoValido(mal)).toBe(false);
  });
});
