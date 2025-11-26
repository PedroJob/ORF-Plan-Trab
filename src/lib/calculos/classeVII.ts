// Classe VII - Equipamentos Eletrônicos - Manutenção

export type TipoEquipamento =
  | "RF_7800V_HH_VAA"
  | "RF_7800V_HH"
  | "RF_7800H_MP"
  | "7800H_V002"
  | "MOTOBRIDGE"
  | "APX_2000"
  | "APX_2500"
  | "GTR_8000"
  | "TERMINAL_LEVE_SISCOMSAT"
  | "SITE_SRDT"
  | "ATIVO_REDE_SERVIDORES"
  | "DESKTOP"
  | "NOTEBOOK"
  | "IMPRESSORA_MULTIFUNCIONAL"
  | "TABLET_SMARTPHONE";

export interface EquipamentoEletronico {
  nome: string;
  custoMntDia: number;
}

export const EQUIPAMENTOS: Record<TipoEquipamento, EquipamentoEletronico> = {
  RF_7800V_HH_VAA: {
    nome: "RF-7800V-HH (VAA)",
    custoMntDia: 25.88,
  },
  RF_7800V_HH: {
    nome: "RF-7800V-HH",
    custoMntDia: 10.45,
  },
  RF_7800H_MP: {
    nome: "RF-7800H-MP",
    custoMntDia: 36.81,
  },
  "7800H_V002": {
    nome: "7800H-V002",
    custoMntDia: 89.47,
  },
  MOTOBRIDGE: {
    nome: "MOTOBRIDGE",
    custoMntDia: 40.23,
  },
  APX_2000: {
    nome: "APX 2000",
    custoMntDia: 3.77,
  },
  APX_2500: {
    nome: "APX 2500",
    custoMntDia: 4.42,
  },
  GTR_8000: {
    nome: "GTR 8000",
    custoMntDia: 50.41,
  },
  TERMINAL_LEVE_SISCOMSAT: {
    nome: "Terminal Leve do SISCOMSAT",
    custoMntDia: 111.06,
  },
  SITE_SRDT: {
    nome: "Site do SRDT",
    custoMntDia: 305.69,
  },
  ATIVO_REDE_SERVIDORES: {
    nome: "Ativo de rede/servidores",
    custoMntDia: 10.95,
  },
  DESKTOP: {
    nome: "Desktop",
    custoMntDia: 5.48,
  },
  NOTEBOOK: {
    nome: "Notebook",
    custoMntDia: 7.34,
  },
  IMPRESSORA_MULTIFUNCIONAL: {
    nome: "Impressora multifuncional",
    custoMntDia: 4.1,
  },
  TABLET_SMARTPHONE: {
    nome: "Tablet e smartphone",
    custoMntDia: 8.22,
  },
};

export interface ItemEquipamento {
  tipoEquipamento: TipoEquipamento;
  quantidade: number;
  diasUso: number;
  custoMntDiaCustomizado?: number;
}

export interface ParametrosClasseVII {
  equipamentos: ItemEquipamento[];
}

export function getCustoDiaEfetivo(item: ItemEquipamento): number {
  return item.custoMntDiaCustomizado !== undefined
    ? item.custoMntDiaCustomizado
    : EQUIPAMENTOS[item.tipoEquipamento].custoMntDia;
}

export function listarTodosEquipamentos() {
  return Object.entries(EQUIPAMENTOS).map(([tipo, info]) => ({
    tipo: tipo as TipoEquipamento,
    info,
  }));
}

export function calcularClasseVII(
  params: ParametrosClasseVII,
  unidade?: string,
  nomeOperacao?: string
) {
  const { equipamentos } = params;

  if (!equipamentos || equipamentos.length === 0) {
    throw new Error("Nenhum equipamento fornecido");
  }

  let valorTotal = 0;
  const detalhamentoItens: string[] = [];

  equipamentos.forEach((item) => {
    const equipamento = EQUIPAMENTOS[item.tipoEquipamento];
    const custoDia = getCustoDiaEfetivo(item);
    const custoItem = item.quantidade * custoDia * item.diasUso;

    valorTotal += custoItem;

    const isCustomizado = item.custoMntDiaCustomizado !== undefined;
    const customizadoLabel = isCustomizado ? " (customizado)" : "";

    detalhamentoItens.push(
      `→ ${item.quantidade}x ${equipamento.nome}: R$ ${custoDia.toFixed(2)}/dia × ${item.diasUso} dias = R$ ${custoItem.toFixed(2)}${customizadoLabel}`
    );
  });

  const valorTotalFinal = Number(valorTotal.toFixed(2));
  const totalFormatado = `R$ ${valorTotalFinal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const unidadeTexto = unidade || "OM não identificada";
  const operacaoTexto = nomeOperacao || "operação";
  const textoPadrao = `Aquisição de insumos para manutenção de equipamentos eletrônicos empregados durante a ${operacaoTexto}.`;

  const detalhamento = `33.90.30 – Destinado ao ${unidadeTexto}. ${textoPadrao}
Memória de Cálculo:

${detalhamentoItens.join("\n")}

Total: ${totalFormatado}`;

  return {
    valorTotal: valorTotalFinal,
    detalhamento,
  };
}
