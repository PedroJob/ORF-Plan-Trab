/**
 * Utilitários para geração de carimbos padronizados
 */

export interface CarimboParams {
  naturezas: string[];
  unidade: string;
  textoPadrao: string;
  memoriaCalculo: string;
  total: string;
}

/**
 * Gera um carimbo no formato padrão:
 * [Naturezas] – Destinado ao [Unidade]. [Texto padrão]
 * Memória de Cálculo:
 * [Detalhes]
 *
 * Total: [Valor]
 */
export function gerarCarimbo(params: CarimboParams): string {
  const naturezasTexto = params.naturezas.join(" e ");
  return `${naturezasTexto} – Destinado ao ${params.unidade}. ${params.textoPadrao}
Memória de Cálculo:

${params.memoriaCalculo}

Total: ${params.total}`;
}

/**
 * Formata valor monetário em BRL
 */
export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}
