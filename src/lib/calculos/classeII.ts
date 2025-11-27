export interface ItemManutencao {
  tipo: string;
  quantidade: number;
  mntDia: number;
  periodoDias: number;
}

export type TipoMaterialClasseII =
  | "EQUIPAMENTO_INDIVIDUAL"
  | "MATERIAL_BALISTICO"
  | "ESTACIONAMENTO_ALOJAMENTO";

export interface MaterialEquipamentoIndividual {
  tipo: "EQUIPAMENTO_INDIVIDUAL";
  numeroMilitares: number;
  periodoDias: number;
}

export interface MaterialBalistico {
  tipo: "MATERIAL_BALISTICO";
  itens: ItemManutencao[];
}

export interface MaterialEstacionamento {
  tipo: "ESTACIONAMENTO_ALOJAMENTO";
  itens: ItemManutencao[];
}

export type MaterialClasseII =
  | MaterialEquipamentoIndividual
  | MaterialBalistico
  | MaterialEstacionamento;

export interface ParametrosClasseII {
  materiais: MaterialClasseII[];
}

// Interface antiga mantida para compatibilidade
export interface ParametrosClasseIILegacy {
  tipoCalculo:
    | "EQUIPAMENTO_INDIVIDUAL"
    | "MATERIAL_BALISTICO"
    | "ESTACIONAMENTO_ALOJAMENTO"
    | "FARDAMENTO"
    | "PERSONALIZADO";
  numeroMilitares?: number;
  periodoDias?: number;
  numeroUsuarios?: number;
  itens?: ItemManutencao[];
  valorFardamento?: number;
}

export interface ResultadoClasseII {
  valorTotal: number;
  carimbo: string;
}

export const VALORES_MANUTENCAO = {
  EQUIPAMENTO_INDIVIDUAL_DIA: 2.42, // R$/dia por militar

  CAPACETE_DIA: 3.23,
  COLETE_DIA: 2.56,
  BALISTICO_TOTAL_DIA: 5.79, // 3.23 + 2.56

  BARRACA_CAMPANHA: 7.55,
  TOLDO: 1.88,
  BARRACA_INDIVIDUAL: 0.26,
  CAMA: 0.32,
  ARMARIO: 0.82,
  BELICHE: 0.66,
  COLCHAO: 0.28,
};

export const VIDA_UTIL = {
  EQUIPAMENTO_INDIVIDUAL: 3,
  CAPACETE: 5,
  COLETE: 7,
  ESTACIONAMENTO_ALOJAMENTO: 5,
};

export function calcularEquipamentoIndividual(
  numeroMilitares: number,
  periodoDias: number
): number {
  if (numeroMilitares <= 0 || periodoDias <= 0) {
    throw new Error("Número de militares e período devem ser maiores que zero");
  }

  return (
    numeroMilitares *
    VALORES_MANUTENCAO.EQUIPAMENTO_INDIVIDUAL_DIA *
    periodoDias
  );
}

/**
 * Cálculo para Material Balístico
 * Fórmula: custo = (n_usuarios × 5,79) × periodo_dias
 */
export function calcularMaterialBalistico(
  numeroUsuarios: number,
  periodoDias: number
): number {
  if (numeroUsuarios <= 0 || periodoDias <= 0) {
    throw new Error("Número de usuários e período devem ser maiores que zero");
  }

  return numeroUsuarios * VALORES_MANUTENCAO.BALISTICO_TOTAL_DIA * periodoDias;
}

/**
 * Cálculo para Estacionamento/Alojamento ou Personalizado
 * Fórmula: custo = Σ(quantidade_item × mnt_dia_item) × periodo_dias
 */
export function calcularItens(itens: ItemManutencao[]): number {
  if (!itens || itens.length === 0) {
    throw new Error("Deve haver pelo menos um item");
  }

  let total = 0;

  for (const item of itens) {
    if (item.quantidade <= 0 || item.mntDia < 0 || item.periodoDias <= 0) {
      throw new Error(`Valores inválidos para o item "${item.tipo}"`);
    }

    total += item.quantidade * item.mntDia * item.periodoDias;
  }

  return total;
}

/**
 * Calcula o valor de um único material e gera a string do carimbo
 */
