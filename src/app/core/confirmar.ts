/** Las acciones irreversibles (confirmar un pago, aplicar un recargo) piden confirmación; aislado para poder probarlo. */
export function confirmar(mensaje: string): boolean {
  return globalThis.confirm(mensaje);
}

/** Pide el motivo de un rechazo; `null` si el ADMIN cancela. */
export function pedirMotivo(mensaje: string): string | null {
  return globalThis.prompt(mensaje);
}
