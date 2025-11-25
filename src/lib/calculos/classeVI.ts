/**
 * CLASSE VI — EQUIPAMENTOS DE ENGENHARIA (GND 3)
 *
 * Fórmula: custo = valor_hora × n_horas × 1,10
 * (fator 1,10 = 10% adicional de segurança)
 */

export interface ItemEquipamentoEngenharia {
  tipo: string; // Descrição do equipamento (ex: "Retroescavadeira", "Motoniveladora")
  valorHora: number; // R$/hora
  numeroHoras: number;
}

export interface ParametrosClasseVI {
  equipamentos: ItemEquipamentoEngenharia[];
}

export interface ResultadoClasseVI {
  valorTotal: number;
  detalhamento: any;
}

/**
 * Fator de segurança
 */
const FATOR_SEGURANCA = 1.10; // 10% adicional

/**
 * Cálculo para Equipamentos de Engenharia
 * Fórmula: custo = Σ(valor_hora × n_horas) × 1,10
 */
export function calcularEquipamentosEngenharia(equipamentos: ItemEquipamentoEngenharia[]): number {
  if (!equipamentos || equipamentos.length === 0) {
    throw new Error('Deve haver pelo menos um equipamento');
  }

  let total = 0;

  for (const item of equipamentos) {
    if (item.valorHora <= 0 || item.numeroHoras <= 0) {
      throw new Error(`Valores inválidos para o equipamento "${item.tipo}"`);
    }

    const custoBase = item.valorHora * item.numeroHoras;
    const custoComFator = custoBase * FATOR_SEGURANCA;
    total += custoComFator;
  }

  return total;
}

/**
 * Cálculo principal CLASSE VI
 */
export function calcularClasseVI(params: ParametrosClasseVI): ResultadoClasseVI {
  if (!params.equipamentos || params.equipamentos.length === 0) {
    throw new Error('Deve haver pelo menos um equipamento');
  }

  const valorTotal = calcularEquipamentosEngenharia(params.equipamentos);

  const detalhamento = {
    fatorSeguranca: FATOR_SEGURANCA,
    numeroEquipamentos: params.equipamentos.length,
    equipamentos: params.equipamentos.map(item => {
      const custoBase = item.valorHora * item.numeroHoras;
      const custoComFator = custoBase * FATOR_SEGURANCA;
      return {
        ...item,
        custoBase: Number(custoBase.toFixed(2)),
        custoComFator: Number(custoComFator.toFixed(2)),
        formula: `R$ ${item.valorHora.toFixed(2)}/h × ${item.numeroHoras}h × ${FATOR_SEGURANCA.toFixed(2)}`,
      };
    }),
  };

  return {
    valorTotal: Number(valorTotal.toFixed(2)),
    detalhamento,
  };
}

/**
 * Valores de referência para equipamentos de engenharia (R$/hora)
 * Baseado em valores médios de mercado
 */
export const VALORES_REFERENCIA_ENGENHARIA = {
  // Equipamentos de terraplanagem
  RETROESCAVADEIRA: 180.00,
  MOTONIVELADORA: 250.00,
  PA_CARREGADEIRA: 200.00,
  ESCAVADEIRA_HIDRAULICA: 220.00,
  TRATOR_ESTEIRA: 280.00,

  // Equipamentos de compactação
  ROLO_COMPACTADOR: 150.00,
  PLACA_VIBRATORIA: 80.00,
  SOQUETE_VIBRATÓRIO: 60.00,

  // Equipamentos de transporte
  CAMINHAO_BASCULANTE: 160.00,
  CAMINHAO_PIPA: 140.00,

  // Equipamentos diversos
  BETONEIRA: 50.00,
  SERRA_CIRCULAR: 30.00,
  MARTELETE: 40.00,
  GERADOR_ENERGIA: 100.00,
  BOMBA_SUBMERSIVEL: 70.00,

  // Equipamentos especiais
  GUINDASTE: 350.00,
  GUINCHO: 120.00,
  ANDAIME_METALICO: 25.00,
};

/**
 * Categorias de equipamentos
 */
export const CATEGORIAS_EQUIPAMENTOS = {
  TERRAPLANAGEM: [
    'RETROESCAVADEIRA',
    'MOTONIVELADORA',
    'PA_CARREGADEIRA',
    'ESCAVADEIRA_HIDRAULICA',
    'TRATOR_ESTEIRA',
  ],
  COMPACTACAO: [
    'ROLO_COMPACTADOR',
    'PLACA_VIBRATORIA',
    'SOQUETE_VIBRATÓRIO',
  ],
  TRANSPORTE: [
    'CAMINHAO_BASCULANTE',
    'CAMINHAO_PIPA',
  ],
  DIVERSOS: [
    'BETONEIRA',
    'SERRA_CIRCULAR',
    'MARTELETE',
    'GERADOR_ENERGIA',
    'BOMBA_SUBMERSIVEL',
  ],
  ESPECIAIS: [
    'GUINDASTE',
    'GUINCHO',
    'ANDAIME_METALICO',
  ],
};
