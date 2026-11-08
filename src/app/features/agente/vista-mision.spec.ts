import { describirAccion } from './accion-pendiente';
import { formatearResumen, uuidsDe } from './texto-resumen';

const A132 = '03e3ea31-51e1-46c4-9516-9b4ec9558af3';
const codigos = new Map([[A132, 'A-132']]);

describe('G1_resumen_de_la_mision_legible', () => {
  it('G1_quita_los_asteriscos_y_deja_el_texto_en_negrita_por_partes', () => {
    const [linea] = formatearResumen('1. **Consulta de morosos** – Se obtuvo la lista', codigos);

    expect(linea.tipo).toBe('item');
    expect(linea.partes).toEqual([
      { texto: 'Consulta de morosos', negrita: true },
      { texto: ' – Se obtuvo la lista', negrita: false },
    ]);
    expect(JSON.stringify(linea)).not.toContain('**');
  });

  it('G1_una_linea_toda_en_negrita_es_un_titulo', () => {
    expect(formatearResumen('**Pendientes**', codigos)[0].tipo).toBe('titulo');
  });

  it('G1_las_viñetas_con_sangria_son_subitems_y_se_ignoran_las_lineas_vacias', () => {
    const lineas = formatearResumen('2. **Cálculo**\n\n   * $1 170,00 → $23,40\n- Pendiente', codigos);

    expect(lineas.map((l) => l.tipo)).toEqual(['item', 'subitem', 'item']);
  });

  it('G1_cambia_el_uuid_de_una_unidad_por_su_codigo_incluso_con_guiones_unicode', () => {
    const conGuionesRaros = A132.replace(/-/g, '‑');
    const [linea] = formatearResumen(`   * ${conGuionesRaros}`, codigos);

    expect(linea.partes.map((p) => p.texto).join('')).toBe('A-132');
  });

  it('G1_un_uuid_desconocido_se_acorta_en_lugar_de_mostrarse_entero', () => {
    const [linea] = formatearResumen('Unidad e880d4d6-c7d2-4eee-ab2f-3709d6b486d1', codigos);

    expect(linea.partes.map((p) => p.texto).join('')).toBe('Unidad e880d4d6…');
  });

  it('G1_uuidsDe_encuentra_los_ids_para_resolver_sus_codigos_una_sola_vez', () => {
    const texto = `${A132} y ${A132.replace(/-/g, '‑')}`;

    expect(uuidsDe(texto)).toEqual([A132]);
  });
});

describe('G2_accion_pendiente_legible', () => {
  it('G2_proponer_recargo_muestra_unidad_monto_motivo_y_que_no_se_cobra_nada', () => {
    const d = describirAccion(
      { id: 'c1', herramienta: 'proponer_recargo', riesgo: 'DINERO', estado: 'PENDIENTE', argumentos: { unidadId: A132, monto: '23.40', motivo: 'Mora de 1 mes' } },
      codigos,
    );

    expect(d.titulo).toBe('Proponer recargo');
    expect(d.lineas).toEqual([['Unidad', 'A-132'], ['Monto', '23.40'], ['Motivo', 'Mora de 1 mes']]);
    expect(d.nota).toContain('no se cobra nada');
  });

  it('G2_enviar_recordatorio_muestra_el_mensaje_que_saldra', () => {
    const d = describirAccion(
      { id: 'c2', herramienta: 'enviar_recordatorio', riesgo: 'ESCRITURA', estado: 'PENDIENTE', argumentos: { unidadId: A132, mensaje: 'Regularice su deuda' } },
      codigos,
    );

    expect(d.titulo).toBe('Enviar recordatorio');
    expect(d.lineas).toContainEqual(['Mensaje', 'Regularice su deuda']);
  });

  it('G2_una_herramienta_desconocida_no_rompe_y_muestra_sus_datos', () => {
    const d = describirAccion({ id: 'c3', herramienta: 'otra', riesgo: 'ESCRITURA', estado: 'PENDIENTE', argumentos: { x: 1 } }, codigos);

    expect(d.titulo).toBe('otra');
    expect(d.lineas).toEqual([['x', '1']]);
  });
});
