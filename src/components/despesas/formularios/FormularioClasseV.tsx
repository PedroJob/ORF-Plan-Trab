"use client";

import { useState, useEffect } from "react";
import { PreviewCalculo } from "../PreviewCalculo";
import { Plus, X } from "lucide-react";
import {
  ParametrosClasseV,
  ItemMunicao,
  ItemArmamento,
  calcularClasseV,
  VALORES_REFERENCIA_MUNICOES,
  VALORES_REFERENCIA_MEM,
} from "@/lib/calculos/classeV";
import { HandleParametrosChange } from "../ModalCriarDespesa";

interface FormularioClasseVProps {
  value: ParametrosClasseV | null;
  onChange: (params: HandleParametrosChange) => void;
}

export function FormularioClasseV({ value, onChange }: FormularioClasseVProps) {
  const [params, setParams] = useState<ParametrosClasseV>(
    value || {
      tipoCalculo: "MUNICOES",
      municoes: [],
      armamentos: [],
    }
  );

  const [valorTotal, setValorTotal] = useState<number | null>(null);
  const [detalhes, setDetalhes] = useState<string | null>(null);

  // Estado para novo item de munição
  const [novaMunicao, setNovaMunicao] = useState<ItemMunicao>({
    tipo: "",
    quantidade: 0,
    valorUnitario: 0,
  });

  // Estado para novo item de armamento
  const [novoArmamento, setNovoArmamento] = useState<ItemArmamento>({
    tipo: "",
    quantidade: 0,
    valorMEM: 0,
  });

  useEffect(() => {
    calcular();
  }, [params]);

  const calcular = () => {
    const { tipoCalculo, municoes, armamentos } = params;

    // Validar se há itens
    const temMunicoes = municoes && municoes.length > 0;
    const temArmamentos = armamentos && armamentos.length > 0;

    if (tipoCalculo === "MUNICOES" && !temMunicoes) {
      setValorTotal(null);
      setDetalhes(null);
      return;
    }

    if (tipoCalculo === "ARMAMENTO" && !temArmamentos) {
      setValorTotal(null);
      setDetalhes(null);
      return;
    }

    if (tipoCalculo === "AMBOS" && !temMunicoes && !temArmamentos) {
      setValorTotal(null);
      setDetalhes(null);
      return;
    }

    try {
      const resultado = calcularClasseV(params);
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

  const handleTipoCalculoChange = (
    tipo: "MUNICOES" | "ARMAMENTO" | "AMBOS"
  ) => {
    setParams((prev) => ({ ...prev, tipoCalculo: tipo }));
  };

  // Funções para Munições
  const adicionarMunicao = () => {
    if (
      !novaMunicao.tipo ||
      novaMunicao.quantidade <= 0 ||
      novaMunicao.valorUnitario <= 0
    ) {
      return;
    }

    const novasMunicoes = [...(params.municoes || []), novaMunicao];
    setParams((prev) => ({ ...prev, municoes: novasMunicoes }));
    setNovaMunicao({ tipo: "", quantidade: 0, valorUnitario: 0 });
  };

  const removerMunicao = (index: number) => {
    const novasMunicoes = params.municoes?.filter((_, i) => i !== index) || [];
    setParams((prev) => ({ ...prev, municoes: novasMunicoes }));
  };

  const preencherMunicaoPadrao = (tipoMunicao: string) => {
    const valorPadrao =
      VALORES_REFERENCIA_MUNICOES[
        tipoMunicao as keyof typeof VALORES_REFERENCIA_MUNICOES
      ] || 0;
    setNovaMunicao((prev) => ({
      ...prev,
      tipo: tipoMunicao.replace(/_/g, " "),
      valorUnitario: valorPadrao,
    }));
  };

  // Funções para Armamentos
  const adicionarArmamento = () => {
    if (
      !novoArmamento.tipo ||
      novoArmamento.quantidade <= 0 ||
      novoArmamento.valorMEM <= 0
    ) {
      return;
    }

    const novosArmamentos = [...(params.armamentos || []), novoArmamento];
    setParams((prev) => ({ ...prev, armamentos: novosArmamentos }));
    setNovoArmamento({ tipo: "", quantidade: 0, valorMEM: 0 });
  };

  const removerArmamento = (index: number) => {
    const novosArmamentos =
      params.armamentos?.filter((_, i) => i !== index) || [];
    setParams((prev) => ({ ...prev, armamentos: novosArmamentos }));
  };

  const preencherArmamentoPadrao = (tipoArmamento: string) => {
    const valorPadrao =
      VALORES_REFERENCIA_MEM[
        tipoArmamento as keyof typeof VALORES_REFERENCIA_MEM
      ] || 0;
    setNovoArmamento((prev) => ({
      ...prev,
      tipo: tipoArmamento.replace(/_/g, " "),
      valorMEM: valorPadrao,
    }));
  };

  return (
    <div className="space-y-4">
      {/* Seletor de tipo de cálculo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tipo de Cálculo <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => handleTipoCalculoChange("MUNICOES")}
            className={`px-4 py-3 rounded-md border-2 text-sm font-medium transition-all ${
              params.tipoCalculo === "MUNICOES"
                ? "border-green-600 bg-green-50 text-green-700"
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            Munições
          </button>
          <button
            type="button"
            onClick={() => handleTipoCalculoChange("ARMAMENTO")}
            className={`px-4 py-3 rounded-md border-2 text-sm font-medium transition-all ${
              params.tipoCalculo === "ARMAMENTO"
                ? "border-green-600 bg-green-50 text-green-700"
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            Armamento
          </button>
          <button
            type="button"
            onClick={() => handleTipoCalculoChange("AMBOS")}
            className={`px-4 py-3 rounded-md border-2 text-sm font-medium transition-all ${
              params.tipoCalculo === "AMBOS"
                ? "border-green-600 bg-green-50 text-green-700"
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            Ambos
          </button>
        </div>
      </div>

      {/* Seção de Munições */}
      {(params.tipoCalculo === "MUNICOES" ||
        params.tipoCalculo === "AMBOS") && (
        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Munições</h3>

          {/* Lista de munições adicionadas */}
          {params.municoes && params.municoes.length > 0 && (
            <div className="space-y-2 mb-3">
              {params.municoes.map((municao, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-gray-50 p-2 rounded border"
                >
                  <div className="flex-1 text-sm">
                    <span className="font-medium">{municao.tipo}</span>
                    <span className="text-gray-600 ml-2">
                      {municao.quantidade} un × R${" "}
                      {municao.valorUnitario.toFixed(2)} = R${" "}
                      {(
                        municao.quantidade * municao.valorUnitario
                      ).toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removerMunicao(index)}
                    className="ml-2 p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Formulário para adicionar munição */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 space-y-3">
            <p className="text-sm font-medium text-blue-900">
              Adicionar Munição
            </p>

            {/* Botões de munição padrão */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => preencherMunicaoPadrao("7.62MM")}
                className="px-2 py-1 text-xs bg-white border border-blue-300 rounded hover:bg-blue-100 transition-colors"
              >
                7.62mm
              </button>
              <button
                type="button"
                onClick={() => preencherMunicaoPadrao("5.56MM")}
                className="px-2 py-1 text-xs bg-white border border-blue-300 rounded hover:bg-blue-100 transition-colors"
              >
                5.56mm
              </button>
              <button
                type="button"
                onClick={() => preencherMunicaoPadrao("9MM")}
                className="px-2 py-1 text-xs bg-white border border-blue-300 rounded hover:bg-blue-100 transition-colors"
              >
                9mm
              </button>
              <button
                type="button"
                onClick={() => preencherMunicaoPadrao("CAL_12")}
                className="px-2 py-1 text-xs bg-white border border-blue-300 rounded hover:bg-blue-100 transition-colors"
              >
                Cal 12
              </button>
              <button
                type="button"
                onClick={() => preencherMunicaoPadrao("GRANADA_40MM")}
                className="px-2 py-1 text-xs bg-white border border-blue-300 rounded hover:bg-blue-100 transition-colors"
              >
                Granada 40mm
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <input
                type="text"
                value={novaMunicao.tipo}
                onChange={(e) =>
                  setNovaMunicao((prev) => ({ ...prev, tipo: e.target.value }))
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
                placeholder="Tipo da munição (ex: 7,62mm)"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={novaMunicao.quantidade || ""}
                  onChange={(e) =>
                    setNovaMunicao((prev) => ({
                      ...prev,
                      quantidade: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
                  placeholder="Quantidade"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={novaMunicao.valorUnitario || ""}
                  onChange={(e) =>
                    setNovaMunicao((prev) => ({
                      ...prev,
                      valorUnitario: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
                  placeholder="Valor unitário (R$)"
                />
              </div>
              <button
                type="button"
                onClick={adicionarMunicao}
                disabled={
                  !novaMunicao.tipo ||
                  novaMunicao.quantidade <= 0 ||
                  novaMunicao.valorUnitario <= 0
                }
                className="w-full px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Adicionar Munição
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Seção de Armamento */}
      {(params.tipoCalculo === "ARMAMENTO" ||
        params.tipoCalculo === "AMBOS") && (
        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Armamento (Manutenção - 8% MEM anual)
          </h3>

          {/* Lista de armamentos adicionados */}
          {params.armamentos && params.armamentos.length > 0 && (
            <div className="space-y-2 mb-3">
              {params.armamentos.map((armamento, index) => {
                const valorTotalMEM = armamento.quantidade * armamento.valorMEM;
                const custoManutencao = valorTotalMEM * 0.08;
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 p-2 rounded border"
                  >
                    <div className="flex-1 text-sm">
                      <span className="font-medium">{armamento.tipo}</span>
                      <span className="text-gray-600 ml-2">
                        {armamento.quantidade} un × R${" "}
                        {armamento.valorMEM.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        × 8% = R${" "}
                        {custoManutencao.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removerArmamento(index)}
                      className="ml-2 p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Formulário para adicionar armamento */}
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 space-y-3">
            <p className="text-sm font-medium text-amber-900">
              Adicionar Armamento
            </p>

            {/* Botões de armamento padrão */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => preencherArmamentoPadrao("FUZIL_IMBEL_762")}
                className="px-2 py-1 text-xs bg-white border border-amber-300 rounded hover:bg-amber-100 transition-colors"
              >
                Fuzil 7.62
              </button>
              <button
                type="button"
                onClick={() => preencherArmamentoPadrao("CARABINA_556")}
                className="px-2 py-1 text-xs bg-white border border-amber-300 rounded hover:bg-amber-100 transition-colors"
              >
                Carabina 5.56
              </button>
              <button
                type="button"
                onClick={() => preencherArmamentoPadrao("PISTOLA_TAURUS_9MM")}
                className="px-2 py-1 text-xs bg-white border border-amber-300 rounded hover:bg-amber-100 transition-colors"
              >
                Pistola 9mm
              </button>
              <button
                type="button"
                onClick={() => preencherArmamentoPadrao("ESPINGARDA_CAL12")}
                className="px-2 py-1 text-xs bg-white border border-amber-300 rounded hover:bg-amber-100 transition-colors"
              >
                Espingarda Cal 12
              </button>
              <button
                type="button"
                onClick={() => preencherArmamentoPadrao("METRALHADORA_762")}
                className="px-2 py-1 text-xs bg-white border border-amber-300 rounded hover:bg-amber-100 transition-colors"
              >
                Metralhadora
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <input
                type="text"
                value={novoArmamento.tipo}
                onChange={(e) =>
                  setNovoArmamento((prev) => ({
                    ...prev,
                    tipo: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
                placeholder="Tipo do armamento (ex: Fuzil IMBEL 7.62)"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={novoArmamento.quantidade || ""}
                  onChange={(e) =>
                    setNovoArmamento((prev) => ({
                      ...prev,
                      quantidade: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
                  placeholder="Quantidade"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={novoArmamento.valorMEM || ""}
                  onChange={(e) =>
                    setNovoArmamento((prev) => ({
                      ...prev,
                      valorMEM: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
                  placeholder="Valor MEM (R$)"
                />
              </div>
              <button
                type="button"
                onClick={adicionarArmamento}
                disabled={
                  !novoArmamento.tipo ||
                  novoArmamento.quantidade <= 0 ||
                  novoArmamento.valorMEM <= 0
                }
                className="w-full px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Adicionar Armamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview do cálculo */}
      <PreviewCalculo valorTotal={valorTotal} carimbo={detalhes} />
    </div>
  );
}
