/**
 * Biblioteca de Cálculos de Despesas para Planos Logísticos
 *
 * Contém todas as fórmulas de cálculo para as 10 classes de despesa
 * conforme especificação do Exército Brasileiro
 */

import { ClasseDespesa } from '@prisma/client';

// ============================================
// INTERFACES DE PARÂMETROS
// ============================================

export interface ParametrosClasseI {
  efetivo: number;
  tipoRefeicao: 'QR' | 'QS';
  // Etapa (máx 8 dias)
  diasEtapa?: number;
  // Referências intermediárias (máx 3 refs × até 30 dias)
  numRefIntermediarias?: number;
  diasComplemento?: number;
}

export interface ParametrosClasseII {
  quantidade: number;
  custoDiario: number;
  dias: number;
}

export interface ParametrosClasseIII {
  // Cálculo por distância
  distanciaPercorrida?: number;
  consumoMedioKm?: number;
  frequencia?: number;
  // OU cálculo por dias
  numViaturas?: number;
  consumoMedioDiario?: number;
  dias?: number;
  // Comum
  precoUnitario: number;
}

export interface ParametrosClasseIV {
  itens: Array<{
    descricao: string;
    quantidade: number;
    valorUnitario: number;
  }>;
}

export interface ParametrosClasseV {
  quantidade: number;
  valorUnitario: number;
}

export interface ParametrosClasseVI {
  efetivo: number;
  conjuntoItens: number; // Número de itens por pessoa
  valorUnitario: number;
}

export interface ParametrosClasseVII {
  tipo: 'aquisicao' | 'manutencao';
  quantidade: number;
  valorUnitario?: number; // Para aquisição
  custoDiario?: number;  // Para manutenção
  dias?: number;         // Para manutenção
}

export interface ParametrosClasseVIII {
  quantidade: number;
  valorUnitario: number;
  custoServicos?: number; // Opcional
}

export interface ParametrosClasseIX {
  grupo: 'GP1' | 'GP2' | 'GP3';
  numViaturas: number;
  custoDiario: number; // Custo diário do grupo selecionado
  dias: number;
  taxaAcionamento?: number; // Opcional
}

export interface ParametrosClasseX {
  quantidade: number;
  valorUnitario: number;
}

// ============================================
// RESULTADO DO CÁLCULO
// ============================================

export interface ResultadoCalculo {
  valorTotal: number;
  valorCombustivel?: number; // Apenas para Classe III
  detalhes: any; // Detalhes específicos do cálculo para auditoria
}

// ============================================
// VALORES FIXOS
// ============================================

const VALORES_REFEICAO = {
  QR: 6.0,  // R$ 6,00 por etapa
  QS: 9.0,  // R$ 9,00 por etapa
};

const FATOR_COMBUSTIVEL = 1.3; // Fator obrigatório para combustíveis

const CUSTOS_MANUTENCAO_VIATURAS = {
  GP1: { min: 67, max: 154 },
  GP2: { min: 13, max: 163 },
  GP3: { valor: 285 },
};

// ============================================
// FUNÇÕES DE CÁLCULO POR CLASSE
// ============================================

/**
 * CLASSE I - Material de Subsistência
 * Fórmula etapa (máx 8 dias): Efetivo × ValorEtapa × diasEtapa
 * Fórmula refs intermediárias (máx 3 × 30 dias): Efetivo × numRefs × (ValorEtapa/3) × diasComplemento
 */
export function calcularClasseI(params: ParametrosClasseI): ResultadoCalculo {
  const { efetivo, tipoRefeicao, diasEtapa = 0, numRefIntermediarias = 0, diasComplemento = 0 } = params;

  const valorEtapa = VALORES_REFEICAO[tipoRefeicao];

  let valorTotal = 0;
  const detalhes: any = {
    efetivo,
    tipoRefeicao,
    valorEtapa,
  };

  // Cálculo da etapa (máx 8 dias)
  if (diasEtapa > 0) {
    const diasEtapaLimitado = Math.min(diasEtapa, 8);
    const valorEtapaCalculado = efetivo * valorEtapa * diasEtapaLimitado;
    valorTotal += valorEtapaCalculado;

    detalhes.etapa = {
      dias: diasEtapaLimitado,
      valor: valorEtapaCalculado,
    };
  }

  // Cálculo das referências intermediárias (máx 3 refs × 30 dias)
  if (numRefIntermediarias > 0 && diasComplemento > 0) {
    const refsLimitadas = Math.min(numRefIntermediarias, 3);
    const diasLimitados = Math.min(diasComplemento, 30);
    const valorRefsCalculado = efetivo * refsLimitadas * (valorEtapa / 3) * diasLimitados;
    valorTotal += valorRefsCalculado;

    detalhes.referenciasIntermediarias = {
      numReferencias: refsLimitadas,
      dias: diasLimitados,
      valorPorReferencia: valorEtapa / 3,
      valor: valorRefsCalculado,
    };
  }

  return {
    valorTotal: Number(valorTotal.toFixed(2)),
    detalhes,
  };
}

