/**
 * CLASSE III — SUPRIMENTO (COMBUSTÍVEIS AUTOMOTIVOS)
 *
 * Implementação baseada nas tabelas de consumo médio de viaturas e equipamentos
 */

// Tipos de combustível
export type TipoCombustivel = "OD" | "GAS";

// Siglas dos estados brasileiros
export type SiglaEstado =
  | "br"
  | "ac"
  | "al"
  | "am"
  | "ap"
  | "ba"
  | "ce"
  | "df"
  | "es"
  | "go"
  | "ma"
  | "mg"
  | "ms"
  | "mt"
  | "pa"
  | "pb"
  | "pe"
  | "pi"
  | "pr"
  | "rj"
  | "rn"
  | "ro"
  | "rr"
  | "rs"
  | "sc"
  | "se"
  | "sp"
  | "to";

// Mapeamento de sigla para nome do estado
export const ESTADOS_BRASIL: Record<SiglaEstado, string> = {
  br: "Brasil (Média Nacional)",
  ac: "Acre",
  al: "Alagoas",
  am: "Amazonas",
  ap: "Amapá",
  ba: "Bahia",
  ce: "Ceará",
  df: "Distrito Federal",
  es: "Espírito Santo",
  go: "Goiás",
  ma: "Maranhão",
  mg: "Minas Gerais",
  ms: "Mato Grosso do Sul",
  mt: "Mato Grosso",
  pa: "Pará",
  pb: "Paraíba",
  pe: "Pernambuco",
  pi: "Piauí",
  pr: "Paraná",
  rj: "Rio de Janeiro",
  rn: "Rio Grande do Norte",
  ro: "Rondônia",
  rr: "Roraima",
  rs: "Rio Grande do Sul",
  sc: "Santa Catarina",
  se: "Sergipe",
  sp: "São Paulo",
  to: "Tocantins",
};

// Interface para resposta da API de preços
export interface PrecosCombustivelAPI {
  gasolina: Partial<Record<SiglaEstado, string>>;
  diesel: Partial<Record<SiglaEstado, string>>;
  dataColeta?: string;
}

// Preços médios nacionais (fallback)
export const PRECOS_COMBUSTIVEL = {
  GC: 6.3, // Gasolina Comum
  OD: 6.03, // Óleo Diesel
  GAS: 6.3, // Gasolina (genérico)
};

// Preços de fallback por estado (valores aproximados)
export const PRECOS_FALLBACK: Record<TipoCombustivel, Partial<Record<SiglaEstado, number>>> = {
  GAS: {
    br: 6.16,
    al: 6.22,
    am: 6.97,
    ce: 6.18,
    df: 6.33,
    es: 6.22,
    go: 6.39,
    ma: 5.83,
    mt: 6.30,
    mg: 5.98,
    pr: 6.47,
    pb: 5.91,
    pa: 6.23,
    pe: 6.33,
    rs: 6.15,
    rj: 6.08,
    sc: 6.27,
    sp: 6.03,
  },
  OD: {
    br: 6.06,
    al: 5.93,
    am: 6.51,
    ce: 5.83,
    df: 5.98,
    es: 6.04,
    go: 6.06,
    ma: 5.92,
    mt: 6.32,
    mg: 5.95,
    pr: 5.98,
    pa: 6.20,
    pe: 5.82,
    rs: 6.14,
    rj: 6.15,
    sc: 6.12,
    sp: 6.12,
  },
};

// Fator de segurança para Classe III (30%)
export const FATOR_SEGURANCA_CLASSE_III = 1.3;

// URL da API de preços de combustível
const API_COMBUSTIVEL_URL = "https://combustivelapi.com.br/api/precos/";

// Interface da resposta da API
interface APIResponse {
  error: boolean;
  message: string;
  data_coleta: string;
  precos: {
    gasolina: Record<string, string>;
    diesel: Record<string, string>;
  };
}

/**
 * Converte string de preço brasileiro (ex: "6,16") para número
 */
function parsePreco(precoStr: string): number {
  return parseFloat(precoStr.replace(",", "."));
}

