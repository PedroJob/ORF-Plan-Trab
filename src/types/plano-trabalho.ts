import { Prisma } from "@prisma/client";

export type PlanoTrabalhoWithRelations = Prisma.PlanoTrabalhoGetPayload<{
  include: {
    operacao: true;
    despesas: true;
    documentosReferencia: true;
    responsavel: true;
  };
}>;
