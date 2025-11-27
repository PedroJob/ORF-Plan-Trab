interface CalculoOperacaoParams {
  efetivo: number;
  numeroRefIntermediarias: number; // máximo 3
  tipoRefeicao: "QS" | "QR";
  valorRefeicao: number;
  diasOperacao: number;
  diasEtapaCompleta?: number; // padrão 8 dias
}

interface ResultadoOperacao {
  total: number;
  detalhamento: {
    valorEtapa: number;
    valorRefIntermediaria: number;
  };
  memoriaCalculo: string;
}

export function calcularValorOperacao(
  params: CalculoOperacaoParams
): ResultadoOperacao {
  const {
    efetivo,
    numeroRefIntermediarias,
    tipoRefeicao,
    valorRefeicao,
    diasOperacao,
    diasEtapaCompleta = 8,
  } = params;

  let valorEtapa = 0;
  let valorRefIntermediaria = 0;

  if (diasOperacao <= 22) {
    valorRefIntermediaria =
      efetivo * numeroRefIntermediarias * (valorRefeicao / 3) * diasOperacao;
  } else if (diasOperacao <= 30) {
    const diasEtapa = diasOperacao - 22;
    valorEtapa = efetivo * valorRefeicao * diasEtapa;

    valorRefIntermediaria =
      efetivo * numeroRefIntermediarias * (valorRefeicao / 3) * diasOperacao;
  } else {
    const ciclosCompletos = Math.floor(diasOperacao / 30);

    let totalDiasEtapa = 0;
    for (let i = 0; i < ciclosCompletos; i++) {
      totalDiasEtapa += Math.min(30, diasEtapaCompleta);
    }

    valorEtapa = efetivo * valorRefeicao * totalDiasEtapa;

    valorRefIntermediaria =
      efetivo * numeroRefIntermediarias * (valorRefeicao / 3) * diasOperacao;
  }

  const total = valorEtapa + valorRefIntermediaria;

  const numerosPorExtenso = ["", "uma", "duas", "três"];
  const textoIntermediarias =
    numeroRefIntermediarias > 1
      ? `para ${numeroRefIntermediarias} (${numerosPorExtenso[numeroRefIntermediarias]}) intermediárias`
      : "";

  let memoriaCalculo = "";

  if (numeroRefIntermediarias > 1) {
    memoriaCalculo += `(${tipoRefeicao}) ${textoIntermediarias}:\n\n`;
  }

  if (valorEtapa > 0) {
    const diasEtapaUsados = valorEtapa / (efetivo * valorRefeicao);
    memoriaCalculo += `- ${efetivo} militares x R$ ${valorRefeicao.toFixed(
      2
    )} x ${diasEtapaUsados} dias = R$ ${valorEtapa.toFixed(2)}\n`;
  }

  memoriaCalculo += `- ${efetivo} militares x ${numeroRefIntermediarias} Ref Itr x (R$ ${valorRefeicao.toFixed(
    2
  )}/3) x ${diasOperacao} dias = R$ ${valorRefIntermediaria.toFixed(2)}\n`;

  return {
    total,
    detalhamento: {
      valorEtapa,
      valorRefIntermediaria,
    },
    memoriaCalculo,
  };
}

export function gerarCarimboCompleto(params: {
  unidade: string;
  nomeOperacao: string;
  efetivo: number;
  resultado: ResultadoOperacao;
  tipoRefeicao: "QS" | "QR";
  naturezas?: string[];
}): string {
  const { unidade, nomeOperacao, efetivo, resultado, tipoRefeicao, naturezas } = params;

  const tipoTexto = tipoRefeicao === "QR" ? "QR ETAPA e QR para refeições intermediárias" : "QS para refeições intermediárias";
  const textoPadrao = `Aquisição de gêneros alimentícios (${tipoTexto}) destinados a ${efetivo} militares no contexto da ${nomeOperacao}.`;

  const total = resultado.total;
  const totalFormatado = `R$ ${total.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Usar naturezas dinâmicas ou fallback para 33.90.30
  const naturezasTexto = naturezas && naturezas.length > 0
    ? naturezas.join(" e ")
    : "33.90.30";

  return `${naturezasTexto} – Destinado ao ${unidade}. ${textoPadrao}
Memória de Cálculo ${tipoRefeicao}:

${resultado.memoriaCalculo}
Total: ${totalFormatado}`;
}
