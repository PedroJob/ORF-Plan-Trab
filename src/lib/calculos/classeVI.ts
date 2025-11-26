/**
 * CLASSE VI — EQUIPAMENTOS DE ENGENHARIA (GND 3)
 *
 * Cálculo baseado no custo de manutenção por hora de utilização
 * Fórmula: custo = valor_hora × n_horas × 1,10
 * (fator 1,10 = 10% adicional de segurança)
 *
 * A tabela contém:
 * - Peças e insumos (ND 30)
 * - Serviço de manutenção (ND 39)
 * - Total (soma das duas)
 */

// Tipos de equipamento disponíveis
export type TipoEquipamento =
  | "GERADOR_CAMPANHA"
  | "EMBARCACAO_GUARDIAN"
  | "FERRY_BOAT"
  | "EMBARCACAO_REGIONAL"
  | "EMBARCACAO_MANOBRA"
  | "EMBARCACAO_EMPURRADOR"
  | "MOTOR_POPA"
  | "CARREGADEIRA_PNEUS"
  | "CARRETA_HIDRL_PERFURACAO"
  | "ESCAVADEIRA_HIDRAULICA"
  | "GUINDASTE_LANCA_TELESCOPICA"
  | "MINICARREGADEIRA_SKIDSTEER"
  | "MINIESCAVADEIRA_2001_4000"
  | "MINIESCAVADEIRA_850_2000"
  | "TRATOR_AGRICOLA"
  | "TRATOR_ESTEIRAS"
  | "MOTONIVELADORA"
  | "OUTRO"; // Para equipamentos customizados

export interface EquipamentoInfo {
  nome: string;
  categoria: "GERADORES" | "EMBARCACOES" | "MAQUINAS_PESADAS";
  pecasInsumos: number; // R$ - ND 30
  svMnt: number; // R$ - ND 39
  totalHora: number; // R$ - Total por hora
}

// Tabela de equipamentos com valores de referência
export const EQUIPAMENTOS: Record<Exclude<TipoEquipamento, "OUTRO">, EquipamentoInfo> = {
  GERADOR_CAMPANHA: {
    nome: "Gerador de Campanha",
    categoria: "GERADORES",
    pecasInsumos: 1.36,
    svMnt: 0.83,
    totalHora: 2.19,
  },
  EMBARCACAO_GUARDIAN: {
    nome: "Embarcação Guardian",
    categoria: "EMBARCACOES",
    pecasInsumos: 41.16,
    svMnt: 312.95,
    totalHora: 354.11,
  },
  FERRY_BOAT: {
    nome: "Ferry Boat",
    categoria: "EMBARCACOES",
    pecasInsumos: 12.8,
    svMnt: 25.2,
    totalHora: 38.0,
  },
  EMBARCACAO_REGIONAL: {
    nome: "Embarcação Regional",
    categoria: "EMBARCACOES",
    pecasInsumos: 10.55,
    svMnt: 6.47,
    totalHora: 17.02,
  },
  EMBARCACAO_MANOBRA: {
    nome: "Embarcação de Manobra",
    categoria: "EMBARCACOES",
    pecasInsumos: 12.81,
    svMnt: 7.85,
    totalHora: 20.66,
  },
  EMBARCACAO_EMPURRADOR: {
    nome: "Embarcação Empurrador",
    categoria: "EMBARCACOES",
    pecasInsumos: 12.8,
    svMnt: 59.0,
    totalHora: 71.8,
  },
  MOTOR_POPA: {
    nome: "Motor de Popa",
    categoria: "EMBARCACOES",
    pecasInsumos: 6.03,
    svMnt: 3.7,
    totalHora: 9.72,
  },
  CARREGADEIRA_PNEUS: {
    nome: "Carregadeira de pneus (0,6 a 1,5 m³)",
    categoria: "MAQUINAS_PESADAS",
    pecasInsumos: 49.4,
    svMnt: 24.93,
    totalHora: 74.33,
  },
  CARRETA_HIDRL_PERFURACAO: {
    nome: "Carreta Hidrl de perfuração de rocha (2,0 a 3,0 pol)",
    categoria: "MAQUINAS_PESADAS",
    pecasInsumos: 191.49,
    svMnt: 88.68,
    totalHora: 280.17,
  },
  ESCAVADEIRA_HIDRAULICA: {
    nome: "Escavadeira hidráulica (12 a 17 m³)",
    categoria: "MAQUINAS_PESADAS",
    pecasInsumos: 81.49,
    svMnt: 52.21,
    totalHora: 133.69,
  },
  GUINDASTE_LANCA_TELESCOPICA: {
    nome: "Guindaste com lança telescópica RT (51 a 90 t)",
    categoria: "MAQUINAS_PESADAS",
    pecasInsumos: 76.82,
    svMnt: 97.56,
    totalHora: 174.38,
  },
  MINICARREGADEIRA_SKIDSTEER: {
    nome: "Minicarregadeira (SkidSteer) (1.001 a 1.300 kg)",
    categoria: "MAQUINAS_PESADAS",
    pecasInsumos: 63.9,
    svMnt: 33.34,
    totalHora: 97.24,
  },
  MINIESCAVADEIRA_2001_4000: {
    nome: "Miniescavadeira (2.001 a 4.000 kg)",
    categoria: "MAQUINAS_PESADAS",
    pecasInsumos: 30.52,
    svMnt: 34.82,
    totalHora: 65.35,
  },
  MINIESCAVADEIRA_850_2000: {
    nome: "Miniescavadeira (850 a 2.000 kg)",
    categoria: "MAQUINAS_PESADAS",
    pecasInsumos: 15.73,
    svMnt: 25.61,
    totalHora: 41.34,
  },
  TRATOR_AGRICOLA: {
    nome: "Trator agrícola (100 a 110 hp)",
    categoria: "MAQUINAS_PESADAS",
    pecasInsumos: 59.92,
    svMnt: 28.03,
    totalHora: 87.95,
  },
  TRATOR_ESTEIRAS: {
    nome: "Trator de esteiras (100 a 130 hp)",
    categoria: "MAQUINAS_PESADAS",
    pecasInsumos: 109.15,
    svMnt: 80.36,
    totalHora: 189.51,
  },
  MOTONIVELADORA: {
    nome: "Motoniveladora",
    categoria: "MAQUINAS_PESADAS",
    pecasInsumos: 12.84,
    svMnt: 73.51,
    totalHora: 86.35,
  },
};