/**
 * Busca preços de combustível da API
 */
export async function fetchPrecosCombustivel(): Promise<PrecosCombustivelAPI | null> {
  try {
    const response = await fetch(API_COMBUSTIVEL_URL, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Erro ao buscar preços de combustível:", response.status);
      return null;
    }

    const data: APIResponse = await response.json();

    if (data.error) {
      console.error("API retornou erro:", data.message);
      return null;
    }

    return {
      gasolina: data.precos.gasolina,
      diesel: data.precos.diesel,
      dataColeta: data.data_coleta,
    };
  } catch (error) {
    console.error("Erro ao buscar preços de combustível:", error);
    return null;
  }
}

/**
 * Obtém o preço do combustível para um estado específico
 * Usa a API se disponível, senão usa fallback
 */
export function getPrecoEstado(
  tipo: TipoCombustivel,
  estado: SiglaEstado,
  precosAPI?: PrecosCombustivelAPI | null
): number {
  // Se temos dados da API, usar eles
  if (precosAPI) {
    const precosEstado =
      tipo === "GAS" ? precosAPI.gasolina : precosAPI.diesel;
    const precoStr = precosEstado[estado];
    if (precoStr) {
      return parsePreco(precoStr);
    }
  }

  // Fallback: usar preços estáticos
  const precoFallback = PRECOS_FALLBACK[tipo][estado];
  if (precoFallback) {
    return precoFallback;
  }

  // Último fallback: média nacional
  return tipo === "GAS" ? PRECOS_COMBUSTIVEL.GAS : PRECOS_COMBUSTIVEL.OD;
}

/**
 * Lista estados disponíveis na API (com preços)
 */
export function getEstadosDisponiveis(
  tipo: TipoCombustivel,
  precosAPI?: PrecosCombustivelAPI | null
): SiglaEstado[] {
  const estadosBase = Object.keys(ESTADOS_BRASIL) as SiglaEstado[];

  if (precosAPI) {
    const precos = tipo === "GAS" ? precosAPI.gasolina : precosAPI.diesel;
    return estadosBase.filter((estado) => precos[estado] !== undefined);
  }

  // Se não temos API, retornar estados do fallback
  const fallback = PRECOS_FALLBACK[tipo];
  return estadosBase.filter((estado) => fallback[estado] !== undefined);
}

// ============================================
// VIATURAS
// ============================================

export interface Viatura {
  nome: string;
  tipo:
    | "VTR_ADM_PEQUENO"
    | "VTR_ADM_GRANDE"
    | "VTR_OP_LEVE"
    | "VTR_OP_GRANDE"
    | "MOTOCICLETA"
    | "VTR_BLD_RODAS"
    | "VTR_BLD_LAGARTAS"
    | "VTR_BLD_LEVE";
  exemplo: string;
  combustivel: TipoCombustivel;
  consumoKmL: number; // km/litro
}

