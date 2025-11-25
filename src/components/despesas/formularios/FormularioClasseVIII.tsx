"use client";

import { useState, useEffect } from "react";
import { PreviewCalculo } from "../PreviewCalculo";
import { HandleParametrosChange } from "../ModalCriarDespesa";

interface ParametrosClasseVIII {
  quantidadeMaterial: number;
  valorUnitarioMaterial: number;
  incluiServicos: boolean;
  custoServicos?: number;
}

interface FormularioClasseVIIIProps {
  value: ParametrosClasseVIII | null;
  onChange: (params: HandleParametrosChange) => void;
}

export function FormularioClasseVIII({
  value,
  onChange,
}: FormularioClasseVIIIProps) {
  const [params, setParams] = useState<ParametrosClasseVIII>(
    value || {
      quantidadeMaterial: 0,
      valorUnitarioMaterial: 0,
      incluiServicos: false,
      custoServicos: 0,
    }
  );

  const [valorTotal, setValorTotal] = useState<number | null>(null);
  const [detalhes, setDetalhes] = useState<any>(null);

  useEffect(() => {
    calcular();
  }, [params]);

  const calcular = () => {
    const {
      quantidadeMaterial,
      valorUnitarioMaterial,
      incluiServicos,
      custoServicos,
    } = params;

    if (quantidadeMaterial <= 0 || valorUnitarioMaterial <= 0) {
      setValorTotal(null);
      setDetalhes(null);
      return;
    }

    const valorMaterial = quantidadeMaterial * valorUnitarioMaterial;
    let total = valorMaterial;
    const detalhesCalculo: any = {
      quantidadeMaterial,
      valorUnitarioMaterial,
      valorMaterial,
      incluiServicos,
    };

    if (incluiServicos) {
      if (custoServicos && custoServicos > 0) {
        total += custoServicos;
        detalhesCalculo.custoServicos = custoServicos;
      }
    }

    const totalFinal = Number(total.toFixed(2));

    setValorTotal(totalFinal);
    setDetalhes(detalhesCalculo);
    onChange({ params, valor: totalFinal, descricao: detalhesCalculo });
  };

  const handleChange = (field: keyof ParametrosClasseVIII, value: any) => {
    setParams((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quantidade de Material <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            step="1"
            value={params.quantidadeMaterial || ""}
            onChange={(e) =>
              handleChange("quantidadeMaterial", parseInt(e.target.value) || 0)
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
            placeholder="Número de unidades"
          />
          <p className="text-xs text-gray-500 mt-1">
            Quantidade de material de saúde (medicamentos, equipamentos médicos,
            etc.)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Valor Unitário do Material (R$){" "}
            <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={params.valorUnitarioMaterial || ""}
            onChange={(e) =>
              handleChange(
                "valorUnitarioMaterial",
                parseFloat(e.target.value) || 0
              )
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
            placeholder="0.00"
          />
          <p className="text-xs text-gray-500 mt-1">
            Custo por unidade de material de saúde
          </p>
        </div>
      </div>

      <div className="border-t pt-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={params.incluiServicos}
            onChange={(e) => handleChange("incluiServicos", e.target.checked)}
            className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-2 focus:ring-green-600"
          />
          <span className="text-sm font-medium text-gray-700">
            Incluir serviços de saúde
          </span>
        </label>
        <p className="text-xs text-gray-500 mt-1 ml-6">
          Adicionar custos de serviços médicos, consultas, exames, etc.
        </p>

        {params.incluiServicos && (
          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Custo dos Serviços (R$)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={params.custoServicos || ""}
              onChange={(e) =>
                handleChange("custoServicos", parseFloat(e.target.value) || 0)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
              placeholder="0.00"
            />
            <p className="text-xs text-gray-500 mt-1">
              Custo total dos serviços de saúde associados
            </p>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
        <p className="text-sm text-blue-800">
          <strong>Fórmula:</strong> (Quantidade × Valor Unitário) + Custo
          Serviços (opcional)
        </p>
        <p className="text-xs text-blue-700 mt-1">
          Exemplos: medicamentos, equipamentos médicos, serviços médicos, exames
        </p>
      </div>

      <PreviewCalculo valorTotal={valorTotal} carimbo={detalhes} />
    </div>
  );
}
