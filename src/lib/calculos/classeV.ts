/**
 * CLASSE V — MANUTENÇÃO DE ARMAMENTO
 *
 * Cálculo baseado no custo de manutenção por dia de operação militar
 * Fórmula: quantidade × custo_mnt_dia × dias_operacao
 *
 * Os valores de custo diário são derivados de:
 * - 8% do valor MEM por ano
 * - Dividido por 365 dias e arredondado
 */

// Tipos de armamento disponíveis
export type TipoArmamento =
  | "FUZIL_556_IA2_IMBEL"
  | "FUZIL_762_MEDIA"
  | "PISTOLA_9MM_MEDIA"
  | "METRALHADORA_FN_MINIMI_556"
  | "METRALHADORA_FN_MINIMI_762"
  | "OBUSEIRO"
  | "OVN"
  | "FALCON_4GS";

export interface ArmamentoInfo {
  nome: string;
  categoria: "ARMT_L" | "ARMT_P" | "IODCT" | "DQBRN";
  valorMEM: number; // Valor do MEM (Ano Referência)
  custoMntDiaBase: number; // Custeio-Mnt/Dia Base: 8% do MEM/Ano
  custoMntDiaOpMil: number; // Cálculo-Mnt/Dia Op Mil (valor aproximado)
}

// Tabela de armamentos com valores da tabela de referência
export const ARMAMENTOS: Record<TipoArmamento, ArmamentoInfo> = {
  FUZIL_556_IA2_IMBEL: {
    nome: "Fuzil 5,56 mm IA2 IMBEL",
    categoria: "ARMT_L",
    valorMEM: 6300.0,
    custoMntDiaBase: 1.38,
    custoMntDiaOpMil: 1.4,
  },
  FUZIL_762_MEDIA: {
    nome: "Fuzil 7,62 mm (média)",
    categoria: "ARMT_L",
    valorMEM: 6709.87,
    custoMntDiaBase: 1.47,
    custoMntDiaOpMil: 1.5,
  },
  PISTOLA_9MM_MEDIA: {
    nome: "Pistola 9 mm (média)",
    categoria: "ARMT_L",
    valorMEM: 1774.7,
    custoMntDiaBase: 0.39,
    custoMntDiaOpMil: 0.4,
  },
  METRALHADORA_FN_MINIMI_556: {
    nome: "Metralhadora FN MINIMI 5,56X45mm",
    categoria: "ARMT_L",
    valorMEM: 48000.0,
    custoMntDiaBase: 10.52,
    custoMntDiaOpMil: 10.6,
  },
  METRALHADORA_FN_MINIMI_762: {
    nome: "Metralhadora FN MINIMI 7,62X51mm",
    categoria: "ARMT_L",
    valorMEM: 50000.0,
    custoMntDiaBase: 10.96,
    custoMntDiaOpMil: 11.0,
  },
  OBUSEIRO: {
    nome: "Obuseiro",
    categoria: "ARMT_P",
    valorMEM: 800000.0,
    custoMntDiaBase: 175.34,
    custoMntDiaOpMil: 175.0,
  },
  OVN: {
    nome: "OVN",
    categoria: "IODCT",
    valorMEM: 43195.0,
    custoMntDiaBase: 9.46,
    custoMntDiaOpMil: 9.5,
  },
  FALCON_4GS: {
    nome: "Falcon 4GS",
    categoria: "DQBRN",
    valorMEM: 3300000.0,
    custoMntDiaBase: 723.29,
    custoMntDiaOpMil: 723.3,
  },
};

export interface ItemArmamento {
  tipoArmamento: TipoArmamento;
  quantidade: number;
  diasUso: number;
  custoMntDiaCustomizado?: number; // Custo customizado por dia (opcional)
}

export interface ParametrosClasseV {
  armamentos: ItemArmamento[];
}

export interface ResultadoClasseV {
  valorTotal: number;
  detalhamento: string;
}

/**
 * Calcula o custo de manutenção para um item de armamento
 */