export const VIATURAS: Viatura[] = [
  // Vtr Adm de pequeno porte
  {
    nome: "Vtr Adm Pequeno Porte",
    tipo: "VTR_ADM_PEQUENO",
    exemplo: "Adm pequena",
    combustivel: "GAS",
    consumoKmL: 8,
  },
  {
    nome: "Vtr Adm Pequeno Porte",
    tipo: "VTR_ADM_PEQUENO",
    exemplo: "Pick-up (Frontier/L200)",
    combustivel: "OD",
    consumoKmL: 7,
  },
  {
    nome: "Vtr Adm Pequeno Porte",
    tipo: "VTR_ADM_PEQUENO",
    exemplo: "Van/Micro",
    combustivel: "OD",
    consumoKmL: 6,
  },

  // Vtr Adm de grande porte
  {
    nome: "Vtr Adm Grande Porte",
    tipo: "VTR_ADM_GRANDE",
    exemplo: "Cav Mec",
    combustivel: "OD",
    consumoKmL: 1.3,
  },
  {
    nome: "Vtr Adm Grande Porte",
    tipo: "VTR_ADM_GRANDE",
    exemplo: "Ônibus",
    combustivel: "OD",
    consumoKmL: 3,
  },

  // Vtr Op
  {
    nome: "Vtr Op Leve",
    tipo: "VTR_OP_LEVE",
    exemplo: "Marruá",
    combustivel: "OD",
    consumoKmL: 5,
  },
  {
    nome: "Vtr Op Grande Porte",
    tipo: "VTR_OP_GRANDE",
    exemplo: "Vtr 5 Ton (MBB)",
    combustivel: "OD",
    consumoKmL: 3,
  },

  // Motocicletas
  {
    nome: "Motocicleta",
    tipo: "MOTOCICLETA",
    exemplo: "Até 1.000 cc",
    combustivel: "GAS",
    consumoKmL: 15,
  },
  {
    nome: "Motocicleta",
    tipo: "MOTOCICLETA",
    exemplo: "Acima de 1.000 cc",
    combustivel: "GAS",
    consumoKmL: 7,
  },

  // Vtr Blindadas
  {
    nome: "Vtr Bld sobre rodas",
    tipo: "VTR_BLD_RODAS",
    exemplo: "Blindado rodas",
    combustivel: "OD",
    consumoKmL: 1.5,
  },
  {
    nome: "Vtr Bld sobre lagartas",
    tipo: "VTR_BLD_LAGARTAS",
    exemplo: "Blindado lagartas",
    combustivel: "OD",
    consumoKmL: 0.5,
  },
  {
    nome: "Vtr Bld Leve sobre rodas",
    tipo: "VTR_BLD_LEVE",
    exemplo: "LINCE",
    combustivel: "OD",
    consumoKmL: 4,
  },
];

// ============================================
// EQUIPAMENTOS
// ============================================

export interface Equipamento {
  nome: string;
  combustivel: TipoCombustivel;
  consumoLH: number; // litros/hora
  observacoes?: string;
}

export const EQUIPAMENTOS: Equipamento[] = [
  {
    nome: "Gerador até 15 kva",
    combustivel: "GAS",
    consumoLH: 1.25,
    observacoes:
      "Nova padronização somente Ger a OD, mas ainda existem Ger a Gas",
  },
  {
    nome: "Gerador até 15 kva",
    combustivel: "OD",
    consumoLH: 4,
    observacoes: "Troca de óleo e filtro a cada 100 horas",
  },
  {
    nome: "Gerador acima de 50 kva",
    combustivel: "OD",
    consumoLH: 20,
    observacoes: "Troca de óleo e filtro a cada 100 horas",
  },
  {
    nome: "Motor de popa (horas de navegação)",
    combustivel: "GAS",
    consumoLH: 20,
    observacoes: "Inclui AQUISIÇÃO de O2T",
  },
  {
    nome: "Motor de popa 2T NAUT",
    combustivel: "GAS",
    consumoLH: 0.5,
    observacoes: "No caso de não ser possível a aquisição pela OM",
  },
  {
    nome: "Embarcação GUARDIAN 25",
    combustivel: "GAS",
    consumoLH: 100,
  },
  {
    nome: "Ferryboat",
    combustivel: "OD",
    consumoLH: 100,
  },
  {
    nome: "Embarcação Regional",
    combustivel: "OD",
    consumoLH: 50,
  },
  {
    nome: "Empurradores",
    combustivel: "OD",
    consumoLH: 80,
  },
  {
    nome: "Embarcação de Manobra",
    combustivel: "OD",
    consumoLH: 30,
  },
  {
    nome: "Retroescavadeira",
    combustivel: "OD",
    consumoLH: 7,
  },
  {
    nome: "Carregadeira sobre rodas",
    combustivel: "OD",
    consumoLH: 16,
  },
  {
    nome: "Motoniveladora",
    combustivel: "OD",
    consumoLH: 18,
  },
];

// ============================================
// TIPOS DE ITEM CLASSE III
// ============================================

export interface ItemViaturaClasseIII {
  tipoItem: "VIATURA";
  viatura: Viatura;
  quantidade: number;
  kmMedioDiario: number; // Km médio diário que cada viatura vai rodar
  diasUso: number; // Dias de uso da viatura
}

