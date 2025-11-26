"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Loader2, AlertCircle, Edit } from "lucide-react";
import { ModalCriarDespesa } from "./ModalCriarDespesa";
import type { OMSelect, OperacaoWithEfetivo, UserOM } from "@/types/despesas";

/**
 * Serialized API response type for Despesa with relations
 * Note: Prisma Decimal types are serialized to numbers, Dates to strings
 */
interface Despesa {
  id: string;
  descricao: string;
  parametros: unknown;
  valorCalculado: number;
  valorCombustivel: number | null;
  classe: {
    id: string;
    nome: string;
    descricao: string;
  };
  tipo: {
    id: string;
    nome: string;
    isCombustivel: boolean;
  } | null;
  oms: {
    id: string;
    omId: string;
    percentual: number;
    om: {
      id: string;
      nome: string;
      sigla: string;
      codUG: string;
    };
  }[];
  despesasNaturezas: {
    id: string;
    naturezaId: string;
    percentual: number;
    natureza: {
      id: string;
      codigo: string;
      nome: string;
      descricao?: string;
    };
  }[];
  createdAt: string;
}

interface DespesasLogisticoProps {
  planoId: string;
  oms: OMSelect[];
  operacao: OperacaoWithEfetivo;
  canEdit: boolean;
  onRefresh?: () => void | Promise<void>;
  userOm: UserOM | null;
}

