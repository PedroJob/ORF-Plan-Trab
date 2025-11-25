"use client";

import { useState, useEffect } from "react";
import { PreviewCalculo } from "../PreviewCalculo";
import { HandleParametrosChange } from "../ModalCriarDespesa";

interface ParametrosClasseIX {
  grupoViatura: "GP1" | "GP2" | "GP3";
  numeroViaturas: number;
  valorPecas: number;
  custoMaoObra: number;
}

interface FormularioClasseIXProps {
  value: ParametrosClasseIX | null;
  onChange: (params: HandleParametrosChange) => void;
}

const GRUPOS_INFO = {
  GP1: "Viaturas leves (até 3,5t)",
  GP2: "Viaturas médias (3,5t a 10t)",
  GP3: "Viaturas pesadas (acima de 10t)",
};

export function FormularioClasseIX({
  value,
  onChange,
}: FormularioClasseIXProps) {
  const [params, setParams] = useState<ParametrosClasseIX>(
    value || {
      grupoViatura: "GP1",
      numeroViaturas: 0,
      valorPecas: 0,
      custoMaoObra: 0,
    }
  );

  const [valorTotal, setValorTotal] = useState<number | null>(null);
  const [detalhes, setDetalhes] = useState<any>(null);

  useEffect(() => {
    calcular();
  }, [params]);

  const calcular = () => {
    const { grupoViatura, numeroViaturas, valorPecas, custoMaoObra } = params;

    if (numeroViaturas <= 0 || valorPecas < 0 || custoMaoObra < 0) {
      setValorTotal(null);
      setDetalhes(null);
      return;
    }

    if (valorPecas === 0 && custoMaoObra === 0) {
      setValorTotal(null);
      setDetalhes(null);
      return;
    }

    const total = numeroViaturas * (valorPecas + custoMaoObra);
    const totalFinal = Number(total.toFixed(2));

    setValorTotal(totalFinal);
    setDetalhes({
      grupoViatura,
      numeroViaturas,
      valorPecas,
      custoMaoObra,
      custoPorViatura: Number((valorPecas + custoMaoObra).toFixed(2)),
    });
    onChange({ params, valor: totalFinal, descricao: detalhes });
  };

  const handleChange = (field: keyof ParametrosClasseIX, value: any) => {
    setParams((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Grupo de Viatura <span className="text-red-500">*</span>
        </label>
        <div className="space-y-2">
          {Object.entries(GRUPOS_INFO).map(([grupo, descricao]) => (
            <label
              key={grupo}
              className={`flex items-center gap-3 p-3 border rounded-md cursor-pointer transition-all ${
                params.grupoViatura === grupo
                  ? "border-green-600 bg-green-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <input
                type="radio"
                name="grupoViatura"
                value={grupo}
                checked={params.grupoViatura === grupo}
                onChange={(e) =>
                  handleChange(
                    "grupoViatura",
                    e.target.value as "GP1" | "GP2" | "GP3"
                  )
                }
                className="w-4 h-4 text-green-600 border-gray-300 focus:ring-2 focus:ring-green-600"
              />
              <div className="flex-1">
                <div className="font-medium text-sm text-gray-900">{grupo}</div>
                <div className="text-xs text-gray-600">{descricao}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Número de Viaturas <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            step="1"
            value={params.numeroViaturas || ""}
            onChange={(e) =>
              handleChange("numeroViaturas", parseInt(e.target.value) || 0)
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
            placeholder="Quantidade de viaturas"
          />
          <p className="text-xs text-gray-500 mt-1">
            Número de viaturas que receberão manutenção
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Valor das Peças por Viatura (R$){" "}
            <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={params.valorPecas || ""}
            onChange={(e) =>
              handleChange("valorPecas", parseFloat(e.target.value) || 0)
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
            placeholder="0.00"
          />
          <p className="text-xs text-gray-500 mt-1">
            Custo médio de peças por viatura
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Custo de Mão de Obra por Viatura (R$){" "}
            <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={params.custoMaoObra || ""}
            onChange={(e) =>
              handleChange("custoMaoObra", parseFloat(e.target.value) || 0)
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
            placeholder="0.00"
          />
          <p className="text-xs text-gray-500 mt-1">
            Custo de serviços de manutenção por viatura
          </p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
        <p className="text-sm text-blue-800">
          <strong>Fórmula:</strong> Número de Viaturas × (Valor Peças + Custo
          Mão de Obra)
        </p>
        <p className="text-xs text-blue-700 mt-1">
          Manutenção preventiva e corretiva de viaturas conforme o grupo
        </p>
      </div>

      <PreviewCalculo valorTotal={valorTotal} carimbo={detalhes} />
    </div>
  );
}
