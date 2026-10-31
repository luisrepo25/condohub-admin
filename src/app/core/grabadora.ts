/** Adaptador del micrófono del navegador (MediaRecorder): el reporte por voz (G4) recibe el audio resultante. */
export class Grabadora {
  private flujo: MediaStream | undefined;
  private grabador: MediaRecorder | undefined;
  private trozos: Blob[] = [];

  async iniciar(): Promise<void> {
    this.flujo = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.trozos = [];
    this.grabador = new MediaRecorder(this.flujo);
    this.grabador.ondataavailable = (e) => this.trozos.push(e.data);
    this.grabador.start();
  }

  detener(): Promise<Blob> {
    return new Promise((resolver) => {
      const grabador = this.grabador;
      if (!grabador || grabador.state === 'inactive') return resolver(new Blob(this.trozos));
      grabador.onstop = () => {
        this.liberar();
        resolver(new Blob(this.trozos, { type: grabador.mimeType || 'audio/webm' }));
      };
      grabador.stop();
    });
  }

  /** Apaga el micrófono; se llama al desmontar la pantalla (el shell monta y desmonta remotos). */
  liberar(): void {
    this.flujo?.getTracks().forEach((pista) => pista.stop());
    this.flujo = undefined;
  }
}