export interface ItemEquipamentoClasseIII {
  tipoItem: "EQUIPAMENTO";
  equipamento: Equipamento;
  quantidade: number;
  horasMediaDiaria: number; // Horas médias diárias de uso
  diasUso: number; // Dias de uso do equipamento
}

export type ItemClasseIII = ItemViaturaClasseIII | ItemEquipamentoClasseIII;

export interface ParametrosClasseIII {
  itens: ItemClasseIII[];
  tipoCombustivel: TipoCombustivel;
  precoCombustivelCustomizado?: number; // Preço customizado do combustível (opcional)
  estadoSelecionado?: SiglaEstado; // Estado selecionado para referência de preço
  dataColetaPreco?: string; // Data de coleta do preço da API
}

export interface ResultadoClasseIII {
  valorTotal: number;
  valorCombustivel: number; // Litros totais
  carimbo: string;
}

// ============================================
// FUNÇÕES DE CÁLCULO
// ============================================

/**
 * Calcula consumo de uma viatura
 */
function calcularConsumoViatura(item: ItemViaturaClasseIII): number {
  const kmTotal = item.kmMedioDiario * item.diasUso;
  const litrosPorViatura = kmTotal / item.viatura.consumoKmL;
  return item.quantidade * litrosPorViatura;
}

/**
 * Calcula consumo de um equipamento
 */
function calcularConsumoEquipamento(item: ItemEquipamentoClasseIII): number {
  const horasTotal = item.horasMediaDiaria * item.diasUso;
  return item.quantidade * item.equipamento.consumoLH * horasTotal;
}

/**
 * Gera texto do carimbo para um item
 */
function gerarTextoItem(item: ItemClasseIII, litrosItem: number): string {
  if (item.tipoItem === "VIATURA") {
    const kmTotal = item.kmMedioDiario * item.diasUso;
    const litrosPorUnidade = kmTotal / item.viatura.consumoKmL;
    const nomeViatura = item.viatura.exemplo;
    const tipoViatura = item.viatura.nome;

    return `→  ${item.quantidade} ${tipoViatura} (${nomeViatura}), consumindo ${
      item.viatura.consumoKmL
    }Km/L, rodando ${item.kmMedioDiario} Km/dia x ${
      item.diasUso
    } dias = ${kmTotal} Km cada, totalizando ${litrosPorUnidade.toFixed(
      0
    )} Lts de O.D por ${tipoViatura}: ${
      item.quantidade
    } ${tipoViatura} x ${litrosPorUnidade.toFixed(
      0
    )} litros : Total ${tipoViatura}: ${litrosItem.toFixed(0)} litros.`;
  } else {
    const horasTotal = item.horasMediaDiaria * item.diasUso;
    const nomeEquip = item.equipamento.nome;

    return `→  ${item.quantidade} ${nomeEquip}, consumindo ${
      item.equipamento.consumoLH
    } L/h, operando ${item.horasMediaDiaria} h/dia x ${
      item.diasUso
    } dias = ${horasTotal} horas cada, totalizando ${(
      item.equipamento.consumoLH * horasTotal
    ).toFixed(0)} Lts por equipamento: ${item.quantidade} equipamentos x ${(
      item.equipamento.consumoLH * horasTotal
    ).toFixed(0)} litros : Total: ${litrosItem.toFixed(0)} litros.`;
  }
}

/**
 * Mapeia tipo de combustível para nome legível
 */
function getNomeCombustivel(tipo: TipoCombustivel): string {
  switch (tipo) {
    case "OD":
      return "Óleo Diesel";
    case "GAS":
      return "Gasolina";
  }
}

/**
 * Cálculo principal CLASSE III
 */
