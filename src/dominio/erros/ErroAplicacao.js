export class ErroAplicacao extends Error {
  constructor(mensagem, statusHttp = 400) {
    super(mensagem);
    this.name = 'ErroAplicacao';
    this.statusHttp = statusHttp;
  }
}
