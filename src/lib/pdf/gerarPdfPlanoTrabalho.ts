import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { DespesaWithRelations } from "@/types/despesas";
import { Prisma, User } from "@prisma/client";

// Tipos
type PlanoComRelacoes = Prisma.PlanoTrabalhoGetPayload<{
  include: {
    om: true;
    operacao: true;
    responsavel: true;
    despesas: {
      include: {
        classe: true;
        tipo: true;
        oms: { include: { om: true } };
        despesasNaturezas: { include: { natureza: true } };
      };
    };
  };
}>;

type OperacaoComOM = Prisma.OperacaoGetPayload<{
  include: {
    om: true;
    user: true;
  };
}>;

interface DespesaParaPdf {
  descricao: string;
  classe: string;
  tipo: string | null;
  omNome: string;
  codUG: string;
  valor30: number;
  valor39: number;
  gnd3: number;
  litros: number | null;
  precoUnitario: number | null;
  precoTotalCombustivel: number | null;
  memoriaCalculo: string;
}

interface GrupoDespesas {
  omPrincipal: string;
  codUGPrincipal: string;
  despesas: DespesaParaPdf[];
  subtotal30: number;
  subtotal39: number;
  subtotalGnd3: number;
}

// Função para carregar imagem de caminho local e converter para base64
async function carregarImagemBase64(path: string): Promise<string | null> {
  try {
    const response = await fetch(path);
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// Caminho local do Brasão da República (deve estar em /public/brasao-republica.png)
const BRASAO_PATH = "/brasao_republica.jpeg";

// Funções auxiliares
function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarNumero(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatarDataExtenso(data: Date): string {
  const meses = [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
  ];
  const dia = data.getDate();
  const mes = meses[data.getMonth()];
  const ano = data.getFullYear();
  return `${dia} de ${mes} de ${ano}`;
}

function formatarDataCurta(data: Date): string {
  const dia = data.getDate();
  const mes = data.getMonth() + 1;
  const ano = data.getFullYear();
  const mesesAbrev = [
    "JAN",
    "FEV",
    "MAR",
    "ABR",
    "MAI",
    "JUN",
    "JUL",
    "AGO",
    "SET",
    "OUT",
    "NOV",
    "DEZ",
  ];
  return `${dia}º ${mesesAbrev[mes - 1]} ${ano}`;
}

function getClasseNome(classeEnum: string): string {
  const mapa: Record<string, string> = {
    CLASSE_I: "CLASSE I",
    CLASSE_II: "CLASSE II",
    CLASSE_III: "CLASSE III",
    CLASSE_IV: "CLASSE IV",
    CLASSE_V: "CLASSE V",
    CLASSE_VI: "CLASSE VI",
    CLASSE_VII: "CLASSE VII",
    CLASSE_VIII: "CLASSE VIII",
    CLASSE_IX: "CLASSE IX",
    CLASSE_X: "CLASSE X",
  };
  return mapa[classeEnum] || classeEnum;
}

function extrairMemoriaCalculo(parametros: unknown): string {
  if (!parametros || typeof parametros !== "object") return "";
  const params = parametros as Record<string, unknown>;
  if (params.carimbo && typeof params.carimbo === "string") {
    return params.carimbo;
  }
  return "";
}

function processarDespesas(despesas: DespesaWithRelations[]): DespesaParaPdf[] {
  return despesas.map((despesa) => {
    const valorTotal = Number(despesa.valorCalculado);
    const valorCombustivelDespesa = despesa.valorCombustivel
      ? Number(despesa.valorCombustivel)
      : null;

    // Calcular valores por natureza de despesa
    let valor30 = 0;
    let valor39 = 0;

    despesa.despesasNaturezas.forEach((dn) => {
      const percentual = Number(dn.percentual);
      const valorND = valorTotal * (percentual / 100);
      if (dn.natureza.codigo === "33.90.30") {
        valor30 = valorND;
      } else if (dn.natureza.codigo === "33.90.39") {
        valor39 = valorND;
      }
    });

    // Se não tem naturezas específicas, assume tudo em 33.90.30
    if (despesa.despesasNaturezas.length === 0) {
      valor30 = valorTotal;
    }

    const gnd3 = valor30 + valor39;

    // Dados da OM principal
    const omPrincipal = despesa.oms[0]?.om;
    const omNome = omPrincipal ? `${omPrincipal.sigla}` : "";
    const codUG = omPrincipal?.codUG || "";

    // Verificar se é despesa de combustível (Classe III)
    const isCombustivel =
      despesa.tipo?.isCombustivel || despesa.classe.nome === "CLASSE_III";

    // Dados de combustível - usar valorCombustivel da despesa (que armazena LITROS)
    // valorCombustivel no banco = litros de combustível
    // valorCalculado = valor total em R$
    // precoUnitario = valorCalculado / litros
    let litros: number | null = null;
    let precoUnitario: number | null = null;
    let precoTotalCombustivel: number | null = null;

    if (
      isCombustivel &&
      valorCombustivelDespesa &&
      valorCombustivelDespesa > 0
    ) {
      litros = valorCombustivelDespesa; // valorCombustivel = litros
      precoUnitario = valorTotal / litros; // Calcular preço por litro
      precoTotalCombustivel = valorTotal; // Valor total do combustível
    }

    // Nome da classe formatado
    const classeNome = getClasseNome(despesa.classe.nome);
    const tipoNome = despesa.tipo?.nome || "";

    // Título da despesa (primeira coluna): Classe + Tipo
    const tituloDespesa = tipoNome ? `${classeNome} - ${tipoNome}` : classeNome;

    // Memória de cálculo (última coluna): usar descrição da despesa
    const memoriaCalculo =
      despesa.descricao || extrairMemoriaCalculo(despesa.parametros);

    return {
      descricao: tituloDespesa,
      classe: classeNome,
      tipo: tipoNome,
      omNome,
      codUG,
      valor30,
      valor39,
      gnd3,
      litros,
      precoUnitario,
      precoTotalCombustivel,
      memoriaCalculo,
    };
  });
}

function agruparDespesasPorOM(despesas: DespesaParaPdf[]): GrupoDespesas[] {
  const grupos: Map<string, GrupoDespesas> = new Map();

  despesas.forEach((despesa) => {
    const chave = despesa.codUG || "SEM_OM";

    if (!grupos.has(chave)) {
      grupos.set(chave, {
        omPrincipal: despesa.omNome,
        codUGPrincipal: despesa.codUG,
        despesas: [],
        subtotal30: 0,
        subtotal39: 0,
        subtotalGnd3: 0,
      });
    }

    const grupo = grupos.get(chave)!;
    grupo.despesas.push(despesa);
    grupo.subtotal30 += despesa.valor30;
    grupo.subtotal39 += despesa.valor39;
    grupo.subtotalGnd3 += despesa.gnd3;
  });

  return Array.from(grupos.values());
}

export interface OpcoesPdf {
  acoesRealizadas?: string;
  despesasOperacionais?: string;
  omPrincipal?: string;
}

export async function gerarPdfPlanoTrabalho(
  planos: PlanoComRelacoes | PlanoComRelacoes[],
  operacao: OperacaoComOM,
  responsavel?: User,
  opcoes?: OpcoesPdf
): Promise<void> {
  planos = ([] as PlanoComRelacoes[]).concat(planos);
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 10;
  const marginRight = 10;
  const marginTop = 10;
  let currentY = marginTop;

  // === CABEÇALHO COM BRASÃO ===
  try {
    const brasaoBase64 = await carregarImagemBase64(BRASAO_PATH);
    if (brasaoBase64) {
      doc.addImage(brasaoBase64, "PNG", pageWidth / 2 - 25, currentY, 50, 24);
      currentY += 30;
    } else {
      // Fallback: mostrar texto se imagem não encontrada
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.text("[Brasão da República]", pageWidth / 2, currentY + 10, {
        align: "center",
      });
      currentY += 20;
    }
  } catch {
    currentY += 5;
  }

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("MINISTÉRIO DA DEFESA", pageWidth / 2, currentY, {
    align: "center",
  });
  currentY += 5;
  doc.text("EXÉRCITO BRASILEIRO", pageWidth / 2, currentY, { align: "center" });
  currentY += 5;

  const omPrincipal =
    planos.length > 1
      ? "COMANDO MILITAR DA AMAZÔNIA"
      : opcoes?.omPrincipal ?? planos[0].om.nome.toUpperCase();

  doc.text(omPrincipal, pageWidth / 2, currentY, {
    align: "center",
  });
  currentY += 6;
  doc.setFontSize(9);
  doc.text(
    `PLANO DE TRABALHO LOGÍSTICO DE SOLICITAÇÃO DE RECURSOS ORÇAMENTÁRIOS E FINANCEIROS PARA ${operacao.nome.toUpperCase()}`,
    pageWidth / 2,
    currentY,
    { align: "center", maxWidth: pageWidth - 40 }
  );
  currentY += 10;

  // === TÍTULO ===
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("PLANO DE TRABALHO LOGÍSTICO", pageWidth / 2, currentY, {
    align: "center",
  });
  currentY += 8;

  // === DADOS DA OPERAÇÃO ===
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");

  const dataInicio = new Date(operacao.dataInicio);
  const dataFinal = new Date(operacao.dataFinal);
  const periodo = `${formatarDataCurta(dataInicio)} A ${formatarDataCurta(
    dataFinal
  )}`;
  const efetivoMil = operacao.efetivoMil;
  const efetivoExt = operacao.efetivoExt || 0;
  const efetivo =
    efetivoExt > 0
      ? `${efetivoMil} militares do EB + ${efetivoExt} agentes externos`
      : `${efetivoMil} militares do EB`;

  doc.text(`1. NOME DA OPERAÇÃO: `, marginLeft, currentY);
  doc.setFont("helvetica", "normal");
  doc.text(
    operacao.nome.toUpperCase(),
    marginLeft + doc.getTextWidth("1. NOME DA OPERAÇÃO: "),
    currentY
  );
  currentY += 5;

  doc.setFont("helvetica", "bold");
  doc.text(`2. PERÍODO: `, marginLeft, currentY);
  doc.setFont("helvetica", "normal");
  doc.text(
    `${periodo}`,
    marginLeft + doc.getTextWidth("2. PERÍODO: "),
    currentY
  );
  currentY += 5;

  doc.setFont("helvetica", "bold");
  doc.text(`3. EFETIVO EMPREGADO: `, marginLeft, currentY);
  doc.setFont("helvetica", "normal");
  doc.text(
    efetivo,
    marginLeft + doc.getTextWidth("3. EFETIVO EMPREGADO: "),
    currentY
  );
  currentY += 5;

  // Usar valores das opções se fornecidos, senão usar valores da operação
  const acoesRealizadas = opcoes?.acoesRealizadas || operacao.finalidade;
  const despesasOperacionais =
    opcoes?.despesasOperacionais || operacao.motivacao;

  if (acoesRealizadas) {
    doc.setFont("helvetica", "bold");
    doc.text(`4. AÇÕES REALIZADAS OU A REALIZAR: `, marginLeft, currentY);
    doc.setFont("helvetica", "normal");
    const acoesLines = doc.splitTextToSize(
      acoesRealizadas,
      pageWidth - marginLeft - marginRight - 60
    );
    doc.text(
      acoesLines,
      marginLeft + doc.getTextWidth("4. AÇÕES REALIZADAS OU A REALIZAR: ") + 2,
      currentY
    );
    currentY += acoesLines.length * 4 + 2;
  }

  if (despesasOperacionais) {
    doc.setFont("helvetica", "bold");
    doc.text(
      `5. DESPESAS OPERACIONAIS REALIZADAS OU A REALIZAR: `,
      marginLeft,
      currentY
    );
    doc.setFont("helvetica", "normal");
    const despesasLines = doc.splitTextToSize(
      despesasOperacionais,
      pageWidth - marginLeft - marginRight - 80
    );
    doc.text(
      despesasLines,
      marginLeft +
        doc.getTextWidth(
          "5. DESPESAS OPERACIONAIS REALIZADAS OU A REALIZAR: "
        ) +
        2,
      currentY
    );
    currentY += despesasLines.length * 4 + 2;
  }

  currentY += 5;

  for (const plano of planos) {
    if (planos.length > 1) {
      // Adicionar OM que preencheu o plano
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(
        `OM RESPONSÁVEL: ${plano.om.nome.toUpperCase()}`,
        marginLeft,
        currentY
      );
      currentY += 8;
    }

    // === TABELA DE DESPESAS ===
    const despesasProcessadas = processarDespesas(
      plano.despesas as unknown as DespesaWithRelations[]
    );
    const grupos = agruparDespesasPorOM(despesasProcessadas);

    let valorTotalGeral = 0;

    grupos.forEach((grupo) => {
      // Cabeçalho da tabela para cada grupo
      const tableHead = [
        [
          "DESPESAS (ORDENAR POR CLASSE DE SUBSISTÊNCIA)",
          "OM (UGE)\nCODUG",
          "33.90.30",
          "33.90.39",
          "GND 3",
          "LITROS",
          "PREÇO\nUNITÁRIO",
          "PREÇO\nTOTAL",
          "DETALHAMENTO / MEMÓRIA DE CÁLCULO",
        ],
      ];

      // Corpo da tabela
      const tableBody: (string | number)[][] = [];

      grupo.despesas.forEach((despesa) => {
        tableBody.push([
          despesa.descricao,
          `${despesa.omNome}\n(${despesa.codUG})`,
          formatarNumero(despesa.valor30),
          formatarNumero(despesa.valor39),
          formatarNumero(despesa.gnd3),
          despesa.litros ? formatarNumero(despesa.litros) : "-",
          despesa.precoUnitario
            ? `R$ ${formatarNumero(despesa.precoUnitario)}`
            : "-",
          despesa.precoTotalCombustivel
            ? `R$ ${formatarNumero(despesa.precoTotalCombustivel)}`
            : "-",
          despesa.memoriaCalculo,
        ]);
      });

      // Linha de subtotal
      tableBody.push([
        "SOMA POR ND E GP DE DESPESA",
        "",
        formatarNumero(grupo.subtotal30),
        formatarNumero(grupo.subtotal39),
        formatarNumero(grupo.subtotalGnd3),
        "",
        "",
        "",
        "",
      ]);

      valorTotalGeral += grupo.subtotalGnd3;

      autoTable(doc, {
        head: tableHead,
        body: tableBody,
        startY: currentY,
        theme: "grid",
        styles: {
          fontSize: 6,
          cellPadding: 1,
          overflow: "linebreak",
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          fontStyle: "bold",
          halign: "center",
          valign: "middle",
          lineWidth: 0.2,
        },
        columnStyles: {
          // Total: 28+18+15+15+15+14+16+16+140 = 277mm (A4 landscape - 20mm margins)
          0: { cellWidth: 28, overflow: "linebreak" }, // DESPESAS
          1: { cellWidth: 18, halign: "center", overflow: "linebreak" }, // OM (UGE) CODUG
          2: { cellWidth: 15, halign: "right" }, // 33.90.30
          3: { cellWidth: 15, halign: "right" }, // 33.90.39
          4: { cellWidth: 15, halign: "right" }, // GND 3
          5: { cellWidth: 14, halign: "right" }, // LITROS
          6: { cellWidth: 16, halign: "right" }, // PREÇO UNIT
          7: { cellWidth: 16, halign: "right" }, // PREÇO TOTAL
          8: { cellWidth: 140, overflow: "linebreak" }, // DETALHAMENTO
        },
        didParseCell: function (data) {
          // Estilizar linha de subtotal
          if (
            data.row.index === tableBody.length - 1 &&
            data.section === "body"
          ) {
            data.cell.styles.fontStyle = "bold";
            data.cell.styles.fillColor = [240, 240, 240];
          }
        },
        margin: { left: marginLeft, right: marginRight },
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      currentY = (doc as any).lastAutoTable.finalY + 5;

      // Verificar se precisa de nova página
      if (currentY > pageHeight - 40) {
        doc.addPage();
        currentY = marginTop;
      }
    });

    // === VALOR TOTAL ===
    currentY += 5;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(
      `VALOR TOTAL: ${formatarMoeda(valorTotalGeral)}`,
      pageWidth / 2,
      currentY,
      { align: "center" }
    );
    currentY += 15;
  }

  // === RODAPÉ - ASSINATURA ===
  const hoje = new Date();
  const cidade = "MANAUS - AM"; // Pode ser obtido da OM
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(
    `${cidade}, ${formatarDataExtenso(hoje)}.`,
    pageWidth / 2,
    currentY,
    {
      align: "center",
    }
  );
  currentY += 15;

  // Nome e cargo do responsável
  if (responsavel) {
    doc.setFont("helvetica", "bold");
    doc.text(
      `${responsavel.postoGraduacao} ${responsavel.nomeCompleto.toUpperCase()}`,
      pageWidth / 2,
      currentY,
      { align: "center" }
    );
    currentY += 5;
    doc.setFont("helvetica", "normal");
    doc.text(`Responsável pelo Plano de Trabalho`, pageWidth / 2, currentY, {
      align: "center",
    });
  }

  // Salvar o PDF
  doc.save(`plano_trabalho_${operacao.nome.replace(/\s+/g, "_")}.pdf`);
}