/**
 * CLASSE II - Manutenção de Material de Intendência
 * Fórmula: quantidade × custoDiario × dias
 */
export function calcularClasseII(params: ParametrosClasseII): ResultadoCalculo {
  const { quantidade, custoDiario, dias } = params;

  const valorTotal = quantidade * custoDiario * dias;

  return {
    valorTotal: Number(valorTotal.toFixed(2)),
    detalhes: {
      quantidade,
      custoDiario,
      dias,
      formula: 'quantidade × custoDiario × dias',
    },
  };
}

/**
 * CLASSE III - Combustíveis e Lubrificantes
 * Fórmula distância: (distanciaPercorrida / consumoMedio) × frequência × 1.3 × precoUnitario
 * Fórmula dias: numViaturas × consumoMedioDiario × dias × 1.3 × precoUnitario
 * IMPORTANTE: Fator 1.3 é obrigatório
 */
export function calcularClasseIII(params: ParametrosClasseIII): ResultadoCalculo {
  const { precoUnitario } = params;
  let valorTotal = 0;
  let valorCombustivel = 0;
  const detalhes: any = { precoUnitario, fatorCombustivel: FATOR_COMBUSTIVEL };

  // Cálculo por distância
  if (params.distanciaPercorrida && params.consumoMedioKm && params.frequencia) {
    const { distanciaPercorrida, consumoMedioKm, frequencia } = params;
    const litros = (distanciaPercorrida / consumoMedioKm) * frequencia;
    valorCombustivel = litros * FATOR_COMBUSTIVEL;
    valorTotal = valorCombustivel * precoUnitario;

    detalhes.tipo = 'distancia';
    detalhes.distanciaPercorrida = distanciaPercorrida;
    detalhes.consumoMedioKm = consumoMedioKm;
    detalhes.frequencia = frequencia;
    detalhes.litrosCalculados = litros;
    detalhes.litrosComFator = valorCombustivel;
  }
  // Cálculo por dias
  else if (params.numViaturas && params.consumoMedioDiario && params.dias) {
    const { numViaturas, consumoMedioDiario, dias } = params;
    const litros = numViaturas * consumoMedioDiario * dias;
    valorCombustivel = litros * FATOR_COMBUSTIVEL;
    valorTotal = valorCombustivel * precoUnitario;

    detalhes.tipo = 'dias';
    detalhes.numViaturas = numViaturas;
    detalhes.consumoMedioDiario = consumoMedioDiario;
    detalhes.dias = dias;
    detalhes.litrosCalculados = litros;
    detalhes.litrosComFator = valorCombustivel;
  }

  return {
    valorTotal: Number(valorTotal.toFixed(2)),
    valorCombustivel: Number(valorCombustivel.toFixed(2)),
    detalhes,
  };
}

/**
 * CLASSE IV - Material de Construção
 * Fórmula: Somatório(listaItens.map(qtd × valorUnitario))
 */
export function calcularClasseIV(params: ParametrosClasseIV): ResultadoCalculo {
  const { itens } = params;

  const valorTotal = itens.reduce((sum, item) => {
    return sum + (item.quantidade * item.valorUnitario);
  }, 0);

  return {
    valorTotal: Number(valorTotal.toFixed(2)),
    detalhes: {
      itens: itens.map(item => ({
        descricao: item.descricao,
        quantidade: item.quantidade,
        valorUnitario: item.valorUnitario,
        subtotal: item.quantidade * item.valorUnitario,
      })),
      totalItens: itens.length,
    },
  };
}

/**
 * CLASSE V - Munição e Explosivos
 * Fórmula: quantidade × valorUnitario
 */
export function calcularClasseV(params: ParametrosClasseV): ResultadoCalculo {
  const { quantidade, valorUnitario } = params;

  const valorTotal = quantidade * valorUnitario;

  return {
    valorTotal: Number(valorTotal.toFixed(2)),
    detalhes: {
      quantidade,
      valorUnitario,
      formula: 'quantidade × valorUnitario',
    },
  };
}

/**
 * CLASSE VI - Material Individual
 * Fórmula: efetivo × conjuntoItens × valorUnitario
 */
export function calcularClasseVI(params: ParametrosClasseVI): ResultadoCalculo {
  const { efetivo, conjuntoItens, valorUnitario } = params;

  const valorTotal = efetivo * conjuntoItens * valorUnitario;

  return {
    valorTotal: Number(valorTotal.toFixed(2)),
    detalhes: {
      efetivo,
      conjuntoItens,
      valorUnitario,
      formula: 'efetivo × conjuntoItens × valorUnitario',
    },
  };
}

/**
 * CLASSE VII - Equipamento Principal
 * Aquisição: quantidade × valorUnitario
 * Manutenção: quantidade × custoDiario × dias
 */
