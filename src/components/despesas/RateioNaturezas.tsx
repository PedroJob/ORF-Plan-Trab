"use client";

import { useState, useEffect } from "react";
import { X, Plus, AlertCircle, CheckCircle } from "lucide-react";
import type { NaturezaSelect, RateioNatureza } from "@/types/despesas";

interface RateioNaturezasProps {
  naturezas: NaturezaSelect[];
  naturezasPermitidas: string[]; // Códigos das naturezas permitidas
  value: RateioNatureza[];
  onChange: (rateio: RateioNatureza[]) => void;
  error?: string;
}

export function RateioNaturezas({
  naturezas,
  naturezasPermitidas,
  value,
  onChange,
  error,
}: RateioNaturezasProps) {
  const [somaPercentuais, setSomaPercentuais] = useState(0);

  useEffect(() => {
    const soma = value.reduce((acc, r) => acc + Number(r.percentual), 0);
    setSomaPercentuais(Number(soma.toFixed(2)));
  }, [value]);

  // Filtrar apenas naturezas permitidas
  const naturezasFiltradas = naturezas.filter((nat) =>
    naturezasPermitidas.includes(nat.codigo)
  );

  const handleAdd = () => {
    if (value.length >= naturezasFiltradas.length) return;

    // Find first natureza not yet added
    const naturezasAdicionadas = value.map((r) => r.naturezaId);
    const naturezaDisponivel = naturezasFiltradas.find(
      (nat) => !naturezasAdicionadas.includes(nat.id)
    );

    if (naturezaDisponivel) {
      onChange([
        ...value,
        { naturezaId: naturezaDisponivel.id, percentual: 0 },
      ]);
    }
  };

  const handleRemove = (index: number) => {
    const novoRateio = value.filter((_, i) => i !== index);
    onChange(novoRateio);
  };

  const handlePercentualChange = (index: number, percentual: string) => {
    const valor = percentual === "" ? 0 : Number(percentual);

    if (valor < 0 || valor > 100) return;

    const novoRateio = [...value];
    novoRateio[index] = { ...novoRateio[index], percentual: valor };
    onChange(novoRateio);
  };

  const handleNaturezaChange = (index: number, naturezaId: string) => {
    const novoRateio = [...value];
    novoRateio[index] = { ...novoRateio[index], naturezaId };
    onChange(novoRateio);
  };

  const getNaturezaNome = (naturezaId: string) => {
    const natureza = naturezas.find((n) => n.id === naturezaId);
    return natureza
      ? `${natureza.codigo} - ${natureza.nome}`
      : "Natureza não encontrada";
  };

  const naturezasDisponiveis = (naturezaIdAtual?: string) => {
    const naturezasAdicionadas = value
      .map((r) => r.naturezaId)
      .filter((id) => id !== naturezaIdAtual);
    return naturezasFiltradas.filter(
      (nat) => !naturezasAdicionadas.includes(nat.id)
    );
  };

  const isSomaCorreta = Math.abs(somaPercentuais - 100) < 0.01;
  const showSomaIndicator =
    value.length > 0 && value.every((r) => r.percentual > 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Rateio por Naturezas <span className="text-red-500">*</span>
        </label>
        {showSomaIndicator && (
          <div
            className={`flex items-center gap-1.5 text-sm font-medium ${
              isSomaCorreta ? "text-green-600" : "text-red-600"
            }`}
          >
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
                value={rateio.naturezaId}
                onChange={(e) => handleNaturezaChange(index, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent text-sm"
                disabled={naturezasFiltradas.length === 1}
              >
                <option value="">Selecione uma natureza</option>
                {naturezasDisponiveis(rateio.naturezaId).map((nat) => (
                  <option key={nat.id} value={nat.id}>
                    {nat.codigo} - {nat.nome}
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
                  value={rateio.percentual || ""}
                  onChange={(e) =>
                    handlePercentualChange(index, e.target.value)
                  }
                  placeholder="0.00"
                  className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent text-sm"
                  disabled={naturezasFiltradas.length === 1}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
                  %
                </span>
              </div>
            </div>

            {naturezasFiltradas.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                title="Remover natureza"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        ))}

        {value.length < naturezasFiltradas.length && (
          <button
            type="button"
            onClick={handleAdd}
            className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-md text-sm text-gray-600 hover:border-green-600 hover:text-green-700 hover:bg-green-50 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Adicionar natureza ao rateio
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {value.length === 0 && naturezasFiltradas.length > 1 && (
        <p className="text-sm text-gray-500">
          Adicione ao menos uma natureza para distribuir os custos desta
          despesa.
        </p>
      )}
    </div>
  );
}
