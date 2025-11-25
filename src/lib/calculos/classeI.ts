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
  destinacao: string;
  descricaoOperacao: string;
  nomeOperacao?: string;
  resultado: ResultadoOperacao;
  tipoRefeicao: "QS" | "QR";
}): string {
  const {
    destinacao,
    descricaoOperacao,
    nomeOperacao,
    resultado,
    tipoRefeicao,
  } = params;

  const contexto = nomeOperacao
    ? `${descricaoOperacao} no contexto da ${nomeOperacao}.`
    : `${descricaoOperacao}.`;

  const total = resultado.total;

  let carimbo = `${destinacao} - ${contexto}\n`;
  carimbo += `- Memória de Cálculo ${tipoRefeicao}:\n\n`;
  carimbo += resultado.memoriaCalculo;
  carimbo += `\nTotal: R$ ${total.toFixed(2).replace(".", ",")}`;

  return carimbo;
}
