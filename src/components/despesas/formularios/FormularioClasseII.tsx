'use client';

import { useState, useEffect } from 'react';
import { PreviewCalculo } from '../PreviewCalculo';

interface ParametrosClasseII {
  quantidade: number;
  custoDiario: number;
  dias: number;
}

interface FormularioClasseIIProps {
  value: ParametrosClasseII | null;
  onChange: (params: ParametrosClasseII, valorTotal: number, valorCombustivel?: number) => void;
}

export function FormularioClasseII({ value, onChange }: FormularioClasseIIProps) {
  const [params, setParams] = useState<ParametrosClasseII>(
    value || {
      quantidade: 0,
      custoDiario: 0,
      dias: 0,
    }
  );

  const [valorTotal, setValorTotal] = useState<number | null>(null);
  const [detalhes, setDetalhes] = useState<any>(null);

  useEffect(() => {
    calcular();
  }, [params]);

  const calcular = () => {
    const { quantidade, custoDiario, dias } = params;

    if (quantidade <= 0 || custoDiario <= 0 || dias <= 0) {
      setValorTotal(null);
      setDetalhes(null);
      return;
    }

    const total = quantidade * custoDiario * dias;
    const totalFinal = Number(total.toFixed(2));

    setValorTotal(totalFinal);
    setDetalhes({
      quantidade,
      custoDiario,
      dias,
    });
    onChange(params, totalFinal);
  };

  const handleChange = (field: keyof ParametrosClasseII, value: any) => {
    setParams(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quantidade <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            step="1"
            value={params.quantidade || ''}
            onChange={(e) => handleChange('quantidade', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
            placeholder="Quantidade de itens"
          />
          <p className="text-xs text-gray-500 mt-1">
            Número de itens de intendência necessários
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Custo Diário (R$) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={params.custoDiario || ''}
            onChange={(e) => handleChange('custoDiario', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
            placeholder="0.00"
          />
          <p className="text-xs text-gray-500 mt-1">
            Custo por item por dia
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Número de Dias <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            step="1"
            value={params.dias || ''}
            onChange={(e) => handleChange('dias', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
            placeholder="Dias de utilização"
          />
          <p className="text-xs text-gray-500 mt-1">
            Duração da utilização do material
          </p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
        <p className="text-sm text-blue-800">
          <strong>Fórmula:</strong> Quantidade × Custo Diário × Dias
        </p>
      </div>

      <PreviewCalculo
        valorTotal={valorTotal}
        detalhes={detalhes}
      />
    </div>
  );
}