export function calcularClasseVII(params: ParametrosClasseVII): ResultadoCalculo {
  const { tipo, quantidade } = params;
  let valorTotal = 0;
  const detalhes: any = { tipo, quantidade };

  if (tipo === 'aquisicao') {
    if (!params.valorUnitario) {
      throw new Error('valorUnitario é obrigatório para aquisição');
    }
    valorTotal = quantidade * params.valorUnitario;
    detalhes.valorUnitario = params.valorUnitario;
    detalhes.formula = 'quantidade × valorUnitario';
  } else {
    if (!params.custoDiario || !params.dias) {
      throw new Error('custoDiario e dias são obrigatórios para manutenção');
    }
    valorTotal = quantidade * params.custoDiario * params.dias;
    detalhes.custoDiario = params.custoDiario;
    detalhes.dias = params.dias;
    detalhes.formula = 'quantidade × custoDiario × dias';
  }

  return {
    valorTotal: Number(valorTotal.toFixed(2)),
    detalhes,
  };
}

/**
 * CLASSE VIII - Material de Saúde
 * Fórmula: quantidade × valorUnitario + custoServicos (se houver)
 */
export function calcularClasseVIII(params: ParametrosClasseVIII): ResultadoCalculo {
  const { quantidade, valorUnitario, custoServicos = 0 } = params;

  const valorMateriais = quantidade * valorUnitario;
  const valorTotal = valorMateriais + custoServicos;

  return {
    valorTotal: Number(valorTotal.toFixed(2)),
    detalhes: {
      quantidade,
      valorUnitario,
      valorMateriais,
      custoServicos,
      formula: 'quantidade × valorUnitario + custoServicos',
    },
  };
}

/**
 * CLASSE IX - Manutenção de Viaturas
 * Grupos e custos:
 * - GP1: R$ 67-154/dia
 * - GP2: R$ 13-163/dia
 * - GP3: R$ 285/dia
 * Fórmula: numViaturas × custoDiario × dias + taxaAcionamento
 */
export function calcularClasseIX(params: ParametrosClasseIX): ResultadoCalculo {
  const { grupo, numViaturas, custoDiario, dias, taxaAcionamento = 0 } = params;

  const valorManutencao = numViaturas * custoDiario * dias;
  const valorTotal = valorManutencao + taxaAcionamento;

  return {
    valorTotal: Number(valorTotal.toFixed(2)),
    detalhes: {
      grupo,
      numViaturas,
      custoDiario,
      dias,
      valorManutencao,
      taxaAcionamento,
      custosPorGrupo: CUSTOS_MANUTENCAO_VIATURAS[grupo],
      formula: 'numViaturas × custoDiario × dias + taxaAcionamento',
    },
  };
}

/**
 * CLASSE X - Material Não Classificado
 * Fórmula: quantidade × valorUnitario
 */
export function calcularClasseX(params: ParametrosClasseX): ResultadoCalculo {
  const { quantidade, valorUnitario } = params;

  const valorTotal = quantidade * valorUnitario;

  return {
    valorTotal: Number(valorTotal.toFixed(2)),
    detalhes: {
      quantidade,
      valorUnitario,
      formula: 'quantidade × valorUnitario',
    },
  };
}

// ============================================
// FUNÇÃO PRINCIPAL DE CÁLCULO
// ============================================

/**
 * Calcula o valor de uma despesa baseado na classe e parâmetros
 */
export function calcularDespesa(
  classe: ClasseDespesa,
  parametros: any
): ResultadoCalculo {
  switch (classe) {
    case 'CLASSE_I':
      return calcularClasseI(parametros as ParametrosClasseI);
    case 'CLASSE_II':
      return calcularClasseII(parametros as ParametrosClasseII);
    case 'CLASSE_III':
      return calcularClasseIII(parametros as ParametrosClasseIII);
    case 'CLASSE_IV':
      return calcularClasseIV(parametros as ParametrosClasseIV);
    case 'CLASSE_V':
      return calcularClasseV(parametros as ParametrosClasseV);
    case 'CLASSE_VI':
      return calcularClasseVI(parametros as ParametrosClasseVI);
    case 'CLASSE_VII':
      return calcularClasseVII(parametros as ParametrosClasseVII);
    case 'CLASSE_VIII':
      return calcularClasseVIII(parametros as ParametrosClasseVIII);
    case 'CLASSE_IX':
      return calcularClasseIX(parametros as ParametrosClasseIX);
    case 'CLASSE_X':
      return calcularClasseX(parametros as ParametrosClasseX);
    default:
      throw new Error(`Classe não suportada: ${classe}`);
  }
}

// ============================================
// VALIDAÇÕES
// ============================================

/**
 * Valida se os parâmetros são válidos para a classe especificada
 */
export function validarParametros(
  classe: ClasseDespesa,
  parametros: any
): { valido: boolean; erros: string[] } {
  const erros: string[] = [];

  try {
    // Tenta calcular - se der erro, parametros são inválidos
    calcularDespesa(classe, parametros);
    return { valido: true, erros: [] };
  } catch (error: any) {
    erros.push(error.message || 'Parâmetros inválidos');
    return { valido: false, erros };
  }
}
