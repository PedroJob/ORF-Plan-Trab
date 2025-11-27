import { Prisma } from "@prisma/client";

export type PlanoTrabalhoWithRelations = Prisma.PlanoTrabalhoGetPayload<{
  include: {
    om: {
      select: {
        id: true;
        nome: true;
        sigla: true;
        tipo: true;
      };
    };
    operacao: true;
    despesas: true;
    documentosReferencia: true;
    responsavel: true;
  };
}>;
