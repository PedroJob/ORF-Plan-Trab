'use client';

import { useState, useEffect } from 'react';
import { PreviewCalculo } from '../PreviewCalculo';
import { Plus, X } from 'lucide-react';

interface MaterialConstrucao {
  descricao: string;
  quantidade: number;
  valorUnitario: number;
}

interface ParametrosClasseIV {
  materiais: MaterialConstrucao[];
}

interface FormularioClasseIVProps {
  value: ParametrosClasseIV | null;
  onChange: (params: ParametrosClasseIV, valorTotal: number, valorCombustivel?: number) => void;
}

export function FormularioClasseIV({ value, onChange }: FormularioClasseIVProps) {
  const [params, setParams] = useState<ParametrosClasseIV>(
    value || {
      materiais: [],
    }
  );

  const [valorTotal, setValorTotal] = useState<number | null>(null);
  const [detalhes, setDetalhes] = useState<any>(null);

  useEffect(() => {
    calcular();
  }, [params]);

  const calcular = () => {
    const { materiais } = params;

    if (materiais.length === 0) {
      setValorTotal(null);
      setDetalhes(null);
      return;
    }

    const materiaisValidos = materiais.filter(
      m => m.descricao && m.quantidade > 0 && m.valorUnitario > 0
    );

    if (materiaisValidos.length === 0) {
      setValorTotal(null);
      setDetalhes(null);
      return;
    }

    const itensDetalhados = materiaisValidos.map(m => ({
      descricao: m.descricao,
      quantidade: m.quantidade,
      valorUnitario: m.valorUnitario,
      subtotal: Number((m.quantidade * m.valorUnitario).toFixed(2)),
    }));

    const total = itensDetalhados.reduce((sum, item) => sum + item.subtotal, 0);
    const totalFinal = Number(total.toFixed(2));

    setValorTotal(totalFinal);
    setDetalhes({
      numeroItens: itensDetalhados.length,
      itens: itensDetalhados,
    });
    onChange(params, totalFinal);
  };

  const handleAddMaterial = () => {
    setParams(prev => ({
      ...prev,
      materiais: [...prev.materiais, { descricao: '', quantidade: 0, valorUnitario: 0 }],
    }));
  };

  const handleRemoveMaterial = (index: number) => {
    setParams(prev => ({
      ...prev,
      materiais: prev.materiais.filter((_, i) => i !== index),
    }));
  };

  const handleMaterialChange = (index: number, field: keyof MaterialConstrucao, value: any) => {
    setParams(prev => ({
      ...prev,
      materiais: prev.materiais.map((m, i) =>
        i === index ? { ...m, [field]: value } : m
      ),
    }));
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Materiais de Construção <span className="text-red-500">*</span>
        </label>

        <div className="space-y-3">
          {params.materiais.map((material, index) => (
            <div key={index} className="border border-gray-300 rounded-md p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Material {index + 1}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveMaterial(index)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Remover material"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Descrição
                </label>
                <input
                  type="text"
                  value={material.descricao}
                  onChange={(e) => handleMaterialChange(index, 'descricao', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent text-sm"
                  placeholder="Ex: Cimento Portland 50kg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Quantidade
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={material.quantidade || ''}
                    onChange={(e) => handleMaterialChange(index, 'quantidade', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent text-sm"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Valor Unitário (R$)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={material.valorUnitario || ''}
                    onChange={(e) => handleMaterialChange(index, 'valorUnitario', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent text-sm"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {material.quantidade > 0 && material.valorUnitario > 0 && (
                <div className="bg-gray-50 rounded px-3 py-2">
                  <p className="text-xs text-gray-600">
                    Subtotal: <span className="font-semibold text-gray-900">
                      R$ {(material.quantidade * material.valorUnitario).toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </p>
                </div>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddMaterial}
            className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-md text-sm text-gray-600 hover:border-green-600 hover:text-green-700 hover:bg-green-50 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Adicionar material de construção
          </button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
        <p className="text-sm text-blue-800">
          <strong>Fórmula:</strong> Soma de (Quantidade × Valor Unitário) de todos os materiais
        </p>
      </div>

      <PreviewCalculo
        valorTotal={valorTotal}
        detalhes={detalhes}
      />
    </div>
  );
}
