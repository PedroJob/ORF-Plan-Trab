'use client';

import { useState, useEffect } from 'react';
import { PreviewCalculo } from '../PreviewCalculo';

interface ParametrosClasseV {
  quantidade: number;
  valorUnitario: number;
}

interface FormularioClasseVProps {
  value: ParametrosClasseV | null;
  onChange: (params: ParametrosClasseV, valorTotal: number, valorCombustivel?: number) => void;
}

export function FormularioClasseV({ value, onChange }: FormularioClasseVProps) {
  const [params, setParams] = useState<ParametrosClasseV>(
    value || {
      quantidade: 0,
      valorUnitario: 0,
    }
  );

  const [valorTotal, setValorTotal] = useState<number | null>(null);
  const [detalhes, setDetalhes] = useState<any>(null);

  useEffect(() => {
    calcular();
  }, [params]);

  const calcular = () => {
    const { quantidade, valorUnitario } = params;

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
    });
    onChange(params, totalFinal);
  };

  const handleChange = (field: keyof ParametrosClasseV, value: any) => {
    setParams(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quantidade de Munição <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            step="1"
            value={params.quantidade || ''}
            onChange={(e) => handleChange('quantidade', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
            placeholder="Número de unidades"
          />
          <p className="text-xs text-gray-500 mt-1">
            Quantidade total de munição a ser adquirida (tiros, granadas, etc.)
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
            value={params.valorUnitario || ''}
            onChange={(e) => handleChange('valorUnitario', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
            placeholder="0.00"
          />
          <p className="text-xs text-gray-500 mt-1">
            Custo por unidade de munição
          </p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
        <p className="text-sm text-blue-800">
          <strong>Fórmula:</strong> Quantidade × Valor Unitário
        </p>
      </div>

      <PreviewCalculo
        valorTotal={valorTotal}
        detalhes={detalhes}
      />
    </div>
  );
}
