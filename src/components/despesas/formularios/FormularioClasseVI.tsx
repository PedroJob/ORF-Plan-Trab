'use client';

import { useState, useEffect } from 'react';
import { PreviewCalculo } from '../PreviewCalculo';

interface ParametrosClasseVI {
  efetivo: number;
  conjuntoItens: number;
  valorUnitario: number;
}

interface FormularioClasseVIProps {
  value: ParametrosClasseVI | null;
  onChange: (params: ParametrosClasseVI, valorTotal: number, valorCombustivel?: number) => void;
}

export function FormularioClasseVI({ value, onChange }: FormularioClasseVIProps) {
  const [params, setParams] = useState<ParametrosClasseVI>(
    value || {
      efetivo: 0,
      conjuntoItens: 0,
      valorUnitario: 0,
    }
  );

  const [valorTotal, setValorTotal] = useState<number | null>(null);
  const [detalhes, setDetalhes] = useState<any>(null);

  useEffect(() => {
    calcular();
  }, [params]);

  const calcular = () => {
    const { efetivo, conjuntoItens, valorUnitario } = params;

    if (efetivo <= 0 || conjuntoItens <= 0 || valorUnitario <= 0) {
      setValorTotal(null);
      setDetalhes(null);
      return;
    }

    const total = efetivo * conjuntoItens * valorUnitario;
    const totalFinal = Number(total.toFixed(2));

    setValorTotal(totalFinal);
    setDetalhes({
      efetivo,
      conjuntoItens,
      valorUnitario,
    });
    onChange(params, totalFinal);
  };

  const handleChange = (field: keyof ParametrosClasseVI, value: any) => {
    setParams(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Efetivo <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            step="1"
            value={params.efetivo || ''}
            onChange={(e) => handleChange('efetivo', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
            placeholder="Número de militares"
          />
          <p className="text-xs text-gray-500 mt-1">
            Número de militares que receberão os itens
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Conjunto de Itens por Militar <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            step="1"
            value={params.conjuntoItens || ''}
            onChange={(e) => handleChange('conjuntoItens', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
            placeholder="Número de conjuntos"
          />
          <p className="text-xs text-gray-500 mt-1">
            Quantidade de conjuntos de itens por pessoa (ex: 1 uniforme completo, 2 pares de botas)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Valor Unitário por Conjunto (R$) <span className="text-red-500">*</span>
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
            Custo de cada conjunto de itens pessoais
          </p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
        <p className="text-sm text-blue-800">
          <strong>Fórmula:</strong> Efetivo × Conjuntos por Militar × Valor Unitário
        </p>
        <p className="text-xs text-blue-700 mt-1">
          Exemplos de itens: uniformes, calçados, equipamentos individuais, etc.
        </p>
      </div>

      <PreviewCalculo
        valorTotal={valorTotal}
        detalhes={detalhes}
      />
    </div>
  );
}