export function DespesasLogistico({
  planoId,
  oms,
  operacao,
  canEdit,
  onRefresh,
  userOm,
}: DespesasLogisticoProps) {
  const [loading, setLoading] = useState(true);
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [despesaToEdit, setDespesaToEdit] = useState<any | null>(null);

  useEffect(() => {
    carregarDespesas();
  }, [planoId]);

  const carregarDespesas = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/planos/${planoId}/despesas`);
      if (response.ok) {
        const data = await response.json();
        setDespesas(data);
      }
    } catch (error) {
      console.error("Erro ao carregar despesas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDespesaSuccess = async () => {
    await carregarDespesas();
    // Refresh parent data to sync total values
    if (onRefresh) {
      await onRefresh();
    }
  };

  const handleEdit = (despesa: Despesa) => {
    setDespesaToEdit({
      id: despesa.id,
      classeId: despesa.classe.id,
      tipoId: despesa.tipo?.id || null,
      descricao: despesa.descricao,
      parametros: (despesa as any).parametros,
      valorCalculado: Number(despesa.valorCalculado),
      valorCombustivel: despesa.valorCombustivel
        ? Number(despesa.valorCombustivel)
        : null,
      oms: despesa.oms.map((om) => ({
        omId: om.omId,
        percentual: Number(om.percentual),
      })),
      despesasNaturezas: despesa.despesasNaturezas.map((nat) => ({
        naturezaId: nat.naturezaId,
        percentual: Number(nat.percentual),
      })),
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setDespesaToEdit(null);
  };

  const handleDelete = async (despesaId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta despesa?")) return;

    try {
      setDeletingId(despesaId);
      const response = await fetch(
        `/api/planos/${planoId}/despesas/${despesaId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        await carregarDespesas();
        // Refresh parent data to sync total values
        if (onRefresh) {
          await onRefresh();
        }
      } else {
        const error = await response.json();
        alert(error.error || "Erro ao excluir despesa");
      }
    } catch (error) {
      console.error("Erro ao excluir despesa:", error);
      alert("Erro ao excluir despesa");
    } finally {
      setDeletingId(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const calcularTotais = () => {
    const totalGeral = despesas.reduce(
      (sum, d) => sum + Number(d.valorCalculado),
      0
    );

    // Separar combustível por tipo (Diesel e Gasolina)
    let totalDiesel = 0;
    let totalGasolina = 0;

    despesas
      .filter((d) => d.valorCombustivel !== null)
      .forEach((d) => {
        const params = d.parametros as { tipoCombustivel?: string } | null;
        const tipoCombustivel = params?.tipoCombustivel;
        const litros = Number(d.valorCombustivel!);

        if (tipoCombustivel === "OD") {
          totalDiesel += litros;
        } else if (tipoCombustivel === "GAS") {
          totalGasolina += litros;
        }
      });

    return { totalGeral, totalDiesel, totalGasolina };
  };

  const { totalGeral, totalDiesel, totalGasolina } = calcularTotais();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
        <span className="ml-2 text-gray-600">Carregando despesas...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Despesas Logísticas
          </h3>
          <p className="text-sm text-gray-600">
            {despesas.length === 0
              ? "Nenhuma despesa cadastrada"
              : `${despesas.length} ${
                  despesas.length === 1
                    ? "despesa cadastrada"
                    : "despesas cadastradas"
                }`}
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova Despesa
          </button>
        )}
      </div>

      {/* Lista de Despesas */}
      {despesas.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-1">Nenhuma despesa cadastrada</p>
          <p className="text-sm text-gray-500">
            {canEdit
              ? 'Clique em "Nova Despesa" para adicionar a primeira despesa logística'
              : "Este plano ainda não possui despesas cadastradas"}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {despesas.map((despesa) => (
              <div
                key={despesa.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-green-100 text-green-800">
                        {despesa.classe.nome}
                      </span>
                      {despesa.tipo && (
                        <span className="text-sm text-gray-600">
                          {despesa.tipo.nome}
                          {despesa.tipo.isCombustivel && " (Combustível)"}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">
                          Valor Total
                        </p>
                        <p className="text-lg font-bold text-green-700">
                          {formatCurrency(Number(despesa.valorCalculado))}
                        </p>
                      </div>

                      {despesa.valorCombustivel !== null && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">
                            Combustível
                          </p>
                          <p className="text-sm font-semibold text-gray-900">
                            {Number(despesa.valorCombustivel).toLocaleString(
                              "pt-BR",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }
                            )}{" "}
                            L
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-1">
                        Naturezas de Despesa
                      </p>
                      <div className="space-y-1">
                        {despesa.despesasNaturezas.map((rateio) => (
                          <div
                            key={rateio.id}
                            className="flex items-center justify-between text-xs"
                          >
                            <span className="text-gray-700 font-mono">
                              {rateio.natureza.codigo} - {rateio.natureza.nome}
                            </span>
                            <span className="font-medium text-gray-900">
                              R${" "}
                              {Number(
                                rateio.percentual * despesa.valorCalculado
                              )}{" "}
                              ({Number(rateio.percentual).toFixed(2)}%)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-1">
                        Rateio por OMs
                      </p>
                      <div className="space-y-1">
                        {despesa.oms.map((rateio) => (
                          <div
                            key={rateio.id}
                            className="flex items-center justify-between text-xs"
                          >
                            <span className="text-gray-700">
                              {rateio.om.sigla} - {rateio.om.nome}
                            </span>
                            <span className="font-medium text-gray-900">
                              R${" "}
                              {Number(
                                rateio.percentual * despesa.valorCalculado
                              )}{" "}
                              ({Number(rateio.percentual).toFixed(2)}%)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 ">Descrição</p>
                    <h4 className="font-medium text-gray-900 my-2">
                      {despesa.descricao}
                    </h4>
                  </div>

                  {canEdit && (
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleEdit(despesa)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="Editar despesa"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(despesa.id)}
                        disabled={deletingId === despesa.id}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Excluir despesa"
                      >
                        {deletingId === despesa.id ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Trash2 className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Totais */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-green-800 mb-3">
              Resumo Financeiro
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-green-700 mb-1">Total Geral</p>
                <p className="text-2xl font-bold text-green-800">
                  {formatCurrency(totalGeral)}
                </p>
              </div>

              {(totalDiesel > 0 || totalGasolina > 0) && (
                <div className="space-y-2">
                  <p className="text-xs text-green-700 mb-1">
                    Total de Combustível
                  </p>
                  {totalDiesel > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-green-600">Diesel:</span>
                      <span className="text-sm font-semibold text-green-800">
                        {totalDiesel.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        L
                      </span>
                    </div>
                  )}
                  {totalGasolina > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-green-600">Gasolina:</span>
                      <span className="text-sm font-semibold text-green-800">
                        {totalGasolina.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        L
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Modal */}
      {canEdit && (
        <ModalCriarDespesa
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          planoId={planoId}
          oms={oms}
          operacao={operacao}
          onSuccess={handleDespesaSuccess}
          despesaToEdit={despesaToEdit}
          userOm={userOm}
        />
      )}
    </div>
  );
}
