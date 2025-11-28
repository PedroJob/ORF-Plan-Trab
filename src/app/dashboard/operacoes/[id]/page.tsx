"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  ArrowLeft,
  Plus,
  Calendar,
  Users,
  FileText,
  AlertCircle,
  Trash2,
  Building2,
  DollarSign,
  CheckCircle2,
  Clock,
  ChevronRight,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { useSession } from "@/hooks/useSession";
import { ModalOmsSubordinadas } from "@/components/operacoes/ModalOmsSubordinadas";
import { gerarPdfPlanoTrabalho } from "@/lib/pdf/gerarPdfPlanoTrabalho";

interface OMParticipante {
  id: string;
  omId: string;
  valorLimite: number;
  om: {
    id: string;
    nome: string;
    sigla: string;
    tipo: string;
  };
}

interface PlanoTrabalho {
  id: string;
  titulo: string;
  versao: number;
  status: string;
  omId: string;
  valorTotalDespesas?: number;
  responsavel: {
    nomeCompleto: string;
    nomeGuerra?: string;
    postoGraduacao: string;
  };
  om?: {
    id: string;
    nome: string;
    sigla: string;
  };
}

interface Operacao {
  id: string;
  nome: string;
  efetivoMil: number;
  efetivoExt?: number;
  dataInicio: string;
  dataFinal: string;
  status: string;
  prioridade: string;
  valorLimiteTotal?: number;
  finalidade?: string;
  motivacao?: string;
  consequenciaNaoAtendimento?: string;
  observacoes?: string;
  om: {
    id: string;
    nome: string;
    sigla: string;
    tipo: string;
  };
  omsParticipantes: OMParticipante[];
  planosTrabalho: PlanoTrabalho[];
}

