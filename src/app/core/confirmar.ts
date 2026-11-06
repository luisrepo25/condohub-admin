export interface OpcionesDialogo {
  aceptar?: string;
  peligro?: boolean;
}

function crearBoton(texto: string, clase: string): HTMLButtonElement {
  const boton = document.createElement('button');
  boton.type = 'button';
  boton.textContent = texto;
  boton.className = `ch-boton ${clase}`;
  return boton;
}

/** Abre el diálogo; resuelve con el texto escrito (o '') al aceptar y con `null` al cancelar o pulsar Esc. */
function abrir(mensaje: string, opciones: OpcionesDialogo, campo?: HTMLInputElement): Promise<string | null> {
  return new Promise((resolver) => {
    const dialogo = document.createElement('dialog');
    dialogo.className = 'ch-dialogo';
    const texto = document.createElement('p');
    texto.textContent = mensaje;
    const acciones = document.createElement('div');
    acciones.className = 'ch-dialogo-acciones';
    const cancelar = crearBoton('Volver', '');
    const aceptar = crearBoton(opciones.aceptar ?? 'Confirmar', opciones.peligro ? 'ch-boton--no' : 'ch-boton--ok');
    let resultado: string | null = null;
    cancelar.onclick = () => dialogo.close();
    aceptar.onclick = () => {
      resultado = campo?.value.trim() ?? '';
      dialogo.close();
    };
    dialogo.onclose = () => {
      dialogo.remove();
      resolver(resultado);
    };
    acciones.append(cancelar, aceptar);
    dialogo.append(texto, ...(campo ? [campo] : []), acciones);
    document.body.append(dialogo);
    dialogo.showModal();
    (campo ?? aceptar).focus();
  });
}

/** Las acciones irreversibles (confirmar un pago, aplicar un recargo) piden confirmación; aislado para poder probarlo. */
export async function confirmar(mensaje: string, opciones: OpcionesDialogo = {}): Promise<boolean> {
  return (await abrir(mensaje, opciones)) !== null;
}

/** Pide el motivo de un rechazo; `null` si el ADMIN cancela. */
export function pedirMotivo(mensaje: string): Promise<string | null> {
  const campo = document.createElement('input');
  campo.type = 'text';
  campo.maxLength = 300;
  campo.className = 'ch-campo';
  campo.setAttribute('aria-label', mensaje);
  return abrir(mensaje, { aceptar: 'Rechazar', peligro: true }, campo);
}
