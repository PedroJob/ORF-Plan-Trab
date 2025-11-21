'use client';

import { useState, useEffect } from 'react';
import { PreviewCalculo } from '../PreviewCalculo';

interface ParametrosClasseI {
  efetivo: number;
  tipoRefeicao: 'QR' | 'QS';
  diasEtapa?: number;
  numRefIntermediarias?: number;
  diasComplemento?: number;
}

interface Operacao {
  id: string;
  nome: string;
  efetivo: number;
  dataInicio: string;
  dataFinal: string;
}

interface FormularioClasseIProps {
  value: ParametrosClasseI | null;
  onChange: (params: ParametrosClasseI, valorTotal: number, valorCombustivel?: number) => void;
  operacao: Operacao;
}

const VALORES_REFEICAO = {
  QR: 14.4,
  QS: 9.6,
};

export function FormularioClasseI({ value, onChange, operacao }: FormularioClasseIProps) {
  // Calculate dias from operation dates
  const calcularDias = () => {
    const inicio = new Date(operacao.dataInicio);
    const final = new Date(operacao.dataFinal);
    const diffTime = Math.abs(final.getTime() - inicio.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const [params, setParams] = useState<ParametrosClasseI>(
    value || {
      efetivo: operacao.efetivo,
      tipoRefeicao: 'QR',
      diasEtapa: calcularDias(),
      numRefIntermediarias: 0,
      diasComplemento: 0,
    }
  );

  const [valorTotal, setValorTotal] = useState<number | null>(null);
  const [detalhes, setDetalhes] = useState<any>(null);

  useEffect(() => {
    calcular();
  }, [params]);

  const calcular = () => {
    const { efetivo, tipoRefeicao, diasEtapa = 0, numRefIntermediarias = 0, diasComplemento = 0 } = params;

    if (efetivo <= 0) {
      setValorTotal(null);
      setDetalhes(null);
      return;
    }

    const valorEtapa = VALORES_REFEICAO[tipoRefeicao];
    let total = 0;
    const detalhesCalculo: any = {
      efetivo,
      tipoRefeicao,
      valorRefeicao: valorEtapa,
    };

    // Etapa (max 8 dias)
    if (diasEtapa > 0) {
      const diasEtapaLimitado = Math.min(diasEtapa, 8);
      const valorEtapaTotal = efetivo * valorEtapa * diasEtapaLimitado;
      total += valorEtapaTotal;
      detalhesCalculo.diasEtapa = diasEtapa;
      detalhesCalculo.diasEtapaConsiderados = diasEtapaLimitado;
      detalhesCalculo.valorEtapa = valorEtapaTotal;
    }

    // Referências intermediárias (max 3 refs × 30 dias)
    if (numRefIntermediarias > 0 && diasComplemento > 0) {
      const refsLimitadas = Math.min(numRefIntermediarias, 3);
      const diasLimitados = Math.min(diasComplemento, 30);
      const valorRefTotal = efetivo * refsLimitadas * (valorEtapa / 3) * diasLimitados;
      total += valorRefTotal;
      detalhesCalculo.numRefIntermediarias = numRefIntermediarias;
      detalhesCalculo.refsConsideradas = refsLimitadas;
      detalhesCalculo.diasComplemento = diasComplemento;
      detalhesCalculo.diasComplementoConsiderados = diasLimitados;
      detalhesCalculo.valorReferencias = valorRefTotal;
    }

    const totalFinal = Number(total.toFixed(2));
    setValorTotal(totalFinal);
    setDetalhes(detalhesCalculo);
    onChange(params, totalFinal);
  };

  const handleChange = (field: keyof ParametrosClasseI, value: any) => {
    setParams(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Efetivo <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            value={params.efetivo || ''}
            onChange={(e) => handleChange('efetivo', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
            placeholder="Número de militares"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de Refeição <span className="text-red-500">*</span>
          </label>
          <select
            value={params.tipoRefeicao}
            onChange={(e) => handleChange('tipoRefeicao', e.target.value as 'QR' | 'QS')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
          >
            <option value="QR">QR - Quota de Rancho (R$ {VALORES_REFEICAO.QR.toFixed(2)})</option>
            <option value="QS">QS - Quota de Sobrevivência (R$ {VALORES_REFEICAO.QS.toFixed(2)})</option>
          </select>
        </div>
      </div>

      <div className="border-t pt-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Etapa (máx. 8 dias)</h4>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Dias na Etapa
          </label>
          <input
            type="number"
            min="0"
            max="8"
            value={params.diasEtapa || ''}
            onChange={(e) => handleChange('diasEtapa', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
            placeholder="0 a 8 dias"
          />
          {params.diasEtapa && params.diasEtapa > 8 && (
            <p className="text-xs text-amber-600 mt-1">
              Será considerado o máximo de 8 dias
            </p>
          )}
        </div>
      </div>

      <div className="border-t pt-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">
          Referências Intermediárias (máx. 3 refs × 30 dias)
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de Referências
            </label>
            <input
              type="number"
              min="0"
              max="3"
              value={params.numRefIntermediarias || ''}
              onChange={(e) => handleChange('numRefIntermediarias', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
              placeholder="0 a 3"
            />
            {params.numRefIntermediarias && params.numRefIntermediarias > 3 && (
              <p className="text-xs text-amber-600 mt-1">
                Será considerado o máximo de 3 referências
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dias de Complemento
            </label>
            <input
              type="number"
              min="0"
              max="30"
              value={params.diasComplemento || ''}
              onChange={(e) => handleChange('diasComplemento', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
              placeholder="0 a 30 dias"
            />
            {params.diasComplemento && params.diasComplemento > 30 && (
              <p className="text-xs text-amber-600 mt-1">
                Será considerado o máximo de 30 dias
              </p>
            )}
          </div>
        </div>
      </div>

      <PreviewCalculo
        valorTotal={valorTotal}
        detalhes={detalhes}
      />
    </div>
  );
}