function calcularMaterial(material: MaterialClasseII): {
  valor: number;
  carimboTexto: string;
} {
  let valor = 0;
  let carimboTexto = "";

  switch (material.tipo) {
    case "EQUIPAMENTO_INDIVIDUAL": {
      valor = calcularEquipamentoIndividual(
        material.numeroMilitares,
        material.periodoDias
      );

      carimboTexto = `EQUIPAMENTO INDIVIDUAL (cantil, caneco, cinto de campanha, marmita, mochilas, saco de campanha):
Memória de cálculo: ${
        material.numeroMilitares
      } (militares empregados) x R$ ${VALORES_MANUTENCAO.EQUIPAMENTO_INDIVIDUAL_DIA.toFixed(
        2
      )} (custo de mnt diário) x ${
        material.periodoDias
      } dias = R$ ${valor.toFixed(2)}`;
      break;
    }

    case "MATERIAL_BALISTICO": {
      valor = calcularItens(material.itens);

      carimboTexto = `MATERIAL BALÍSTICO:\n`;
      material.itens.forEach((item) => {
        const subtotal = item.quantidade * item.mntDia * item.periodoDias;
        carimboTexto += `  ${item.tipo}: ${item.quantidade} × R$ ${item.mntDia.toFixed(2)}/dia × ${item.periodoDias} dias = R$ ${subtotal.toFixed(2)}\n`;
      });
      carimboTexto += `Total: R$ ${valor.toFixed(2)}`;
      break;
    }

    case "ESTACIONAMENTO_ALOJAMENTO": {
      valor = calcularItens(material.itens);

      // Agrupar itens por tipo (estacionamento vs alojamento)
      const itensEstacionamento = material.itens.filter((item) =>
        ["Barraca de Campanha", "Toldo", "Barraca Individual", "Cama"].some(
          (tipo) => item.tipo.toLowerCase().includes(tipo.toLowerCase())
        )
      );

      const itensAlojamento = material.itens.filter((item) =>
        ["Beliche", "Armário", "Colchão"].some((tipo) =>
          item.tipo.toLowerCase().includes(tipo.toLowerCase())
        )
      );

      const itensOutros = material.itens.filter(
        (item) =>
          !itensEstacionamento.includes(item) && !itensAlojamento.includes(item)
      );

      const sections: string[] = [];

      if (itensEstacionamento.length > 0) {
        const descricaoItens = itensEstacionamento
          .map((i) => i.tipo.toLowerCase())
          .join(", ");
        const formulaParcelas = itensEstacionamento
          .map(
            (item) =>
              `(${
                item.quantidade
              } ${item.tipo.toLowerCase()} x R$ ${item.mntDia.toFixed(2)}/dia)`
          )
          .join(" + ");
        const valorEstacionamento = itensEstacionamento.reduce(
          (sum, item) => sum + item.quantidade * item.mntDia * item.periodoDias,
          0
        );
        const dias = itensEstacionamento[0]?.periodoDias || 0;

        sections.push(`MATERIAL DE ESTACIONAMENTO (${descricaoItens}):
Memória de cálculo: [${formulaParcelas}] x ${dias} dias = R$ ${valorEstacionamento.toFixed(
          2
        )}`);
      }

      if (itensAlojamento.length > 0) {
        const descricaoItens = itensAlojamento
          .map((i) => i.tipo.toLowerCase())
          .join(", ");
        const formulaParcelas = itensAlojamento
          .map(
            (item) =>
              `(${
                item.quantidade
              } ${item.tipo.toLowerCase()} x R$ ${item.mntDia.toFixed(2)}/dia)`
          )
          .join(" + ");
        const valorAlojamento = itensAlojamento.reduce(
          (sum, item) => sum + item.quantidade * item.mntDia * item.periodoDias,
          0
        );
        const dias = itensAlojamento[0]?.periodoDias || 0;

        sections.push(`MATERIAL DE ALOJAMENTO (${descricaoItens}):
Memória de cálculo: [${formulaParcelas}] x ${dias} dias = R$ ${valorAlojamento.toFixed(
          2
        )}`);
      }

      if (itensOutros.length > 0) {
        const descricaoItens = itensOutros
          .map((i) => i.tipo.toLowerCase())
          .join(", ");
        const formulaParcelas = itensOutros
          .map(
            (item) =>
              `(${item.quantidade} ${item.tipo} x R$ ${item.mntDia.toFixed(
                2
              )}/dia)`
          )
          .join(" + ");
        const valorOutros = itensOutros.reduce(
          (sum, item) => sum + item.quantidade * item.mntDia * item.periodoDias,
          0
        );
        const dias = itensOutros[0]?.periodoDias || 0;

        sections.push(`OUTROS MATERIAIS (${descricaoItens}):
Memória de cálculo: [${formulaParcelas}] x ${dias} dias = R$ ${valorOutros.toFixed(
          2
        )}`);
      }

      carimboTexto = sections.join("\n\n");
      break;
    }
  }

  return { valor, carimboTexto };
}

/**
 * Cálculo principal CLASSE II - Nova versão com múltiplos materiais
 */
export function calcularClasseII(
  params: ParametrosClasseII,
  unidade?: string,
  nomeOperacao?: string,
  naturezas?: string[]
): ResultadoClasseII {
  if (!params.materiais || params.materiais.length === 0) {
    throw new Error("Deve haver pelo menos um material");
  }

  let valorTotal = 0;
  const secoesMateriais: string[] = [];

  for (const material of params.materiais) {
    const { valor, carimboTexto } = calcularMaterial(material);
    valorTotal += valor;
    secoesMateriais.push(carimboTexto);
  }

  const totalFormatado = `R$ ${valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const unidadeTexto = unidade || "OM não identificada";
  const operacaoTexto = nomeOperacao || "operação";

  // Usar naturezas dinâmicas ou fallback para padrão
  const naturezasTexto = naturezas && naturezas.length > 0
    ? naturezas.join(" e ")
    : "33.90.30 e 33.90.39";

  // Montar carimbo no formato padrão
  const textoPadrao = `Aquisição de insumos para recuperação e reparação dos equipamentos empregados durante a ${operacaoTexto}.`;

  const carimboCompleto = `${naturezasTexto} – Destinado ao ${unidadeTexto}. ${textoPadrao}
Memória de Cálculo:

${secoesMateriais.join("\n\n")}

Total: ${totalFormatado}`;

  return {
    valorTotal: Number(valorTotal.toFixed(2)),
    carimbo: carimboCompleto,
  };
}