function calcularCustoItem(item: ItemArmamento): number {
  const armamento = ARMAMENTOS[item.tipoArmamento];
  const custoDia = item.custoMntDiaCustomizado ?? armamento.custoMntDiaOpMil;
  return item.quantidade * custoDia * item.diasUso;
}

/**
 * Obtém o custo diário efetivo de um item (customizado ou padrão)
 */
export function getCustoDiaEfetivo(item: ItemArmamento): number {
  const armamento = ARMAMENTOS[item.tipoArmamento];
  return item.custoMntDiaCustomizado ?? armamento.custoMntDiaOpMil;
}

/**
 * Gera o detalhamento/memória de cálculo
 */
function gerarDetalhamento(
  armamentos: ItemArmamento[],
  valorTotal: number,
  unidade?: string,
  nomeOperacao?: string,
  naturezas?: string[]
): string {
  const totalFormatado = `R$ ${valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const unidadeTexto = unidade || "OM não identificada";
  const operacaoTexto = nomeOperacao || "operação";
  const textoPadrao = `Aquisição de insumos para recuperação e reparação de armamentos empregados durante a ${operacaoTexto}.`;

  // Usar naturezas dinâmicas ou fallback para padrão
  const naturezasTexto = naturezas && naturezas.length > 0
    ? naturezas.join(" e ")
    : "33.90.30";

  let memoriaCalculo = "";

  for (const item of armamentos) {
    const armamento = ARMAMENTOS[item.tipoArmamento];
    const custoDia = getCustoDiaEfetivo(item);
    const custoItem = calcularCustoItem(item);
    const isCustomizado = item.custoMntDiaCustomizado !== undefined;

    memoriaCalculo += `→ ${armamento.nome}\n`;
    memoriaCalculo += `  ${item.quantidade} un × R$ ${custoDia.toFixed(2)}/dia${isCustomizado ? " (customizado)" : ""} × ${item.diasUso} dias\n`;
    memoriaCalculo += `  Subtotal: R$ ${custoItem.toFixed(2)}\n\n`;
  }

  return `${naturezasTexto} – Destinado ao ${unidadeTexto}. ${textoPadrao}
Memória de Cálculo:

${memoriaCalculo}
Total: ${totalFormatado}`;
}

/**
 * Cálculo principal CLASSE V
 */
export function calcularClasseV(
  params: ParametrosClasseV,
  unidade?: string,
  nomeOperacao?: string,
  naturezas?: string[]
): ResultadoClasseV {
  if (!params.armamentos || params.armamentos.length === 0) {
    throw new Error("Deve haver pelo menos um armamento");
  }

  let valorTotal = 0;

  for (const item of params.armamentos) {
    if (item.quantidade <= 0) {
      throw new Error(
        `Quantidade inválida para ${ARMAMENTOS[item.tipoArmamento].nome}`
      );
    }
    if (item.diasUso <= 0) {
      throw new Error(
        `Dias de uso inválido para ${ARMAMENTOS[item.tipoArmamento].nome}`
      );
    }

    valorTotal += calcularCustoItem(item);
  }

  const valorTotalFinal = Number(valorTotal.toFixed(2));
  const detalhamento = gerarDetalhamento(params.armamentos, valorTotalFinal, unidade, nomeOperacao, naturezas);

  return {
    valorTotal: valorTotalFinal,
    detalhamento,
  };
}

/**
 * Lista os armamentos por categoria
 */
export function listarArmamentosPorCategoria(
  categoria: ArmamentoInfo["categoria"]
): { tipo: TipoArmamento; info: ArmamentoInfo }[] {
  return Object.entries(ARMAMENTOS)
    .filter(([_, info]) => info.categoria === categoria)
    .map(([tipo, info]) => ({ tipo: tipo as TipoArmamento, info }));
}

/**
 * Lista todos os armamentos disponíveis
 */
export function listarTodosArmamentos(): {
  tipo: TipoArmamento;
  info: ArmamentoInfo;
}[] {
  return Object.entries(ARMAMENTOS).map(([tipo, info]) => ({
    tipo: tipo as TipoArmamento,
    info,
  }));
}
