"use client";

import { useState, useEffect } from "react";
import { PreviewCalculo } from "../PreviewCalculo";
import { HandleParametrosChange } from "../ModalCriarDespesa";

interface ParametrosClasseVII {
  tipoOperacao: "AQUISICAO" | "MANUTENCAO";
  quantidade: number;
  valorUnitario: number;
  custoManutencao?: number;
}

interface FormularioClasseVIIProps {
  value: ParametrosClasseVII | null;
  onChange: (params: HandleParametrosChange) => void;
}

export function FormularioClasseVII({
  value,
  onChange,
}: FormularioClasseVIIProps) {
  const [params, setParams] = useState<ParametrosClasseVII>(
    value || {
      tipoOperacao: "AQUISICAO",
      quantidade: 0,
      valorUnitario: 0,
      custoManutencao: 0,
    }
  );

  const [valorTotal, setValorTotal] = useState<number | null>(null);
  const [detalhes, setDetalhes] = useState<any>(null);

  useEffect(() => {
    calcular();
  }, [params]);

  const calcular = () => {
    const { tipoOperacao, quantidade, valorUnitario, custoManutencao } = params;

    if (quantidade <= 0 || valorUnitario <= 0) {
      setValorTotal(null);
      setDetalhes(null);
      return;
    }

    let total = 0;
    const detalhesCalculo: any = {
      tipoOperacao,
      quantidade,
      valorUnitario,
    };

    if (tipoOperacao === "AQUISICAO") {
      total = quantidade * valorUnitario;
      detalhesCalculo.valorAquisicao = total;
    } else {
      if (!custoManutencao || custoManutencao <= 0) {
        setValorTotal(null);
        setDetalhes(null);
        return;
      }
      total = quantidade * custoManutencao;
      detalhesCalculo.custoManutencao = custoManutencao;
      detalhesCalculo.valorManutencao = total;
    }

    const totalFinal = Number(total.toFixed(2));

    setValorTotal(totalFinal);
    setDetalhes(detalhesCalculo);
    onChange({ params, valor: totalFinal, descricao: detalhesCalculo });
  };

  const handleChange = (field: keyof ParametrosClasseVII, value: any) => {
    setParams((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tipo de Operação <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleChange("tipoOperacao", "AQUISICAO")}
            className={`px-4 py-3 rounded-md border-2 text-sm font-medium transition-all ${
              params.tipoOperacao === "AQUISICAO"
                ? "border-green-600 bg-green-50 text-green-700"
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            Aquisição
          </button>
          <button
            type="button"
            onClick={() => handleChange("tipoOperacao", "MANUTENCAO")}
            className={`px-4 py-3 rounded-md border-2 text-sm font-medium transition-all ${
              params.tipoOperacao === "MANUTENCAO"
                ? "border-green-600 bg-green-50 text-green-700"
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            Manutenção
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quantidade de Equipamentos <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            step="1"
            value={params.quantidade || ""}
            onChange={(e) =>
              handleChange("quantidade", parseInt(e.target.value) || 0)
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
            placeholder="Número de equipamentos"
          />
          <p className="text-xs text-gray-500 mt-1">
            {params.tipoOperacao === "AQUISICAO"
              ? "Quantidade de equipamentos a serem adquiridos"
              : "Quantidade de equipamentos a receberem manutenção"}
          </p>
        </div>

        {params.tipoOperacao === "AQUISICAO" ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valor Unitário de Aquisição (R$){" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={params.valorUnitario || ""}
              onChange={(e) =>
                handleChange("valorUnitario", parseFloat(e.target.value) || 0)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
              placeholder="0.00"
            />
            <p className="text-xs text-gray-500 mt-1">
              Custo de aquisição por equipamento
            </p>
          </div>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valor de Referência Unitário (R$){" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={params.valorUnitario || ""}
                onChange={(e) =>
                  handleChange("valorUnitario", parseFloat(e.target.value) || 0)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
                placeholder="0.00"
              />
              <p className="text-xs text-gray-500 mt-1">
                Valor de referência do equipamento (para informação)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Custo de Manutenção por Equipamento (R$){" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={params.custoManutencao || ""}
                onChange={(e) =>
                  handleChange(
                    "custoManutencao",
                    parseFloat(e.target.value) || 0
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
                placeholder="0.00"
              />
              <p className="text-xs text-gray-500 mt-1">
                Custo de manutenção por equipamento
              </p>
            </div>
          </>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
        <p className="text-sm text-blue-800">
          <strong>Fórmula:</strong>{" "}
          {params.tipoOperacao === "AQUISICAO"
            ? "Quantidade × Valor Unitário de Aquisição"
            : "Quantidade × Custo de Manutenção"}
        </p>
        <p className="text-xs text-blue-700 mt-1">
          Exemplos: viaturas, armamentos, equipamentos de comunicação, etc.
        </p>
      </div>

      <PreviewCalculo valorTotal={valorTotal} carimbo={detalhes} />
    </div>
  );
}
