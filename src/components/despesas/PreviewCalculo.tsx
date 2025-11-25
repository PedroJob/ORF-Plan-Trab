"use client";

import { Calculator, AlertCircle, Info } from "lucide-react";

interface PreviewCalculoProps {
  valorTotal: number | null;
  valorCombustivel?: number | null;
  carimbo?: any;
  loading?: boolean;
  error?: string;
  isCombustivel?: boolean;
}

export function PreviewCalculo({
  valorTotal,
  valorCombustivel,
  carimbo,
  loading = false,
  error,
  isCombustivel = false,
}: PreviewCalculoProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
        <div className="flex items-center gap-2 text-gray-600">
          <Calculator className="w-5 h-5 animate-pulse" />
          <span className="text-sm">Calculando...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-300 rounded-lg p-4">
        <div className="flex items-start gap-2 text-red-700">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-sm">Erro no cálculo</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (valorTotal === null) {
    return null;
  }

  return (
    <div className="bg-green-50 border border-green-600 rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2 text-green-800">
        <Calculator className="w-5 h-5" />
        <span className="font-semibold text-sm">Valor Calculado</span>
      </div>

      <div className="space-y-2">
        {isCombustivel &&
          valorCombustivel !== null &&
          valorCombustivel !== undefined && (
            <div className="bg-white rounded-md p-3 border border-green-200">
              <p className="text-xs text-gray-600 mb-1">
                Quantidade de combustível (L)
              </p>
              <p className="text-lg font-bold text-gray-900">
                {valorCombustivel.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                L
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Inclui fator de segurança de 1.3
              </p>
            </div>
          )}

        <div className="bg-white rounded-md p-3 border border-green-200">
          <p className="text-xs text-gray-600 mb-1">Valor Total da Despesa</p>
          <p className="text-2xl font-bold text-green-700">
            {formatCurrency(valorTotal)}
          </p>
        </div>

        <details className="bg-white rounded-md border border-green-200">
          <summary className="px-3 py-2 cursor-pointer text-sm text-gray-700 hover:bg-gray-50 rounded-md font-medium">
            Ver detalhes do cálculo
          </summary>
          <div className="px-3 pb-3 pt-2 space-y-1.5">
            <span className="font-mono text-gray-900">{carimbo}</span>
          </div>
        </details>
      </div>
    </div>
  );
}