export interface ItemEquipamentoEngenharia {
  tipoEquipamento: TipoEquipamento;
  nomeCustomizado?: string; // Para equipamentos do tipo "OUTRO"
  quantidade: number;
  diasUso: number;
  horasPorDia: number;
  custoHoraCustomizado?: number; // Custo customizado por hora (opcional)
}

export interface ParametrosClasseVI {
  equipamentos: ItemEquipamentoEngenharia[];
}

export interface ResultadoClasseVI {
  valorTotal: number;
  carimbo: string;
}

/**
 * Fator de segurança
 */
const FATOR_SEGURANCA = 1.1; // 10% adicional

/**
 * Obtém o custo por hora efetivo de um item (customizado ou padrão)
 */
export function getCustoHoraEfetivo(item: ItemEquipamentoEngenharia): number {
  if (item.custoHoraCustomizado !== undefined) {
    return item.custoHoraCustomizado;
  }
  if (item.tipoEquipamento === "OUTRO") {
    throw new Error("Equipamento customizado deve ter custo por hora definido");
  }
  return EQUIPAMENTOS[item.tipoEquipamento as Exclude<TipoEquipamento, "OUTRO">].totalHora;
}

/**
 * Obtém o nome do equipamento
 */
export function getNomeEquipamento(item: ItemEquipamentoEngenharia): string {
  if (item.tipoEquipamento === "OUTRO") {
    return item.nomeCustomizado || "Equipamento Customizado";
  }
  return EQUIPAMENTOS[item.tipoEquipamento as Exclude<TipoEquipamento, "OUTRO">].nome;
}

/**
 * Calcula o custo de um item de equipamento
 */
function calcularCustoItem(item: ItemEquipamentoEngenharia): number {
  const custoHora = getCustoHoraEfetivo(item);
  const horasTotais = item.diasUso * item.horasPorDia;
  return item.quantidade * custoHora * horasTotais * FATOR_SEGURANCA;
}

/**
 * Gera o detalhamento/memória de cálculo
 */
