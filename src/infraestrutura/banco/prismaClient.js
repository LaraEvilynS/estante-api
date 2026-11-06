import { PrismaClient } from '@prisma/client';

// Única instância do cliente do banco, usada por toda a infraestrutura.
export const prisma = new PrismaClient();

export async function verificarBanco() {
  await prisma.$queryRaw`SELECT 1`;
}
