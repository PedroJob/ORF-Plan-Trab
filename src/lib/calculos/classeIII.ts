/**
 * CLASSE III — SUPRIMENTO (COMBUSTÍVEIS AUTOMOTIVOS)
 *
 * Implementação baseada nas tabelas de consumo médio de viaturas e equipamentos
 */

// Tipos de combustível
export type TipoCombustivel = "OD" | "GAS";

// Preços médios nacionais
export const PRECOS_COMBUSTIVEL = {
  GC: 6.3, // Gasolina Comum
  OD: 6.03, // Óleo Diesel
  GAS: 6.3, // Gasolina (genérico)
};

// Fator de segurança para Classe III (30%)
export const FATOR_SEGURANCA_CLASSE_III = 1.3;

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
  nomeOperacao?: string
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
  const infoPreco = params.precoCombustivelCustomizado
    ? `R$ ${precoPorLitro.toFixed(2)} (Preço Customizado)`
    : `R$ ${precoPorLitro.toFixed(2)} (Preço Médio Nacional)`;
  const totalFormatado = `R$ ${valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const textoPadrao = `Aquisição de ${nomeCombustivel} para custear deslocamento de viaturas e equipamentos no contexto da ${operacaoTexto}.`;

  const memoriaCalculo = `Viatura/Equipamento x (trecho / consumo) x dias x 1,3

${textoItens.join("\n")}

Total: ${litrosTotais.toFixed(1)} L de ${nomeCombustivel} x ${FATOR_SEGURANCA_CLASSE_III} (Fator de segurança de 30%): ${litrosComFator.toFixed(1)} L
Valor Total: ${litrosComFator.toFixed(1)} L de ${nomeCombustivel} x ${infoPreco} = ${totalFormatado}`;

  const carimbo = `33.90.30 – Destinado ao ${unidadeTexto}. ${textoPadrao}
Memória de Cálculo:

${memoriaCalculo}

Total: ${totalFormatado}`;

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
