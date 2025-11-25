/**
 * CLASSE V — MUNIÇÕES E ARMAMENTO (GND 3 e 4)
 *
 * Dois tipos de cálculo:
 * 1. Munições: quantidade × preço unitário
 * 2. Armamento: 8% do MEM anual para manutenção
 */

export interface ItemMunicao {
  tipo: string; // Descrição da munição (ex: "7,62mm", "5,56mm", "Cal 12")
  quantidade: number;
  valorUnitario: number;
}

export interface ItemArmamento {
  tipo: string; // Descrição do armamento (ex: "Fuzil IMBEL", "Pistola Taurus")
  quantidade: number;
  valorMEM: number; // Valor do Material Empregado Militar por unidade
}

export interface ParametrosClasseV {
  tipoCalculo: 'MUNICOES' | 'ARMAMENTO' | 'AMBOS';

  // Para Munições
  municoes?: ItemMunicao[];

  // Para Armamento
  armamentos?: ItemArmamento[];
}

export interface ResultadoClasseV {
  valorTotal: number;
  detalhamento: any;
}

/**
 * Taxa de manutenção de armamento
 */
const TAXA_MANUTENCAO_ARMAMENTO = 0.08; // 8% do MEM anual

/**
 * Cálculo para Munições
 * Fórmula: custo = Σ(quantidade × valor_unitario)
 */
export function calcularMunicoes(municoes: ItemMunicao[]): number {
  if (!municoes || municoes.length === 0) {
    return 0;
  }

  let total = 0;

  for (const item of municoes) {
    if (item.quantidade <= 0 || item.valorUnitario < 0) {
      throw new Error(`Valores inválidos para a munição "${item.tipo}"`);
    }

    total += item.quantidade * item.valorUnitario;
  }

  return total;
}

/**
 * Cálculo para Armamento
 * Fórmula: custo = Σ(quantidade × valorMEM) × 8%
 */
export function calcularArmamento(armamentos: ItemArmamento[]): number {
  if (!armamentos || armamentos.length === 0) {
    return 0;
  }

  let total = 0;

  for (const item of armamentos) {
    if (item.quantidade <= 0 || item.valorMEM < 0) {
      throw new Error(`Valores inválidos para o armamento "${item.tipo}"`);
    }

    const valorTotalItem = item.quantidade * item.valorMEM;
    const custoManutencao = valorTotalItem * TAXA_MANUTENCAO_ARMAMENTO;
    total += custoManutencao;
  }

  return total;
}

/**
 * Cálculo principal CLASSE V
 */
export function calcularClasseV(params: ParametrosClasseV): ResultadoClasseV {
  let valorTotal = 0;
  let detalhamento: any = {
    tipoCalculo: params.tipoCalculo,
  };

  switch (params.tipoCalculo) {
    case 'MUNICOES':
      if (!params.municoes || params.municoes.length === 0) {
        throw new Error('Deve haver pelo menos uma munição');
      }

      const custoMunicoes = calcularMunicoes(params.municoes);
      valorTotal = custoMunicoes;

      detalhamento = {
        ...detalhamento,
        municoes: params.municoes.map(item => ({
          ...item,
          subtotal: item.quantidade * item.valorUnitario,
          formula: `${item.quantidade} × R$ ${item.valorUnitario.toFixed(2)}`,
        })),
      };
      break;

    case 'ARMAMENTO':
      if (!params.armamentos || params.armamentos.length === 0) {
        throw new Error('Deve haver pelo menos um armamento');
      }

      const custoArmamento = calcularArmamento(params.armamentos);
      valorTotal = custoArmamento;

      detalhamento = {
        ...detalhamento,
        taxaManutencao: TAXA_MANUTENCAO_ARMAMENTO,
        armamentos: params.armamentos.map(item => {
          const valorTotalItem = item.quantidade * item.valorMEM;
          const custoManutencao = valorTotalItem * TAXA_MANUTENCAO_ARMAMENTO;
          return {
            ...item,
            valorTotalMEM: valorTotalItem,
            custoManutencao: custoManutencao,
            formula: `(${item.quantidade} × R$ ${item.valorMEM.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}) × ${(TAXA_MANUTENCAO_ARMAMENTO * 100).toFixed(0)}%`,
          };
        })
      }
      break;

    case 'AMBOS':
      if ((!params.municoes || params.municoes.length === 0) &&
          (!params.armamentos || params.armamentos.length === 0)) {
        throw new Error('Deve haver pelo menos uma munição ou um armamento');
      }

      let custoMunicoesAmbos = 0;
      let custoArmamentoAmbos = 0;

      if (params.municoes && params.municoes.length > 0) {
        custoMunicoesAmbos = calcularMunicoes(params.municoes);
      }

      if (params.armamentos && params.armamentos.length > 0) {
        custoArmamentoAmbos = calcularArmamento(params.armamentos);
      }

      valorTotal = custoMunicoesAmbos + custoArmamentoAmbos;

      detalhamento = {
        ...detalhamento,
        custoMunicoes: custoMunicoesAmbos,
        custoArmamento: custoArmamentoAmbos,
        taxaManutencao: TAXA_MANUTENCAO_ARMAMENTO,
      };

      if (params.municoes && params.municoes.length > 0) {
        detalhamento.municoes = params.municoes.map(item => ({
          ...item,
          subtotal: item.quantidade * item.valorUnitario,
          formula: `${item.quantidade} × R$ ${item.valorUnitario.toFixed(2)}`,
        }));
      }

      if (params.armamentos && params.armamentos.length > 0) {
        detalhamento.armamentos = params.armamentos.map(item => {
          const valorTotalItem = item.quantidade * item.valorMEM;
          const custoManutencao = valorTotalItem * TAXA_MANUTENCAO_ARMAMENTO;
          return {
            ...item,
            valorTotalMEM: valorTotalItem,
            custoManutencao: custoManutencao,
            formula: `(${item.quantidade} × R$ ${item.valorMEM.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}) × ${(TAXA_MANUTENCAO_ARMAMENTO * 100).toFixed(0)}%`,
          };
        });
      }
      break;

    default:
      throw new Error('Tipo de cálculo inválido');
  }

  return {
    valorTotal: Number(valorTotal.toFixed(2)),
    detalhamento,
  };
}

/**
 * Valores de referência para munições (exemplos)
 */
export const VALORES_REFERENCIA_MUNICOES = {
  // Munição de fuzil/carabina
  '7.62MM': 3.50,
  '5.56MM': 2.80,

  // Munição de pistola
  '9MM': 1.50,
  '.40': 2.00,
  '.45': 2.50,

  // Munição de espingarda
  'CAL_12': 4.00,

  // Munição especial
  'GRANADA_40MM': 150.00,
  'FUMIGENO': 80.00,
};

/**
 * Valores de referência MEM para armamentos (exemplos em R$)
 */
export const VALORES_REFERENCIA_MEM = {
  // Fuzis e carabinas
  FUZIL_IMBEL_762: 8000.00,
  CARABINA_556: 7000.00,

  // Pistolas
  PISTOLA_TAURUS_9MM: 3000.00,
  PISTOLA_40: 3500.00,

  // Espingardas
  ESPINGARDA_CAL12: 2500.00,

  // Armamento especial
  METRALHADORA_762: 25000.00,
  LANCA_GRANADAS: 15000.00,
};
