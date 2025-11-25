'use client';

import { useState, useEffect } from 'react';
import { X, Plus, AlertCircle, CheckCircle } from 'lucide-react';
import type { OMSelect, RateioOM } from '@/types/despesas';

interface RateioOMsProps {
  oms: OMSelect[];
  value: RateioOM[];
  onChange: (rateio: RateioOM[]) => void;
  error?: string;
}

export function RateioOMs({ oms, value, onChange, error }: RateioOMsProps) {
  const [somaPercentuais, setSomaPercentuais] = useState(0);

  useEffect(() => {
    const soma = value.reduce((acc, r) => acc + Number(r.percentual), 0);
    setSomaPercentuais(Number(soma.toFixed(2)));
  }, [value]);

  const handleAdd = () => {
    if (value.length >= oms.length) return;

    // Find first OM not yet added
    const omsAdicionadas = value.map(r => r.omId);
    const omDisponivel = oms.find(om => !omsAdicionadas.includes(om.id));

    if (omDisponivel) {
      onChange([...value, { omId: omDisponivel.id, percentual: 0 }]);
    }
  };

  const handleRemove = (index: number) => {
    const novoRateio = value.filter((_, i) => i !== index);
    onChange(novoRateio);
  };

  const handlePercentualChange = (index: number, percentual: string) => {
    const valor = percentual === '' ? 0 : Number(percentual);

    if (valor < 0 || valor > 100) return;

    const novoRateio = [...value];
    novoRateio[index] = { ...novoRateio[index], percentual: valor };
    onChange(novoRateio);
  };

  const handleOmChange = (index: number, omId: string) => {
    const novoRateio = [...value];
    novoRateio[index] = { ...novoRateio[index], omId };
    onChange(novoRateio);
  };

  const getOMNome = (omId: string) => {
    const om = oms.find(o => o.id === omId);
    return om ? `${om.sigla} - ${om.nome}` : 'OM não encontrada';
  };

  const omsDisponiveis = (omIdAtual?: string) => {
    const omsAdicionadas = value.map(r => r.omId).filter(id => id !== omIdAtual);
    return oms.filter(om => !omsAdicionadas.includes(om.id));
  };

  const isSomaCorreta = Math.abs(somaPercentuais - 100) < 0.01;
  const showSomaIndicator = value.length > 0 && value.every(r => r.percentual > 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Rateio por OMs <span className="text-red-500">*</span>
        </label>
        {showSomaIndicator && (
          <div className={`flex items-center gap-1.5 text-sm font-medium ${
            isSomaCorreta ? 'text-green-600' : 'text-red-600'
          }`}>
            {isSomaCorreta ? (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Soma: {somaPercentuais.toFixed(2)}%</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4" />
                <span>Soma: {somaPercentuais.toFixed(2)}% (deve ser 100%)</span>
              </>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2">
        {value.map((rateio, index) => (
          <div key={index} className="flex gap-2 items-start">
            <div className="flex-1">
              <select
                value={rateio.omId}
                onChange={(e) => handleOmChange(index, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent text-sm"
              >
                <option value="">Selecione uma OM</option>
                {omsDisponiveis(rateio.omId).map(om => (
                  <option key={om.id} value={om.id}>
                    {om.sigla} - {om.nome} (UG: {om.codUG})
                  </option>
                ))}
              </select>
            </div>

            <div className="w-28">
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={rateio.percentual || ''}
                  onChange={(e) => handlePercentualChange(index, e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent text-sm"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
                  %
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
              title="Remover OM"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ))}

        {value.length < oms.length && (
          <button
            type="button"
            onClick={handleAdd}
            className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-md text-sm text-gray-600 hover:border-green-600 hover:text-green-700 hover:bg-green-50 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Adicionar OM ao rateio
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {value.length === 0 && (
        <p className="text-sm text-gray-500">
          Adicione ao menos uma OM para distribuir os custos desta despesa.
        </p>
      )}
    </div>
  );
}