function gerarCarimbo(
  equipamentos: ItemEquipamentoEngenharia[],
  valorTotal: number,
  unidade?: string,
  nomeOperacao?: string
): string {
  const totalFormatado = `R$ ${valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const unidadeTexto = unidade || "OM não identificada";
  const operacaoTexto = nomeOperacao || "operação";
  const textoPadrao = `Aquisição de peças e insumos, e contratação de serviços de manutenção para equipamentos de engenharia empregados na ${operacaoTexto}.`;

  let memoriaCalculo = "";

  for (const item of equipamentos) {
    const custoHora = getCustoHoraEfetivo(item);
    const horasTotais = item.diasUso * item.horasPorDia;
    const custoItem = calcularCustoItem(item);
    const nomeEquip = getNomeEquipamento(item);
    const isCustomizado = item.custoHoraCustomizado !== undefined;

    memoriaCalculo += `→ ${nomeEquip}\n`;
    memoriaCalculo += `  ${item.quantidade} un × R$ ${custoHora.toFixed(2)}/h${isCustomizado ? " (customizado)" : ""} × ${item.diasUso} dias × ${item.horasPorDia}h/dia × ${FATOR_SEGURANCA.toFixed(2)}\n`;
    memoriaCalculo += `  (Total: ${horasTotais}h)\n`;
    memoriaCalculo += `  Subtotal: R$ ${custoItem.toFixed(2)}\n\n`;
  }

  memoriaCalculo += `Fator de Segurança: ${FATOR_SEGURANCA.toFixed(2)} (10%)`;

  return `33.90.30 e 33.90.39 – Destinado ao ${unidadeTexto}. ${textoPadrao}
Memória de Cálculo:

${memoriaCalculo}

Total: ${totalFormatado}`;
}

/**
 * Cálculo principal CLASSE VI
 */
export function calcularClasseVI(
  params: ParametrosClasseVI,
  unidade?: string,
  nomeOperacao?: string
): ResultadoClasseVI {
  if (!params.equipamentos || params.equipamentos.length === 0) {
    throw new Error("Deve haver pelo menos um equipamento");
  }

  let valorTotal = 0;

  for (const item of params.equipamentos) {
    if (item.quantidade <= 0) {
      throw new Error(`Quantidade inválida para ${getNomeEquipamento(item)}`);
    }
    if (item.diasUso <= 0) {
      throw new Error(`Dias de uso inválidos para ${getNomeEquipamento(item)}`);
    }
    if (item.horasPorDia <= 0) {
      throw new Error(`Horas por dia inválidas para ${getNomeEquipamento(item)}`);
    }

    valorTotal += calcularCustoItem(item);
  }

  const valorTotalFinal = Number(valorTotal.toFixed(2));
  const carimbo = gerarCarimbo(params.equipamentos, valorTotalFinal, unidade, nomeOperacao);

  return {
    valorTotal: valorTotalFinal,
    carimbo,
  };
}

/**
 * Lista os equipamentos por categoria
 */
export function listarEquipamentosPorCategoria(
  categoria: EquipamentoInfo["categoria"]
): { tipo: Exclude<TipoEquipamento, "OUTRO">; info: EquipamentoInfo }[] {
  return (Object.entries(EQUIPAMENTOS) as [Exclude<TipoEquipamento, "OUTRO">, EquipamentoInfo][])
    .filter(([_, info]) => info.categoria === categoria)
    .map(([tipo, info]) => ({ tipo, info }));
}

/**
 * Lista todos os equipamentos disponíveis
 */
export function listarTodosEquipamentos(): {
  tipo: Exclude<TipoEquipamento, "OUTRO">;
  info: EquipamentoInfo;
}[] {
  return (Object.entries(EQUIPAMENTOS) as [Exclude<TipoEquipamento, "OUTRO">, EquipamentoInfo][]).map(
    ([tipo, info]) => ({
      tipo,
      info,
    })
  );
}

// Manter exports antigos para compatibilidade (deprecated)
export const VALORES_REFERENCIA_ENGENHARIA = Object.fromEntries(
  Object.entries(EQUIPAMENTOS).map(([key, value]) => [key, value.totalHora])
);

export const CATEGORIAS_EQUIPAMENTOS = {
  GERADORES: Object.keys(EQUIPAMENTOS).filter(
    (k) => EQUIPAMENTOS[k as keyof typeof EQUIPAMENTOS].categoria === "GERADORES"
  ),
  EMBARCACOES: Object.keys(EQUIPAMENTOS).filter(
    (k) => EQUIPAMENTOS[k as keyof typeof EQUIPAMENTOS].categoria === "EMBARCACOES"
  ),
  MAQUINAS_PESADAS: Object.keys(EQUIPAMENTOS).filter(
    (k) => EQUIPAMENTOS[k as keyof typeof EQUIPAMENTOS].categoria === "MAQUINAS_PESADAS"
  ),
};