export default function OperacaoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useSession();
  const id = params?.id as string;

  const [operacao, setOperacao] = useState<Operacao | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedOmForModal, setSelectedOmForModal] = useState<{
    id: string;
    nome: string;
    sigla: string;
  } | null>(null);
  const [subordinadasCount, setSubordinadasCount] = useState<
    Record<string, number>
  >({});
  const [generatingPdf, setGeneratingPdf] = useState(false);

  useEffect(() => {
    if (id) {
      fetchOperacao();
    }
  }, [id]);

  // Buscar contagem de subordinadas para cada OM participante
  useEffect(() => {
    if (operacao?.omsParticipantes) {
      operacao.omsParticipantes.forEach(async (omPart) => {
        try {
          const response = await fetch(`/api/oms/${omPart.om.id}/subordinadas`);
          if (response.ok) {
            const data = await response.json();
            setSubordinadasCount((prev) => ({
              ...prev,
              [omPart.om.id]: data.subordinadas?.length || 0,
            }));
          }
        } catch (error) {
          console.error("Erro ao buscar subordinadas:", error);
        }
      });
    }
  }, [operacao?.omsParticipantes]);

  const fetchOperacao = async () => {
    try {
      const response = await fetch(`/api/operacoes/${id}`);
      if (response.ok) {
        const data = await response.json();
        setOperacao(data);
      }
    } catch (error) {
      console.error("Error fetching operacao:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      RASCUNHO: "bg-olive-100 text-olive-800",
      EM_ANALISE: "bg-amber-100 text-amber-800",
      APROVADO: "bg-military-200 text-military-900",
      REPROVADO: "bg-red-100 text-red-800",
    };
    return (
      colors[status as keyof typeof colors] || "bg-olive-100 text-olive-800"
    );
  };

  const getPrioridadeColor = (prioridade: string) => {
    const colors = {
      BAIXA: "bg-military-100 text-military-700",
      MEDIA: "bg-amber-100 text-amber-700",
      ALTA: "bg-orange-100 text-orange-800",
      CRITICA: "bg-red-100 text-red-800",
    };
    return (
      colors[prioridade as keyof typeof colors] || "bg-olive-100 text-olive-800"
    );
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Tem certeza que deseja excluir esta operação? Esta ação não pode ser desfeita."
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/operacoes/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/dashboard/operacoes");
      } else {
        const error = await response.json();
        alert(`Erro ao excluir operação: ${error.error}`);
      }
    } catch (error) {
      console.error("Error deleting operacao:", error);
      alert("Erro ao excluir operação");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const handleGerarPdf = async () => {
    if (!operacao || operacao.planosTrabalho.length === 0) {
      alert("Não há planos de trabalho para gerar o PDF");
      return;
    }

    setGeneratingPdf(true);
    try {
      const response = await fetch(`/api/operacoes/${id}/planos`);

      if (!response.ok) {
        throw new Error("Erro ao buscar planos");
      }

      const { planos, operacao: operacaoCompleta } = await response.json();

      if (planos.length === 0) {
        alert("Nenhum plano de trabalho encontrado");
        return;
      }

      await gerarPdfPlanoTrabalho(planos, operacaoCompleta);
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      alert("Erro ao gerar PDF. Tente novamente.");
    } finally {
      setGeneratingPdf(false);
    }
  };

  // Calcular valor total utilizado (soma dos planos)
  const valorTotalUtilizado =
    operacao?.planosTrabalho.reduce(
      (acc, plano) => acc + (Number(plano.valorTotalDespesas) || 0),
      0
    ) || 0;

  // Obter plano de uma OM específica
  const getPlanoByOm = (omId: string) => {
    return operacao?.planosTrabalho.find((p) => p.omId === omId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-military-600"></div>
      </div>
    );
  }

  if (!operacao) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-military-900 mb-2">
          Operação não encontrada
        </h2>
        <p className="text-olive-700 mb-6">
          A operação que você procura não existe ou foi removida
        </p>
        <Link href="/dashboard/operacoes">
          <Button variant="secondary">Voltar para Operações</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/dashboard/operacoes"
          className="inline-flex items-center text-olive-700 hover:text-military-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Operações
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-military-900 mb-2">
              {operacao.nome}
            </h1>
            <p className="text-olive-700">
              Criada por: {operacao.om.sigla} - {operacao.om.nome}
            </p>
          </div>
          <div className="flex gap-2">
            <span
              className={`px-4 py-2 text-sm font-medium rounded-lg ${getPrioridadeColor(
                operacao.prioridade
              )}`}
            >
              {operacao.prioridade}
            </span>
            <span
              className={`px-4 py-2 text-sm font-medium rounded-lg ${getStatusColor(
                operacao.status
              )}`}
            >
              {operacao.status.replace("_", " ")}
            </span>
            {operacao.planosTrabalho.length > 0 && (
              <Button
                variant="secondary"
                onClick={handleGerarPdf}
                disabled={generatingPdf}
                className="bg-military-50 text-military-700 hover:bg-military-100 border-military-200"
              >
                {generatingPdf ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Gerar PDF
                  </>
                )}
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-50 text-red-700 hover:bg-red-100 border-red-200"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isDeleting ? "Excluindo..." : "Excluir"}
            </Button>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg border border-olive-200">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-military-600" />
            <div className="text-sm text-olive-700">Efetivo</div>
          </div>
          <div className="text-2xl font-bold text-military-900">
            {operacao.efetivoMil}
          </div>
          <div className="text-xs text-olive-600 mt-1">militares</div>
          {operacao.efetivoExt && (
            <>
              <div className="text-lg font-bold text-military-900 mt-2">
                {operacao.efetivoExt}
              </div>
              <div className="text-xs text-olive-600">agentes externos</div>
            </>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg border border-olive-200">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-5 h-5 text-military-600" />
            <div className="text-sm text-olive-700">Período</div>
          </div>
          <div className="text-lg font-semibold text-military-900">
            {format(new Date(operacao.dataInicio), "dd/MM/yyyy")} até{" "}
            {format(new Date(operacao.dataFinal), "dd/MM/yyyy")}
          </div>
          <div className="text-xs text-olive-600 mt-1">
            {Math.ceil(
              (new Date(operacao.dataFinal).getTime() -
                new Date(operacao.dataInicio).getTime()) /
                (1000 * 60 * 60 * 24)
            )}{" "}
            dias
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-olive-200">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-military-600" />
            <div className="text-sm text-olive-700">Valor Limite Total</div>
          </div>
          <div className="text-2xl font-bold text-military-900">
            {operacao.valorLimiteTotal
              ? formatCurrency(Number(operacao.valorLimiteTotal))
              : "Não definido"}
          </div>
          {operacao.valorLimiteTotal && (
            <div className="text-xs text-olive-600 mt-1">
              Utilizado: {formatCurrency(valorTotalUtilizado)} (
              {(
                (valorTotalUtilizado / Number(operacao.valorLimiteTotal)) *
                100
              ).toFixed(1)}
              %)
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg border border-olive-200">
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="w-5 h-5 text-military-600" />
            <div className="text-sm text-olive-700">OMs Participantes</div>
          </div>
          <div className="text-2xl font-bold text-military-900">
            {operacao.omsParticipantes.length}
          </div>
          <div className="text-xs text-olive-600 mt-1">
            {operacao.planosTrabalho.length} planos cadastrados
          </div>
        </div>
      </div>

      {/* OMs Participantes */}
      {operacao.omsParticipantes.length > 0 && (
        <div className="bg-white rounded-lg border border-olive-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-military-900 mb-4">
            OMs Participantes
          </h2>
          <div className="space-y-3">
            {operacao.omsParticipantes.map((omPart) => {
              const plano = getPlanoByOm(omPart.omId);
              const hasSubordinadas =
                (subordinadasCount[omPart.om.id] || 0) > 0;
              const canCreatePlano =
                omPart.omId === user?.om.id && !hasSubordinadas && !plano;

              return (
                <div
                  key={omPart.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  {hasSubordinadas ? (
                    <button
                      onClick={() =>
                        setSelectedOmForModal({
                          id: omPart.om.id,
                          nome: omPart.om.nome,
                          sigla: omPart.om.sigla,
                        })
                      }
                      className="flex items-center gap-4 text-left hover:bg-gray-100 rounded-lg p-2 -m-2 transition-colors"
                    >
                      <Building2 className="w-8 h-8 text-military-600" />
                      <div>
                        <div className="font-medium text-military-900 flex items-center gap-2">
                          {omPart.om.sigla} - {omPart.om.nome}
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                        <div className="text-sm text-olive-600">
                          Tipo: {omPart.om.tipo} -{" "}
                          {subordinadasCount[omPart.om.id]} subordinada(s)
                        </div>
                      </div>
                    </button>
                  ) : (
                    <div className="flex items-center gap-4">
                      <Building2 className="w-8 h-8 text-military-600" />
                      <div>
                        <div className="font-medium text-military-900">
                          {omPart.om.sigla} - {omPart.om.nome}
                        </div>
                        <div className="text-sm text-olive-600">
                          Tipo: {omPart.om.tipo}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-sm text-olive-600">Valor Limite</div>
                      <div className="font-semibold text-military-900">
                        {formatCurrency(Number(omPart.valorLimite))}
                      </div>
                    </div>
                    <div className="w-32">
                      {plano ? (
                        <Link href={`/dashboard/planos/${plano.id}`}>
                          <div
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg ${getStatusColor(
                              plano.status
                            )}`}
                          >
                            {plano.status === "APROVADO" ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              <Clock className="w-4 h-4" />
                            )}
                            <span className="text-sm font-medium">
                              {plano.status.replace("_", " ")}
                            </span>
                          </div>
                        </Link>
                      ) : canCreatePlano ? (
                        <Link
                          href={`/dashboard/planos/novo?operacaoId=${operacao.id}`}
                        >
                          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-military-600 text-white hover:bg-military-700">
                            <Plus className="w-4 h-4" />
                            <span className="text-sm font-medium">
                              Criar Plano
                            </span>
                          </div>
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Campos Descritivos */}
      {(operacao.finalidade ||
        operacao.motivacao ||
        operacao.consequenciaNaoAtendimento ||
        operacao.observacoes) && (
        <div className="bg-white rounded-lg border border-olive-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-military-900 mb-4">
            Detalhes da Operação
          </h2>

          <div className="space-y-4">
            {operacao.finalidade && (
              <div>
                <h3 className="text-sm font-semibold text-military-700 mb-2">
                  Finalidade
                </h3>
                <p className="text-olive-800 whitespace-pre-wrap">
                  {operacao.finalidade}
                </p>
              </div>
            )}

            {operacao.motivacao && (
              <div>
                <h3 className="text-sm font-semibold text-military-700 mb-2">
                  Motivação
                </h3>
                <p className="text-olive-800 whitespace-pre-wrap">
                  {operacao.motivacao}
                </p>
              </div>
            )}

            {operacao.consequenciaNaoAtendimento && (
              <div>
                <h3 className="text-sm font-semibold text-military-700 mb-2">
                  Consequência do Não Atendimento
                </h3>
                <p className="text-olive-800 whitespace-pre-wrap">
                  {operacao.consequenciaNaoAtendimento}
                </p>
              </div>
            )}

            {operacao.observacoes && (
              <div>
                <h3 className="text-sm font-semibold text-military-700 mb-2">
                  Observações
                </h3>
                <p className="text-olive-800 whitespace-pre-wrap">
                  {operacao.observacoes}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de OMs Subordinadas */}
      {selectedOmForModal && (
        <ModalOmsSubordinadas
          isOpen={!!selectedOmForModal}
          onClose={() => setSelectedOmForModal(null)}
          omParticipante={selectedOmForModal}
          operacaoId={operacao.id}
          planosTrabalho={operacao.planosTrabalho.map((p) => ({
            id: p.id,
            omId: p.omId,
            status: p.status,
          }))}
          userOmId={user?.om.id}
        />
      )}
    </div>
  );
}
