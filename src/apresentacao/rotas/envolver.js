// Express 4 não captura erros de funções async sozinho: este wrapper repassa o erro ao middleware global.
export const envolver = (funcao) => (req, res, next) => funcao(req, res, next).catch(next);
