/** Fecha ISO (yyyy-MM-dd) a dd/MM/yyyy sin pasar por Date, para no moverla de día por la zona horaria. */
export function fechaCorta(iso: string): string {
  const partes = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return partes ? `${partes[3]}/${partes[2]}/${partes[1]}` : iso;
}
