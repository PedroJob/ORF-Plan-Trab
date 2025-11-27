"use client";

import { useState, useEffect } from "react";
import { X, Plus, Loader2 } from "lucide-react";
import { RateioOMs } from "./RateioOMs";
import { RateioNaturezas } from "./RateioNaturezas";
import {
  FormularioClasseI,
  FormularioClasseII,
  FormularioClasseIII,
  FormularioClasseIV,
  FormularioClasseV,
  FormularioClasseVI,
  FormularioClasseVII,
  FormularioClasseVIII,
  FormularioClasseIX,
  FormularioClasseX,
} from "./formularios";
import { Tipo } from "@prisma/client";
import type {
  ClasseSelect,
  OMSelect,
  NaturezaSelect,
  OperacaoWithEfetivo,
  RateioOM,
  RateioNatureza,
  HandleParametrosChange,
  UserOM,
} from "@/types/despesas";

// Re-export for use by other components
export type { HandleParametrosChange };

interface DespesaToEdit {
  id: string;
  classeId: string;
  tipoId: string | null;
  descricao: string;
  parametros: unknown;
  valorCalculado: number;
  valorCombustivel: number | null;
  oms: Array<{
    omId: string;
    percentual: number;
  }>;
  despesasNaturezas: Array<{
    naturezaId: string;
    percentual: number;
  }>;
}

interface ModalCriarDespesaProps {
  isOpen: boolean;
  onClose: () => void;
  planoId: string;
  oms: OMSelect[];
  operacao: OperacaoWithEfetivo;
  onSuccess: () => void;
  despesaToEdit?: DespesaToEdit | null;
  userOm: UserOM | null;
  planoOm: UserOM | null;
}

