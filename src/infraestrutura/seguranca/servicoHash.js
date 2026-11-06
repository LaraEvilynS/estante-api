import bcrypt from 'bcryptjs';

const CUSTO = 10;
// Hash de uma senha qualquer, usado para igualar o tempo de resposta quando o e-mail não existe.
const hashFalso = bcrypt.hashSync('senha-falsa-para-igualar-o-tempo', CUSTO);

export const servicoHash = {
  gerar: (senha) => bcrypt.hash(senha, CUSTO),
  comparar: (senha, hash) => bcrypt.compare(senha, hash),
  hashFalso,
};
