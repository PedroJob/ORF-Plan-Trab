"use client";

import { useState, useEffect } from "react";
import { PreviewCalculo } from "../PreviewCalculo";
import { Plus, X, AlertCircle } from "lucide-react";
import {
  ParametrosClasseVI,
  ItemEquipamentoEngenharia,
  calcularClasseVI,
  VALORES_REFERENCIA_ENGENHARIA,
  CATEGORIAS_EQUIPAMENTOS,
} from "@/lib/calculos/classeVI";
import { HandleParametrosChange } from "../ModalCriarDespesa";

interface FormularioClasseVIProps {
  value: ParametrosClasseVI | null;
  onChange: (params: HandleParametrosChange) => void;
}

const FATOR_SEGURANCA = 1.1;

export function FormularioClasseVI({
  value,
  onChange,
}: FormularioClasseVIProps) {
  const [params, setParams] = useState<ParametrosClasseVI>(
    value || {
      equipamentos: [],
    }
  );

  const [valorTotal, setValorTotal] = useState<number | null>(null);
  const [detalhes, setDetalhes] = useState<string | null>(null);

  // Estado para novo equipamento
  const [novoEquipamento, setNovoEquipamento] =
    useState<ItemEquipamentoEngenharia>({
      tipo: "",
      valorHora: 0,
      numeroHoras: 0,
    });

  const [categoriaSelecionada, setCategoriaSelecionada] =
    useState<string>("TERRAPLANAGEM");

  useEffect(() => {
    calcular();
  }, [params]);

  const calcular = () => {
    const { equipamentos } = params;

    if (!equipamentos || equipamentos.length === 0) {
      setValorTotal(null);
      setDetalhes(null);
      return;
    }

    try {
      const resultado = calcularClasseVI(params);
      setValorTotal(resultado.valorTotal);
      setDetalhes(resultado.detalhamento);
      onChange({
        params,
        valor: resultado.valorTotal,
        descricao: resultado.detalhamento,
      });
    } catch (error) {
      console.error("Erro no cálculo:", error);
      setValorTotal(null);
      setDetalhes(null);
    }
  };

  const adicionarEquipamento = () => {
    if (
      !novoEquipamento.tipo ||
      novoEquipamento.valorHora <= 0 ||
      novoEquipamento.numeroHoras <= 0
    ) {
      return;
    }

    const novosEquipamentos = [...params.equipamentos, novoEquipamento];
    setParams({ equipamentos: novosEquipamentos });
    setNovoEquipamento({ tipo: "", valorHora: 0, numeroHoras: 0 });
  };

  const removerEquipamento = (index: number) => {
    const novosEquipamentos = params.equipamentos.filter((_, i) => i !== index);
    setParams({ equipamentos: novosEquipamentos });
  };

  const preencherEquipamentoPadrao = (tipoEquipamento: string) => {
    const valorPadrao =
      VALORES_REFERENCIA_ENGENHARIA[
        tipoEquipamento as keyof typeof VALORES_REFERENCIA_ENGENHARIA
      ] || 0;
    setNovoEquipamento((prev) => ({
      ...prev,
      tipo: tipoEquipamento.replace(/_/g, " "),
      valorHora: valorPadrao,
    }));
  };

  const obterEquipamentosCategoria = (categoria: string): string[] => {
    return (
      CATEGORIAS_EQUIPAMENTOS[
        categoria as keyof typeof CATEGORIAS_EQUIPAMENTOS
      ] || []
    );
  };

  return (
    <div className="space-y-4">
      {/* Informação sobre fator de segurança */}
      <div className="bg-amber-50 border border-amber-300 rounded-md p-3 flex items-start gap-2">
        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-amber-800">
          <p className="font-semibold">Fator de Segurança Obrigatório</p>
          <p className="mt-1">
            Todo cálculo aplica automaticamente o fator de segurança de{" "}
            {FATOR_SEGURANCA} (10% adicional).
          </p>
        </div>
      </div>

      {/* Lista de equipamentos adicionados */}
      {params.equipamentos && params.equipamentos.length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Equipamentos Adicionados
          </label>
          {params.equipamentos.map((equipamento, index) => {
            const custoBase = equipamento.valorHora * equipamento.numeroHoras;
            const custoComFator = custoBase * FATOR_SEGURANCA;
            return (
              <div
                key={index}
                className="flex items-center justify-between bg-gray-50 p-3 rounded border"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {equipamento.tipo}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    R$ {equipamento.valorHora.toFixed(2)}/h ×{" "}
                    {equipamento.numeroHoras}h × {FATOR_SEGURANCA} = R${" "}
                    {custoComFator.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removerEquipamento(index)}
                  className="ml-2 p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Formulário para adicionar equipamento */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 space-y-4">
        <p className="text-sm font-medium text-blue-900">
          Adicionar Equipamento de Engenharia
        </p>

        {/* Seletor de categoria */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Categoria
          </label>
          <div className="flex flex-wrap gap-2">
            {Object.keys(CATEGORIAS_EQUIPAMENTOS).map((categoria) => (
              <button
                key={categoria}
                type="button"
                onClick={() => setCategoriaSelecionada(categoria)}
                className={`px-3 py-1 text-xs rounded-md transition-all ${
                  categoriaSelecionada === categoria
                    ? "bg-blue-600 text-white"
                    : "bg-white border border-blue-300 text-blue-700 hover:bg-blue-100"
                }`}
              >
                {categoria.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Botões de equipamentos padrão */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Equipamentos Padrão
          </label>
          <div className="flex flex-wrap gap-2">
            {obterEquipamentosCategoria(categoriaSelecionada).map(
              (equipamento) => (
                <button
                  key={equipamento}
                  type="button"
                  onClick={() => preencherEquipamentoPadrao(equipamento)}
                  className="px-2 py-1 text-xs bg-white border border-blue-300 rounded hover:bg-blue-100 transition-colors"
                >
                  {equipamento.replace(/_/g, " ")}
                </button>
              )
            )}
          </div>
        </div>

        {/* Campos de entrada */}
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Tipo do Equipamento
            </label>
            <input
              type="text"
              value={novoEquipamento.tipo}
              onChange={(e) =>
                setNovoEquipamento((prev) => ({
                  ...prev,
                  tipo: e.target.value,
                }))
              }
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
              placeholder="Ex: Retroescavadeira"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Valor por Hora (R$/h)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={novoEquipamento.valorHora || ""}
                onChange={(e) =>
                  setNovoEquipamento((prev) => ({
                    ...prev,
                    valorHora: parseFloat(e.target.value) || 0,
                  }))
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Número de Horas
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={novoEquipamento.numeroHoras || ""}
                onChange={(e) =>
                  setNovoEquipamento((prev) => ({
                    ...prev,
                    numeroHoras: parseFloat(e.target.value) || 0,
                  }))
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
                placeholder="0.0"
              />
            </div>
          </div>

          {/* Preview do item a ser adicionado */}
          {novoEquipamento.valorHora > 0 && novoEquipamento.numeroHoras > 0 && (
            <div className="bg-white rounded px-3 py-2 border border-blue-300">
              <p className="text-xs text-gray-600">
                Custo estimado:{" "}
                <span className="font-semibold text-gray-900">
                  R${" "}
                  {(
                    novoEquipamento.valorHora *
                    novoEquipamento.numeroHoras *
                    FATOR_SEGURANCA
                  ).toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span className="text-gray-500 ml-1">
                  (R$ {novoEquipamento.valorHora.toFixed(2)}/h ×{" "}
                  {novoEquipamento.numeroHoras}h × {FATOR_SEGURANCA})
                </span>
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={adicionarEquipamento}
            disabled={
              !novoEquipamento.tipo ||
              novoEquipamento.valorHora <= 0 ||
              novoEquipamento.numeroHoras <= 0
            }
            className="w-full px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Adicionar Equipamento
          </button>
        </div>
      </div>

      {/* Preview do cálculo total */}
      <PreviewCalculo valorTotal={valorTotal} carimbo={detalhes} />
    </div>
  );
}
