'use client';

import { AlertCircle } from 'lucide-react';

interface SeletorNaturezasProps {
  naturezasPermitidas: string[];
  value: string[];
  onChange: (naturezas: string[]) => void;
  error?: string;
}

const NATUREZAS_INFO: Record<string, string> = {
  '33.90.30': 'Material de Consumo',
  '33.90.39': 'Outros Serviços de Terceiros - Pessoa Jurídica',
};

export function SeletorNaturezas({
  naturezasPermitidas,
  value,
  onChange,
  error
}: SeletorNaturezasProps) {
  const handleToggle = (natureza: string) => {
    if (value.includes(natureza)) {
      onChange(value.filter(n => n !== natureza));
    } else {
      onChange([...value, natureza]);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Naturezas de Despesa <span className="text-red-500">*</span>
      </label>

      <div className="space-y-2">
        {naturezasPermitidas.map((natureza) => (
          <label
            key={natureza}
            className={`flex items-start gap-3 p-3 border rounded-md cursor-pointer transition-all ${
              value.includes(natureza)
                ? 'border-green-600 bg-green-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input
              type="checkbox"
              checked={value.includes(natureza)}
              onChange={() => handleToggle(natureza)}
              className="mt-0.5 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-2 focus:ring-green-600 focus:ring-offset-0"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold text-sm text-gray-900">
                  {natureza}
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-0.5">
                {NATUREZAS_INFO[natureza] || 'Natureza de despesa'}
              </p>
            </div>
          </label>
        ))}
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {value.length === 0 && (
        <p className="text-sm text-gray-500">
          Selecione ao menos uma natureza de despesa para esta classe.
        </p>
      )}

      {value.length > 0 && (
        <div className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-md">
          {value.length === 1 ? '1 natureza selecionada' : `${value.length} naturezas selecionadas`}
        </div>
      )}
    </div>
  );
}
