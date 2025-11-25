"use client";

import { useEffect, useState } from "react";
import { Check, X, Clock } from "lucide-react";

interface Aprovacao {
  id: string;
  acao: "APROVADO" | "REPROVADO";
  motivo: string | null;
  nivelHierarquico: number;
  dataAcao: string;
  aprovador: {
    postoGraduacao: string;
    nomeCompleto: string;
    nomeGuerra: string | null;
  };
}

interface HistoricoAprovacoesProps {
  planoId: string;
}

const NOMES_NIVEIS: Record<number, string> = {
  1: "Comandante da OM",
  2: "Comandante da Brigada",
  3: "Comandante do CMA",
};

export function HistoricoAprovacoes({ planoId }: HistoricoAprovacoesProps) {
  const [aprovacoes, setAprovacoes] = useState<Aprovacao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistorico();
  }, [planoId]);

  const fetchHistorico = async () => {
    try {
      const response = await fetch(`/api/planos/${planoId}/historico-aprovacoes`);
      if (response.ok) {
        const data = await response.json();
        setAprovacoes(data);
      }
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatData = (dataString: string) => {
    const data = new Date(dataString);
    return data.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Histórico de Aprovações
        </h3>
        <div className="flex items-center justify-center py-8">
          <Clock className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (aprovacoes.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Histórico de Aprovações
        </h3>
        <p className="text-sm text-gray-500 text-center py-8">
          Nenhuma aprovação ou reprovação registrada ainda.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Histórico de Aprovações
      </h3>

      <div className="space-y-4">
        {aprovacoes.map((aprovacao) => (
          <div
            key={aprovacao.id}
            className={`border rounded-lg p-4 ${
              aprovacao.acao === "APROVADO"
                ? "border-green-200 bg-green-50"
                : "border-red-200 bg-red-50"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {aprovacao.acao === "APROVADO" ? (
                    <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                      <Check className="w-5 h-5 text-green-600" />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-full">
                      <X className="w-5 h-5 text-red-600" />
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`font-semibold ${
                        aprovacao.acao === "APROVADO"
                          ? "text-green-700"
                          : "text-red-700"
                      }`}
                    >
                      {aprovacao.acao === "APROVADO" ? "Aprovado" : "Reprovado"}
                    </span>
                    <span className="text-xs text-gray-500">
                      • Nível {aprovacao.nivelHierarquico}
                    </span>
                  </div>

                  <p className="text-sm text-gray-700 mt-1">
                    {NOMES_NIVEIS[aprovacao.nivelHierarquico] || `Nível ${aprovacao.nivelHierarquico}`}
                  </p>

                  <p className="text-sm text-gray-600 mt-2">
                    Por: {aprovacao.aprovador.postoGraduacao}{" "}
                    {aprovacao.aprovador.nomeGuerra || aprovacao.aprovador.nomeCompleto}
                  </p>

                  {aprovacao.motivo && (
                    <div className="mt-2 p-2 bg-white rounded border border-gray-200">
                      <p className="text-xs text-gray-500 font-medium mb-1">
                        Motivo:
                      </p>
                      <p className="text-sm text-gray-700">{aprovacao.motivo}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-right">
                <p className="text-xs text-gray-500">
                  {formatData(aprovacao.dataAcao)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
