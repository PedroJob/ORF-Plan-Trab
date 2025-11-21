'use client';

import { useState, useEffect } from 'react';
import { PreviewCalculo } from '../PreviewCalculo';
import { AlertCircle } from 'lucide-react';

interface ParametrosClasseIII {
  tipoCalculo: 'DISTANCIA' | 'DIAS';
  distanciaKm?: number;
  consumoMedioKmL?: number;
  diasOperacao?: number;
  consumoDiarioLitros?: number;
  precoLitro: number;
}

interface FormularioClasseIIIProps {
  value: ParametrosClasseIII | null;
  onChange: (params: ParametrosClasseIII, valorTotal: number, valorCombustivel?: number) => void;
}

const FATOR_COMBUSTIVEL = 1.3;

export function FormularioClasseIII({ value, onChange }: FormularioClasseIIIProps) {
  const [params, setParams] = useState<ParametrosClasseIII>(
    value || {
      tipoCalculo: 'DISTANCIA',
      distanciaKm: 0,
      consumoMedioKmL: 0,
      diasOperacao: 0,
      consumoDiarioLitros: 0,
      precoLitro: 0,
    }
  );

  const [valorTotal, setValorTotal] = useState<number | null>(null);
  const [valorCombustivel, setValorCombustivel] = useState<number | null>(null);
  const [detalhes, setDetalhes] = useState<any>(null);

  useEffect(() => {
    calcular();
  }, [params]);

  const calcular = () => {
    const { tipoCalculo, distanciaKm, consumoMedioKmL, diasOperacao, consumoDiarioLitros, precoLitro } = params;

    if (precoLitro <= 0) {
      setValorTotal(null);
      setValorCombustivel(null);
      setDetalhes(null);
      return;
    }

    let litrosBase = 0;

    if (tipoCalculo === 'DISTANCIA') {
      if (!distanciaKm || distanciaKm <= 0 || !consumoMedioKmL || consumoMedioKmL <= 0) {
        setValorTotal(null);
        setValorCombustivel(null);
        setDetalhes(null);
        return;
      }
      litrosBase = distanciaKm / consumoMedioKmL;
    } else {
      if (!diasOperacao || diasOperacao <= 0 || !consumoDiarioLitros || consumoDiarioLitros <= 0) {
        setValorTotal(null);
        setValorCombustivel(null);
        setDetalhes(null);
        return;
      }
      litrosBase = diasOperacao * consumoDiarioLitros;
    }

    // Aplicar fator de segurança obrigatório
    const litrosComFator = litrosBase * FATOR_COMBUSTIVEL;
    const total = litrosComFator * precoLitro;

    const totalFinal = Number(total.toFixed(2));
    const litrosFinal = Number(litrosComFator.toFixed(2));

    setValorTotal(totalFinal);
    setValorCombustivel(litrosFinal);
    setDetalhes({
      tipoCalculo,
      ...(tipoCalculo === 'DISTANCIA' ? {
        distanciaKm,
        consumoMedioKmL,
        litrosBase: Number(litrosBase.toFixed(2)),
      } : {
        diasOperacao,
        consumoDiarioLitros,
        litrosBase: Number(litrosBase.toFixed(2)),
      }),
      fatorSeguranca: FATOR_COMBUSTIVEL,
      litrosComFator: litrosFinal,
      precoLitro,
    });

    onChange(params, totalFinal, litrosFinal);
  };

  const handleChange = (field: keyof ParametrosClasseIII, value: any) => {
    setParams(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-300 rounded-md p-3 flex items-start gap-2">
        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-amber-800">
          <p className="font-semibold">Fator de Segurança Obrigatório</p>
          <p className="mt-1">
            Todo cálculo de combustível aplica automaticamente o fator de segurança de {FATOR_COMBUSTIVEL} (30% adicional).
          </p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tipo de Cálculo <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleChange('tipoCalculo', 'DISTANCIA')}
            className={`px-4 py-3 rounded-md border-2 text-sm font-medium transition-all ${
              params.tipoCalculo === 'DISTANCIA'
                ? 'border-green-600 bg-green-50 text-green-700'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            Por Distância
          </button>
          <button
            type="button"
            onClick={() => handleChange('tipoCalculo', 'DIAS')}
            className={`px-4 py-3 rounded-md border-2 text-sm font-medium transition-all ${
              params.tipoCalculo === 'DIAS'
                ? 'border-green-600 bg-green-50 text-green-700'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            Por Dias de Operação
          </button>
        </div>
      </div>

      {params.tipoCalculo === 'DISTANCIA' ? (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Distância Total (km) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={params.distanciaKm || ''}
              onChange={(e) => handleChange('distanciaKm', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Consumo Médio (km/L) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={params.consumoMedioKmL || ''}
              onChange={(e) => handleChange('consumoMedioKmL', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
              placeholder="0.0"
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dias de Operação <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={params.diasOperacao || ''}
              onChange={(e) => handleChange('diasOperacao', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Consumo Diário (L/dia) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={params.consumoDiarioLitros || ''}
              onChange={(e) => handleChange('consumoDiarioLitros', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
              placeholder="0.00"
            />
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Preço por Litro (R$) <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={params.precoLitro || ''}
          onChange={(e) => handleChange('precoLitro', parseFloat(e.target.value) || 0)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
          placeholder="0.00"
        />
      </div>

      <PreviewCalculo
        valorTotal={valorTotal}
        valorCombustivel={valorCombustivel}
        detalhes={detalhes}
        isCombustivel={true}
      />
    </div>
  );
}
