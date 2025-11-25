"use client";

import { useState, useEffect } from "react";
import { PreviewCalculo } from "../PreviewCalculo";
import { HandleParametrosChange } from "../ModalCriarDespesa";

interface ParametrosClasseX {
  quantidade: number;
  valorUnitario: number;
  descricaoDetalhada: string;
}

interface FormularioClasseXProps {
  value: ParametrosClasseX | null;
  onChange: (params: HandleParametrosChange) => void;
}

export function FormularioClasseX({ value, onChange }: FormularioClasseXProps) {
  const [params, setParams] = useState<ParametrosClasseX>(
    value || {
      quantidade: 0,
      valorUnitario: 0,
      descricaoDetalhada: "",
    }
  );

  const [valorTotal, setValorTotal] = useState<number | null>(null);
  const [detalhes, setDetalhes] = useState<any>(null);

  useEffect(() => {
    calcular();
  }, [params]);

  const calcular = () => {
    const { quantidade, valorUnitario, descricaoDetalhada } = params;

    if (quantidade <= 0 || valorUnitario <= 0) {
      setValorTotal(null);
      setDetalhes(null);
      return;
    }

    const total = quantidade * valorUnitario;
    const totalFinal = Number(total.toFixed(2));

    setValorTotal(totalFinal);
    setDetalhes({
      quantidade,
      valorUnitario,
      descricaoDetalhada: descricaoDetalhada || "Não especificado",
    });
    onChange({ params, valor: totalFinal, descricao: detalhes });
  };

  const handleChange = (field: keyof ParametrosClasseX, value: any) => {
    setParams((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-300 rounded-md p-3">
        <p className="text-sm text-blue-800">
          <strong>Classe X - Material Não Classificado</strong>
        </p>
        <p className="text-xs text-blue-700 mt-1">
          Esta classe é para materiais que não se enquadram nas outras classes
          (I a IX). Forneça uma descrição detalhada do material.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Descrição Detalhada do Material{" "}
          <span className="text-red-500">*</span>
        </label>
        <textarea
          value={params.descricaoDetalhada}
          onChange={(e) => handleChange("descricaoDetalhada", e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent resize-none"
          placeholder="Descreva detalhadamente o material não classificado nas demais classes..."
        />
        <p className="text-xs text-gray-500 mt-1">
          Explique qual material está sendo solicitado e por que não se enquadra
          em outras classes
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quantidade <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            step="0.01"
            value={params.quantidade || ""}
            onChange={(e) =>
              handleChange("quantidade", parseFloat(e.target.value) || 0)
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
            placeholder="Quantidade de unidades"
          />
          <p className="text-xs text-gray-500 mt-1">
            Quantidade do material a ser adquirido
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Valor Unitário (R$) <span className="text-red-500">*</span>
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
            Custo por unidade do material
          </p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
        <p className="text-sm text-blue-800">
          <strong>Fórmula:</strong> Quantidade × Valor Unitário
        </p>
      </div>

      <PreviewCalculo valorTotal={valorTotal} carimbo={detalhes} />
    </div>
  );
}