export function calcularClasseIII(
  params: ParametrosClasseIII,
  unidade?: string,
  nomeOperacao?: string,
  naturezas?: string[]
): ResultadoClasseIII {
  if (!params.itens || params.itens.length === 0) {
    throw new Error("Deve haver pelo menos um item (viatura ou equipamento)");
  }

  let litrosTotais = 0;
  const textoItens: string[] = [];

  // Calcular cada item
  for (const item of params.itens) {
    let litrosItem = 0;

    if (item.tipoItem === "VIATURA") {
      // Validar se combustível é compatível
      if (item.viatura.combustivel !== params.tipoCombustivel) {
        throw new Error(
          `Viatura ${
            item.viatura.exemplo
          } não é compatível com ${getNomeCombustivel(params.tipoCombustivel)}`
        );
      }
      litrosItem = calcularConsumoViatura(item);
    } else {
      // Equipamento
      if (item.equipamento.combustivel !== params.tipoCombustivel) {
        throw new Error(
          `Equipamento ${
            item.equipamento.nome
          } não é compatível com ${getNomeCombustivel(params.tipoCombustivel)}`
        );
      }
      litrosItem = calcularConsumoEquipamento(item);
    }

    litrosTotais += litrosItem;
    textoItens.push(gerarTextoItem(item, litrosItem));
  }

  // Aplicar fator de segurança
  const litrosComFator = litrosTotais * FATOR_SEGURANCA_CLASSE_III;

  // Calcular valor em reais - usar preço customizado se fornecido
  const precoMedioNacional = PRECOS_COMBUSTIVEL[params.tipoCombustivel];
  const precoPorLitro =
    params.precoCombustivelCustomizado ?? precoMedioNacional;
  const valorTotal = litrosComFator * precoPorLitro;

  // Gerar carimbo no formato padrão
  const nomeCombustivel = getNomeCombustivel(params.tipoCombustivel);
  const unidadeTexto = unidade || "OM não identificada";
  const operacaoTexto = nomeOperacao || "operação";

  // Determinar texto do preço baseado no estado
  const estadoTexto = params.estadoSelecionado
    ? ESTADOS_BRASIL[params.estadoSelecionado]
    : "Brasil (Média Nacional)";
  const infoPreco = `R$ ${precoPorLitro.toFixed(2)} (Preço médio ${estadoTexto})`;
  const totalFormatado = `R$ ${valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Usar naturezas dinâmicas ou fallback para padrão
  const naturezasTexto = naturezas && naturezas.length > 0
    ? naturezas.join(" e ")
    : "33.90.30";

  const textoPadrao = `Aquisição de ${nomeCombustivel} para custear deslocamento de viaturas e equipamentos no contexto da ${operacaoTexto}.`;

  const memoriaCalculo = `Viatura/Equipamento x (trecho / consumo) x dias x 1,3

${textoItens.join("\n")}

Total: ${litrosTotais.toFixed(1)} L de ${nomeCombustivel} x ${FATOR_SEGURANCA_CLASSE_III} (Fator de segurança de 30%): ${litrosComFator.toFixed(1)} L
Valor Total: ${litrosComFator.toFixed(1)} L de ${nomeCombustivel} x ${infoPreco} = ${totalFormatado}`;

  // Gerar texto da fonte de preço
  const fontePreco = params.dataColetaPreco
    ? `\n\nFonte do preço: Petrobras (https://precos.petrobras.com.br/)\nData de coleta: ${params.dataColetaPreco}`
    : "";

  const carimbo = `${naturezasTexto} – Destinado ao ${unidadeTexto}. ${textoPadrao}
Memória de Cálculo:

${memoriaCalculo}

Total: ${totalFormatado}${fontePreco}`;

  return {
    valorTotal: Number(valorTotal.toFixed(2)),
    valorCombustivel: Number(litrosComFator.toFixed(2)),
    carimbo,
  };
}

/**
 * Filtra viaturas por tipo de combustível
 */
export function filtrarViaturasPorCombustivel(
  tipoCombustivel: TipoCombustivel
): Viatura[] {
  return VIATURAS.filter((v) => v.combustivel === tipoCombustivel);
}

/**
 * Filtra equipamentos por tipo de combustível
 */
export function filtrarEquipamentosPorCombustivel(
  tipoCombustivel: TipoCombustivel
): Equipamento[] {
  return EQUIPAMENTOS.filter((e) => e.combustivel === tipoCombustivel);
}
