/**
 * CLASSE VIII — MATERIAL DE SAÚDE
 *
 * Cálculo baseado nos kits de saúde padronizados
 * Fórmula: Σ(quantidade × custo_unitario)
 */

// Tipos de kit disponíveis
export type TipoKit =
  | "KPSI_KPT"
  | "KPSC_APHT_I"
  | "KPSC_APHT_II"
  | "KPSC_APHT_III"
  | "KPSC_VTR_BAS"
  | "KPSC_VTR_AMB_BAS"
  | "KPSC_VTR_AMB_AVC"
  | "KPSC_VTR_AMB_AVC_ALT"
  | "OUTRO"; // Para materiais customizados

export interface KitInfo {
  nome: string;
  descricao: string;
  custo: number;
}

// Tabela de kits de saúde com valores de referência
export const KITS_SAUDE: Record<Exclude<TipoKit, "OUTRO">, KitInfo> = {
  KPSI_KPT: {
    nome: "KPSI + KPT Individual",
    descricao:
      "Kit de Primeiros Socorros Individual (KPSI) + Kit de Prescrição Tática Individual (KPT/KPSI)",
    custo: 1600.0,
  },
  KPSC_APHT_I: {
    nome: "KPSC APHT Nível I",
    descricao:
      "Kit de Primeiros Socorros Coletivo APHT Nível I (KPSC – APHT I) + Kit de Prescrição Tática Nível I (KPT/KPSC – APHT I)",
    custo: 22200.0,
  },
  KPSC_APHT_II: {
    nome: "KPSC APHT Nível II",
    descricao:
      "Kit de Primeiros Socorros Coletivo APHT Nível II (KPSC – APHT II) + Kit de Prescrição Tática Nível II (KPT/KPSC – APHT II)",
    custo: 21000.0,
  },
  KPSC_APHT_III: {
    nome: "KPSC APHT Nível III",
    descricao:
      "Kit de Primeiros Socorros Coletivo APHT Nível III (KPSC – APHT III) + Kit de Prescrição Tática Nível III (KPT/KPSC – APHT III)",
    custo: 11800.0,
  },
  KPSC_VTR_BAS: {
    nome: "KPSC Viatura Básico",
    descricao: "Kit de Primeiros Socorros Coletivo para Viatura Básico (KPSC Vtr Bas)",
    custo: 21500.0,
  },
  KPSC_VTR_AMB_BAS: {
    nome: "KPSC Ambulância Básica",
    descricao:
      "Kit de Primeiros Socorros Coletivo para Viatura Ambulância Básica (KPSC Vtr Bas)",
    custo: 53500.0,
  },
  KPSC_VTR_AMB_AVC: {
    nome: "KPSC Ambulância Avançada",
    descricao:
      "Kit de Primeiros Socorros Coletivo para Viatura Ambulância Avançada (KPSC Vtr Avç)",
    custo: 24500.0,
  },
  KPSC_VTR_AMB_AVC_ALT: {
    nome: "KPSC Ambulância Avançada (Alt)",
    descricao:
      "Kit de Primeiros Socorros Coletivo para Viatura Ambulância Avançada (KPSC Vtr Avç) – versão alternativa",
    custo: 131500.0,
  },
};

export interface ItemMaterialSaude {
  tipoKit: TipoKit;
  nomeCustomizado?: string; // Para materiais do tipo "OUTRO"
  quantidade: number;
  custoCustomizado?: number; // Custo customizado (opcional)
}

export interface ParametrosClasseVIII {
  materiais: ItemMaterialSaude[];
}

export interface ResultadoClasseVIII {
  valorTotal: number;
  carimbo: string;
}

/**
 * Obtém o custo efetivo de um item (customizado ou padrão)
 */
export function getCustoEfetivo(item: ItemMaterialSaude): number {
  if (item.custoCustomizado !== undefined) {
    return item.custoCustomizado;
  }
  if (item.tipoKit === "OUTRO") {
    throw new Error("Material customizado deve ter custo definido");
  }
  return KITS_SAUDE[item.tipoKit].custo;
}

/**
 * Obtém o nome do material
 */
export function getNomeMaterial(item: ItemMaterialSaude): string {
  if (item.tipoKit === "OUTRO") {
    return item.nomeCustomizado || "Material Customizado";
  }
  return KITS_SAUDE[item.tipoKit].nome;
}

/**
 * Calcula o custo de um item
 */
function calcularCustoItem(item: ItemMaterialSaude): number {
  const custo = getCustoEfetivo(item);
  return item.quantidade * custo;
}

/**
 * Gera o detalhamento/memória de cálculo
 */
function gerarCarimbo(
  materiais: ItemMaterialSaude[],
  valorTotal: number,
  unidade?: string,
  nomeOperacao?: string
): string {
  const totalFormatado = `R$ ${valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const unidadeTexto = unidade || "OM não identificada";
  const operacaoTexto = nomeOperacao || "operação";
  const textoPadrao = `Aquisição de materiais de saúde e kits de primeiros socorros para emprego durante a ${operacaoTexto}.`;

  let memoriaCalculo = "";

  for (const item of materiais) {
    const custo = getCustoEfetivo(item);
    const custoItem = calcularCustoItem(item);
    const nomeMaterial = getNomeMaterial(item);
    const isCustomizado = item.custoCustomizado !== undefined;

    memoriaCalculo += `→ ${nomeMaterial}\n`;
    memoriaCalculo += `  ${item.quantidade} un × R$ ${custo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}${isCustomizado ? " (customizado)" : ""}\n`;
    memoriaCalculo += `  Subtotal: R$ ${custoItem.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}\n\n`;
  }

  return `33.90.30 – Destinado ao ${unidadeTexto}. ${textoPadrao}
Memória de Cálculo:

${memoriaCalculo}
Total: ${totalFormatado}`;
}

/**
 * Cálculo principal CLASSE VIII
 */
export function calcularClasseVIII(
  params: ParametrosClasseVIII,
  unidade?: string,
  nomeOperacao?: string
): ResultadoClasseVIII {
  if (!params.materiais || params.materiais.length === 0) {
    throw new Error("Deve haver pelo menos um material de saúde");
  }

  let valorTotal = 0;

  for (const item of params.materiais) {
    if (item.quantidade <= 0) {
      throw new Error(`Quantidade inválida para ${getNomeMaterial(item)}`);
    }

    valorTotal += calcularCustoItem(item);
  }

  const valorTotalFinal = Number(valorTotal.toFixed(2));
  const carimbo = gerarCarimbo(params.materiais, valorTotalFinal, unidade, nomeOperacao);

  return {
    valorTotal: valorTotalFinal,
    carimbo,
  };
}

/**
 * Lista todos os kits disponíveis
 */
export function listarTodosKits(): {
  tipo: Exclude<TipoKit, "OUTRO">;
  info: KitInfo;
}[] {
  return (
    Object.entries(KITS_SAUDE) as [Exclude<TipoKit, "OUTRO">, KitInfo][]
  ).map(([tipo, info]) => ({
    tipo,
    info,
  }));
}