export function ModalCriarDespesa({
  isOpen,
  onClose,
  planoId,
  oms,
  operacao,
  onSuccess,
  despesaToEdit = null,
  userOm,
  planoOm,
}: ModalCriarDespesaProps) {
  const [loading, setLoading] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingTipos, setLoadingTipos] = useState(false);
  const [loadingCriarTipo, setLoadingCriarTipo] = useState(false);
  const [loadingNaturezas, setLoadingNaturezas] = useState(false);

  const [classes, setClasses] = useState<ClasseSelect[]>([]);
  const [tipos, setTipos] = useState<Tipo[]>([]);
  const [naturezas, setNaturezas] = useState<NaturezaSelect[]>([]);

  const [classeId, setClasseId] = useState("");
  const [tipoSelecionado, setTipoSelecionado] = useState<Tipo | null>();
  const [descricao, setDescricao] = useState("");
  const [rateioOMs, setRateioOMs] = useState<RateioOM[]>([]);
  const [rateioNaturezas, setRateioNaturezas] = useState<RateioNatureza[]>([]);
  const [parametros, setParametros] = useState<unknown>(null);
  const [valorTotal, setValorTotal] = useState<number>(0);
  const [valorCombustivel, setValorCombustivel] = useState<number | undefined>(
    undefined
  );

  const [showCriarTipo, setShowCriarTipo] = useState(false);
  const [novoTipoNome, setNovoTipoNome] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  const classeSelecionada = classes.find((c) => c.id === classeId);

  useEffect(() => {
    if (isOpen) {
      carregarClasses();
      carregarNaturezas();

      if (despesaToEdit) {
        // Preencher com dados da despesa existente
        setClasseId(despesaToEdit.classeId);
        setDescricao(despesaToEdit.descricao);
        setParametros(despesaToEdit.parametros);
        setValorTotal(despesaToEdit.valorCalculado);
        setValorCombustivel(despesaToEdit.valorCombustivel || undefined);
        setRateioOMs(
          despesaToEdit.oms.map((om) => ({
            omId: om.omId,
            percentual: om.percentual,
          }))
        );
        setRateioNaturezas(
          despesaToEdit.despesasNaturezas.map((nat) => ({
            naturezaId: nat.naturezaId,
            percentual: nat.percentual,
          }))
        );
      } else {
        resetForm();
      }
    }
  }, [isOpen, despesaToEdit]);

  useEffect(() => {
    if (classeId) {
      carregarTipos(classeId);

      // Não resetar se estiver editando
      if (!despesaToEdit) {
        setTipoSelecionado(null);
        setParametros(null);
        setRateioNaturezas([]);
      }
    }
  }, [classeId]);

  // Selecionar o tipo quando estiver editando e os tipos forem carregados
  useEffect(() => {
    if (despesaToEdit && despesaToEdit.tipoId && tipos.length > 0) {
      const tipo = tipos.find((t) => t.id === despesaToEdit.tipoId);
      if (tipo) {
        setTipoSelecionado(tipo);
      }
    }
  }, [despesaToEdit, tipos]);

  // Auto-seleciona um tipo dummy quando não há tipos disponíveis
  useEffect(() => {
    if (classeId && !loadingTipos && tipos.length === 0) {
      // Cria um tipo dummy para permitir o uso do formulário
      setTipoSelecionado({
        id: "NO_TYPE",
        nome: "Sem tipo específico",
        classeId,
        isCombustivel: false,
        isCriavelUsuario: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }, [classeId, loadingTipos, tipos.length]);

  // Auto-set natureza to 100% if only one is permitted
  useEffect(() => {
    if (
      classeSelecionada &&
      naturezas.length > 0 &&
      rateioNaturezas.length === 0
    ) {
      const naturezasPermitidas = classeSelecionada.naturezasPermitidas;
      const naturezasFiltradas = naturezas.filter((nat) =>
        naturezasPermitidas.includes(nat.codigo)
      );

      if (naturezasFiltradas.length === 1) {
        setRateioNaturezas([
          {
            naturezaId: naturezasFiltradas[0].id,
            percentual: 100,
          },
        ]);
      }
    }
  }, [classeSelecionada, naturezas, rateioNaturezas.length]);

  const carregarClasses = async () => {
    try {
      setLoadingClasses(true);
      const response = await fetch("/api/classes");
      if (response.ok) {
        const data = await response.json();
        setClasses(data);
      }
    } catch (error) {
      console.error("Erro ao carregar classes:", error);
    } finally {
      setLoadingClasses(false);
    }
  };

  const carregarNaturezas = async () => {
    try {
      setLoadingNaturezas(true);
      const response = await fetch("/api/naturezas");
      if (response.ok) {
        const data = await response.json();
        setNaturezas(data);
      }
    } catch (error) {
      console.error("Erro ao carregar naturezas:", error);
    } finally {
      setLoadingNaturezas(false);
    }
  };

  const carregarTipos = async (classeId: string) => {
    try {
      setLoadingTipos(true);
      const response = await fetch(`/api/classes/${classeId}/tipos`);
      if (response.ok) {
        const data = await response.json();
        setTipos(data);
      }
    } catch (error) {
      console.error("Erro ao carregar tipos:", error);
    } finally {
      setLoadingTipos(false);
    }
  };

  const handleCriarTipo = async () => {
    if (!novoTipoNome.trim() || !classeId) return;

    try {
      setLoadingCriarTipo(true);
      const response = await fetch("/api/tipos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: novoTipoNome.trim(),
          classeId,
        }),
      });

      if (response.ok) {
        await carregarTipos(classeId);
        setNovoTipoNome("");
        setShowCriarTipo(false);
      } else {
        const error = await response.json();
        alert(error.error || "Erro ao criar tipo");
      }
    } catch (error) {
      console.error("Erro ao criar tipo:", error);
      alert("Erro ao criar tipo");
    } finally {
      setLoadingCriarTipo(false);
    }
  };

  const resetForm = () => {
    setClasseId("");
    setTipoSelecionado(null);
    setDescricao("");
    setRateioOMs([]);
    setRateioNaturezas([]);
    setParametros(null);
    setValorTotal(0);
    setValorCombustivel(undefined);
    setShowCriarTipo(false);
    setNovoTipoNome("");
    setErrors({});
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!classeId) newErrors.classeId = "Selecione uma classe";
    // Só exige tipo se houver tipos disponíveis
    if (!tipoSelecionado && tipos.length > 0)
      newErrors.tipoId = "Selecione um tipo";
    if (rateioOMs.length === 0)
      newErrors.rateioOMs = "Adicione ao menos uma OM";

    const somaPercentuais = rateioOMs.reduce(
      (sum, om) => sum + Number(om.percentual),
      0
    );
    if (Math.abs(somaPercentuais - 100) > 0.01) {
      newErrors.rateioOMs = `A soma dos percentuais de OMs deve ser 100%. Soma atual: ${somaPercentuais.toFixed(
        2
      )}%`;
    }

    if (rateioNaturezas.length === 0)
      newErrors.rateioNaturezas = "Adicione ao menos uma natureza";

    const somaPercentuaisNaturezas = rateioNaturezas.reduce(
      (sum, nat) => sum + Number(nat.percentual),
      0
    );
    if (Math.abs(somaPercentuaisNaturezas - 100) > 0.01) {
      newErrors.rateioNaturezas = `A soma dos percentuais de naturezas deve ser 100%. Soma atual: ${somaPercentuaisNaturezas.toFixed(
        2
      )}%`;
    }

    if (!parametros || valorTotal === 0) {
      newErrors.parametros = "Preencha os parâmetros da despesa";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setLoading(true);
      console.log({ valorTotal, valorCombustivel });

      const isEditing = !!despesaToEdit;
      const url = isEditing
        ? `/api/planos/${planoId}/despesas/${despesaToEdit.id}`
        : `/api/planos/${planoId}/despesas`;
      const method = isEditing ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classeId,
          tipoId:
            tipoSelecionado?.id === "NO_TYPE" ? null : tipoSelecionado?.id,
          descricao: descricao.trim(),
          parametros,
          oms: rateioOMs,
          naturezas: rateioNaturezas,
          valorTotal,
          valorCombustivel,
        }),
      });

      if (response.ok) {
        onSuccess();
        onClose();
        resetForm();
      } else {
        const error = await response.json();
        alert(
          error.error || `Erro ao ${isEditing ? "editar" : "criar"} despesa`
        );
      }
    } catch (error) {
      console.error(
        `Erro ao ${despesaToEdit ? "editar" : "criar"} despesa:`,
        error
      );
      alert(`Erro ao ${despesaToEdit ? "editar" : "criar"} despesa`);
    } finally {
      setLoading(false);
    }
  };

  const renderFormularioClasse = () => {
    if (!classeSelecionada) return null;
    // Permite renderização sem tipo quando não há tipos disponíveis
    if (!tipoSelecionado && tipos.length > 0) return null;

    const handleParametrosChange = (params: HandleParametrosChange) => {
      setParametros(params.params);
      setValorTotal(params.valor);
      setValorCombustivel(params.valorCombustivel);
      setDescricao(params.descricao || "");
    };

    // Props comuns para todos os formulários
    const commonProps = {
      onChange: handleParametrosChange,
      operacao,
      userOm,
      planoOm,
      naturezas,
      rateioNaturezas,
    };

    switch (classeSelecionada.nome) {
      case "CLASSE_I":
        if (!tipoSelecionado) return null;
        return (
          <FormularioClasseI
            value={parametros as any}
            tipo={tipoSelecionado}
            {...commonProps}
          />
        );
      case "CLASSE_II":
        return (
          <FormularioClasseII value={parametros as any} {...commonProps} />
        );
      case "CLASSE_III":
        if (!tipoSelecionado) return null;
        return (
          <FormularioClasseIII
            tipoSelecionado={tipoSelecionado}
            value={parametros as any}
            {...commonProps}
          />
        );
      case "CLASSE_IV":
        return (
          <FormularioClasseIV value={parametros as any} {...commonProps} />
        );
      case "CLASSE_V":
        return <FormularioClasseV value={parametros as any} {...commonProps} />;
      case "CLASSE_VI":
        return (
          <FormularioClasseVI value={parametros as any} {...commonProps} />
        );
      case "CLASSE_VII":
        return (
          <FormularioClasseVII value={parametros as any} {...commonProps} />
        );
      case "CLASSE_VIII":
        return (
          <FormularioClasseVIII value={parametros as any} {...commonProps} />
        );
      case "CLASSE_IX":
        return (
          <FormularioClasseIX value={parametros as any} {...commonProps} />
        );
      case "CLASSE_X":
        return <FormularioClasseX value={parametros as any} {...commonProps} />;
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 overflow-y-auto py-8">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            {despesaToEdit
              ? "Editar Despesa Logística"
              : "Nova Despesa Logística"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form
          onSubmit={handleSubmit}
          className="px-6 py-4 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto"
        >
          {/* Classe */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Classe de Despesa <span className="text-red-500">*</span>
            </label>
            {loadingClasses ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
              </div>
            ) : (
              <select
                value={classeId}
                onChange={(e) => setClasseId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
              >
                <option value="">Selecione uma classe</option>
                {classes.map((classe) => (
                  <option key={classe.id} value={classe.id}>
                    {classe.nome} - {classe.descricao}
                  </option>
                ))}
              </select>
            )}
            {errors.classeId && (
              <p className="text-sm text-red-600 mt-1">{errors.classeId}</p>
            )}
          </div>

          {/* Tipo - só mostra se houver tipos disponíveis */}
          {classeId && loadingTipos && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
              </div>
            </div>
          )}

          {classeId && !loadingTipos && tipos.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo <span className="text-red-500">*</span>
              </label>
              <select
                value={tipoSelecionado?.id || ""}
                onChange={(e) =>
                  setTipoSelecionado(
                    e.target.value
                      ? tipos.find((t) => t.id === e.target.value) || null
                      : null
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
              >
                <option value="">Selecione um tipo</option>
                {tipos.map((tipo) => (
                  <option key={tipo.id} value={tipo.id} defaultValue={0}>
                    {tipo.nome}
                  </option>
                ))}
              </select>

              {showCriarTipo && (
                <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-md space-y-2">
                  <input
                    type="text"
                    value={novoTipoNome}
                    onChange={(e) => setNovoTipoNome(e.target.value)}
                    placeholder="Nome do novo tipo"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleCriarTipo}
                      disabled={!novoTipoNome.trim() || loadingCriarTipo}
                      className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      {loadingCriarTipo && (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      )}
                      Criar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCriarTipo(false);
                        setNovoTipoNome("");
                      }}
                      className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
              {errors.tipoId && (
                <p className="text-sm text-red-600 mt-1">{errors.tipoId}</p>
              )}
            </div>
          )}

          {classeSelecionada && (tipoSelecionado || tipos.length === 0) && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Parâmetros de Cálculo - {classeSelecionada.nome}
              </h3>
              {renderFormularioClasse()}
              {errors.parametros && (
                <p className="text-sm text-red-600 mt-2">{errors.parametros}</p>
              )}
            </div>
          )}

          {/* Rateio Naturezas */}
          {classeSelecionada && (tipoSelecionado || tipos.length === 0) && (
            <div className="border-t pt-4">
              <RateioNaturezas
                naturezas={naturezas}
                naturezasPermitidas={classeSelecionada.naturezasPermitidas}
                value={rateioNaturezas}
                onChange={setRateioNaturezas}
                error={errors.rateioNaturezas}
              />
            </div>
          )}

          {/* Rateio OMs */}
          {classeSelecionada && (tipoSelecionado || tipos.length === 0) && (
            <div className="border-t pt-4">
              <RateioOMs
                oms={oms}
                value={rateioOMs}
                onChange={setRateioOMs}
                error={errors.rateioOMs}
              />
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {despesaToEdit ? "Salvar Alterações" : "Criar Despesa"}
          </button>
        </div>
      </div>
    </div>
  );
}
