"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ArrowLeft, Plus, Trash2, Check, X, FileDown } from "lucide-react";
import Link from "next/link";
import { DespesasLogistico } from "@/components/despesas/DespesasLogistico";
import { StatusAprovacao } from "@/components/planos/StatusAprovacao";
import { HistoricoAprovacoes } from "@/components/planos/HistoricoAprovacoes";
import { DespesaWithRelations, UserOM } from "@/types/despesas";
import { PlanoTrabalho, Prisma } from "@prisma/client";
import { PlanoTrabalhoWithRelations } from "@/types/plano-trabalho";
import { gerarPdfPlanoTrabalho, OpcoesPdf } from "@/lib/pdf/gerarPdfPlanoTrabalho";

interface OM {
  id: string;
  nome: string;
  sigla: string;
  tipo: string;
  codUG: string;
}

interface Natureza {
  id: string;
  codigo: string;
  nome: string;
  descricao: string | null;
}

export default function PlanoTrabalhoPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [plano, setPlano] = useState<PlanoTrabalhoWithRelations | null>(null);
  const [despesas, setDespesas] = useState<DespesaWithRelations[]>([]);
  const [oms, setOms] = useState<OM[]>([]);
  const [naturezas, setNaturezas] = useState<Natureza[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddItem, setShowAddItem] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [userOm, setUserOm] = useState<UserOM | null>(null);

  // Estado para modal de exportação PDF
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfOpcoes, setPdfOpcoes] = useState<OpcoesPdf>({
    acoesRealizadas: "",
    despesasOperacionais: "",
  });
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Form state for new item
  const [newItem, setNewItem] = useState({
    descricao: "",
    valorUnitario: "",
    quantidade: "",
    omId: "",
    naturezaId: "",
  });

  useEffect(() => {
    if (id) {
      fetchData();
      fetchOms();
      fetchNaturezas();
      fetchCurrentUser();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      const [planoRes, itensRes] = await Promise.all([
        fetch(`/api/planos/${id}`),
        fetch(`/api/planos/${id}/itens`),
      ]);

      if (planoRes.ok) {
        const planoData = await planoRes.json();
        setPlano(planoData);
      }

      if (itensRes.ok) {
        const itensData = await itensRes.json();
        setDespesas(itensData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOms = async () => {
    try {
      const response = await fetch("/api/organizacoes");
      if (response.ok) {
        const data = await response.json();
        setOms(data);
      }
    } catch (error) {
      console.error("Error fetching OMs:", error);
    }
  };

  const fetchNaturezas = async () => {
    try {
      const response = await fetch("/api/naturezas");
      if (response.ok) {
        const data = await response.json();
        setNaturezas(data);
      }
    } catch (error) {
      console.error("Error fetching naturezas:", error);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        const data = await response.json();
        setCurrentUserRole(data.role);
        if (data.om) {
          setUserOm({
            id: data.om.id,
            nome: data.om.nome,
            sigla: data.om.sigla,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching current user:", error);
    }
  };

  // Verifica se o usuário atual pode aprovar no nível atual do plano
  // Fluxo simplificado: apenas 1 nível de aprovação (S4)
  const canApproveCurrentLevel = (): boolean => {
    if (!plano || !currentUserRole || !plano.nivelAprovacaoAtual) {
      return false;
    }

    // SUPER_ADMIN pode aprovar em qualquer nível
    if (currentUserRole === "SUPER_ADMIN") return true;

    // Apenas S4 pode aprovar (nível 1 é o único)
    if (plano.nivelAprovacaoAtual === 1) {
      return currentUserRole === "S4";
    }

    return false;
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();

    const valorTotal =
      parseFloat(newItem.valorUnitario) * parseFloat(newItem.quantidade);

    try {
      const response = await fetch(`/api/planos/${id}/itens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          descricao: newItem.descricao,
          valorUnitario: parseFloat(newItem.valorUnitario),
          quantidade: parseFloat(newItem.quantidade),
          valorTotal,
          omId: newItem.omId,
          naturezaId: newItem.naturezaId,
        }),
      });

      if (response.ok) {
        const novoItem = await response.json();
        setDespesas([...despesas, novoItem]);
        setNewItem({
          descricao: "",
          valorUnitario: "",
          quantidade: "",
          omId: "",
          naturezaId: "",
        });
        setShowAddItem(false);
      } else {
        const error = await response.json();
        console.error("Error response:", error);
        alert(`Erro ao adicionar item: ${error.error || "Erro desconhecido"}`);
      }
    } catch (error) {
      console.error("Error adding item:", error);
      alert("Erro ao adicionar item");
    }
  };

  const handleEnviarAnalise = async () => {
    if (!confirm("Deseja enviar este plano para análise? Após o envio, o plano ficará bloqueado para edições até a conclusão do processo de aprovação.")) return;

    try {
      const response = await fetch(`/api/planos/${id}/enviar-analise`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message || "Plano enviado para análise com sucesso!");
        fetchData();
      } else {
        const error = await response.json();
        alert(error.error || "Erro ao enviar plano para análise");
      }
    } catch (error) {
      console.error("Error sending for analysis:", error);
      alert("Erro ao enviar plano para análise");
    }
  };

  const handleAprovar = async () => {
    if (!confirm("Deseja aprovar este plano de trabalho?")) return;

    try {
      const response = await fetch(`/api/planos/${id}/aprovar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acao: "APROVADO" }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message || "Plano aprovado com sucesso!");
        fetchData();
      } else {
        const error = await response.json();
        alert(error.error || "Erro ao aprovar plano");
      }
    } catch (error) {
      console.error("Error approving:", error);
      alert("Erro ao aprovar plano");
    }
  };

  const handleReprovar = async () => {
    const motivo = prompt("Motivo da reprovação:");
    if (!motivo) return;

    try {
      const response = await fetch(`/api/planos/${id}/aprovar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acao: "REPROVADO", motivo }),
      });

      if (response.ok) {
        alert("Plano reprovado!");
        fetchData();
      }
    } catch (error) {
      console.error("Error rejecting:", error);
    }
  };

  const calcularTotal = () => {
    return despesas.reduce((sum, item) => sum + Number(item.valorCalculado), 0);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleAbrirModalPdf = () => {
    // Preencher com valores da operação como padrão
    setPdfOpcoes({
      acoesRealizadas: plano?.operacao.finalidade || "",
      despesasOperacionais: plano?.operacao.motivacao || "",
    });
    setShowPdfModal(true);
  };

  const handleGerarPdf = async () => {
    if (!plano) return;

    setIsGeneratingPdf(true);
    try {
      // Buscar dados completos do plano com despesas
      const response = await fetch(`/api/planos/${id}?incluirDespesas=true`);
      if (!response.ok) {
        throw new Error("Erro ao carregar dados do plano");
      }
      const planoCompleto = await response.json();
      await gerarPdfPlanoTrabalho(planoCompleto, pdfOpcoes);
      setShowPdfModal(false);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Erro ao gerar PDF. Tente novamente.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!plano) {
    return <div>Plano não encontrado</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/dashboard/planos"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Planos
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{plano.titulo}</h1>
            <p className="text-gray-600 mt-1">
              Operação: {plano.operacao.nome} | Versão: {plano.versao}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleAbrirModalPdf}>
              <FileDown className="w-4 h-4 mr-2" />
              Exportar PDF
            </Button>
            {plano.status === "RASCUNHO" && (
              <Button variant="primary" onClick={handleEnviarAnalise}>
                <Check className="w-4 h-4 mr-2" />
                Enviar para Análise
              </Button>
            )}
            {plano.status === "EM_ANALISE" && canApproveCurrentLevel() && (
              <>
                <Button variant="success" onClick={handleAprovar}>
                  <Check className="w-4 h-4 mr-2" />
                  Aprovar
                </Button>
                <Button variant="danger" onClick={handleReprovar}>
                  <X className="w-4 h-4 mr-2" />
                  Reprovar
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Alerta de Bloqueio */}
      {plano.status === "EM_ANALISE" && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-amber-800">
                Plano em análise - Edições bloqueadas
              </h3>
              <div className="mt-2 text-sm text-amber-700">
                <p>
                  Este plano está em processo de aprovação.{" "}
                  {plano.nivelAprovacaoAtual && (
                    <>
                      <span className="font-semibold">
                        Aguardando aprovação do nível {plano.nivelAprovacaoAtual}/3:{" "}
                        {
                          {
                            1: "Comandante da OM",
                            2: "Comandante da Brigada",
                            3: "Comandante do CMA",
                          }[plano.nivelAprovacaoAtual]
                        }
                      </span>
                      {canApproveCurrentLevel() && (
                        <span className="block mt-1 text-green-700 font-semibold">
                          ✓ Você pode aprovar/reprovar este plano
                        </span>
                      )}
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600">Status</div>
          <div className="text-lg font-semibold text-gray-900">
            {plano.status.replace("_", " ")}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600">Responsável</div>
          <div className="text-lg font-semibold text-gray-900">
            {plano.responsavel.postoGraduacao} {plano.responsavel.nomeCompleto}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600">Valor Total</div>
          <div className="text-lg font-semibold text-blue-600">
            {formatCurrency(Number(plano.valorTotalDespesas))}
          </div>
        </div>
      </div>

      {/* Despesas - Condicional por Tipo */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {plano.tipo === "LOGISTICO" ? (
          <DespesasLogistico
            planoId={id}
            oms={oms}
            operacao={plano.operacao as any}
            canEdit={plano.status === "RASCUNHO"}
            onRefresh={fetchData}
            userOm={userOm}
            planoOm={plano.om ? { id: plano.om.id, nome: plano.om.nome, sigla: plano.om.sigla } : null}
          />
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Despesas</h2>
              <Button size="sm" onClick={() => setShowAddItem(!showAddItem)}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
            </div>

            {showAddItem && (
              <form
                onSubmit={handleAddItem}
                className="mb-6 p-4 bg-military-50 rounded-lg space-y-4 border border-military-200"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-military-900 mb-1">
                      Descrição *
                    </label>
                    <Input
                      value={newItem.descricao}
                      onChange={(e) =>
                        setNewItem({ ...newItem, descricao: e.target.value })
                      }
                      required
                      placeholder="Ex: Aquisição de gêneros alimentícios..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-military-900 mb-1">
                      Organização Militar *
                    </label>
                    <select
                      value={newItem.omId}
                      onChange={(e) =>
                        setNewItem({ ...newItem, omId: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-olive-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-military-500 focus:border-transparent bg-white"
                      required
                    >
                      <option value="">Selecione uma OM</option>
                      {oms.map((om) => (
                        <option key={om.id} value={om.id}>
                          {om.sigla} - {om.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-military-900 mb-1">
                      Natureza de Despesa *
                    </label>
                    <select
                      value={newItem.naturezaId}
                      onChange={(e) =>
                        setNewItem({ ...newItem, naturezaId: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-olive-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-military-500 focus:border-transparent bg-white"
                      required
                    >
                      <option value="">Selecione uma natureza</option>
                      {naturezas.map((natureza) => (
                        <option key={natureza.id} value={natureza.id}>
                          {natureza.codigo} - {natureza.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-military-900 mb-1">
                      Valor Unitário (R$) *
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={newItem.valorUnitario}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          valorUnitario: e.target.value,
                        })
                      }
                      required
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-military-900 mb-1">
                      Quantidade *
                    </label>
                    <Input
                      type="number"
                      step="0.001"
                      min="0.001"
                      value={newItem.quantidade}
                      onChange={(e) =>
                        setNewItem({ ...newItem, quantidade: e.target.value })
                      }
                      required
                      placeholder="1"
                    />
                  </div>
                </div>

                {newItem.valorUnitario && newItem.quantidade && (
                  <div className="bg-white p-3 rounded border border-military-200">
                    <span className="text-sm text-olive-700">
                      Valor Total:{" "}
                    </span>
                    <span className="text-lg font-bold text-military-700">
                      {formatCurrency(
                        parseFloat(newItem.valorUnitario) *
                          parseFloat(newItem.quantidade)
                      )}
                    </span>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button type="submit" size="sm">
                    Adicionar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => setShowAddItem(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            )}

            {/* Tabela de Itens */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left p-3 text-sm font-medium text-gray-700">
                      OM
                    </th>
                    <th className="text-left p-3 text-sm font-medium text-gray-700">
                      Natureza
                    </th>
                    <th className="text-left p-3 text-sm font-medium text-gray-700">
                      Descrição
                    </th>
                    <th className="text-right p-3 text-sm font-medium text-gray-700">
                      Valor Unit.
                    </th>
                    <th className="text-right p-3 text-sm font-medium text-gray-700">
                      Qtd
                    </th>
                    <th className="text-right p-3 text-sm font-medium text-gray-700">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {despesas.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center p-8 text-gray-500">
                        Nenhum item cadastrado
                      </td>
                    </tr>
                  ) : (
                    despesas.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="p-3 text-sm text-gray-600">
                          {item.descricao}
                        </td>
                        <td className="p-3 text-sm text-gray-900 text-right">
                          {formatCurrency(Number(item.valorCalculado))}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-300">
                    <td
                      colSpan={5}
                      className="p-3 text-right font-semibold text-gray-900"
                    >
                      Total:
                    </td>
                    <td className="p-3 text-right font-bold text-blue-600 text-lg">
                      {formatCurrency(calcularTotal())}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Status de Aprovação e Histórico */}
      {plano.status !== "RASCUNHO" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <StatusAprovacao
            nivelAtual={plano.nivelAprovacaoAtual}
            status={plano.status}
          />
          <HistoricoAprovacoes planoId={id} />
        </div>
      )}

      {/* Modal de Exportação PDF */}
      {showPdfModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Exportar Plano de Trabalho
                </h2>
                <button
                  onClick={() => setShowPdfModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-6">
                Preencha as informações que serão incluídas no cabeçalho do PDF:
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    4. AÇÕES REALIZADAS OU A REALIZAR:
                  </label>
                  <textarea
                    value={pdfOpcoes.acoesRealizadas || ""}
                    onChange={(e) =>
                      setPdfOpcoes({ ...pdfOpcoes, acoesRealizadas: e.target.value })
                    }
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Ações referentes à montagem, aperfeiçoamento e operação das Bases..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    5. DESPESAS OPERACIONAIS REALIZADAS OU A REALIZAR:
                  </label>
                  <textarea
                    value={pdfOpcoes.despesasOperacionais || ""}
                    onChange={(e) =>
                      setPdfOpcoes({ ...pdfOpcoes, despesasOperacionais: e.target.value })
                    }
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Aquisição de Material e contratação de serviços necessários..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <Button
                  variant="secondary"
                  onClick={() => setShowPdfModal(false)}
                  disabled={isGeneratingPdf}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  onClick={handleGerarPdf}
                  disabled={isGeneratingPdf}
                >
                  {isGeneratingPdf ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Gerando...
                    </>
                  ) : (
                    <>
                      <FileDown className="w-4 h-4 mr-2" />
                      Gerar PDF
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
