"use client";

import { useState, useEffect, useCallback } from "react";
import { PreviewCalculo } from "../PreviewCalculo";
import {
  calcularValorOperacao,
  gerarCarimboCompleto,
} from "@/lib/calculos/classeI";
import { VALORES_REFEICAO, MAX_DIAS_ETAPA } from "@/lib/constants";
import { Tipo } from "@prisma/client";
import { HandleParametrosChange as HandleParametrosChange } from "../ModalCriarDespesa";
import type { OperacaoWithEfetivo } from "@/types/despesas";

export type TipoRefeicao = "QR" | "QS";

interface ParametrosClasseI {
  efetivo: number;
  diasOperacao: number;
  numeroRefIntermediarias: number;
  descricao: string;
}

interface FormularioClasseIProps {
  value: ParametrosClasseI | null;
  tipo: Tipo;
  onChange: (params: HandleParametrosChange) => void;
  operacao: OperacaoWithEfetivo;
}

export function FormularioClasseI({
  value,
  tipo,
  onChange,
  operacao,
}: FormularioClasseIProps) {
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
      diasOperacao: calcularDias(),
      numeroRefIntermediarias: 2,
      descricao: "",
    }
  );

  const [valorTotal, setValorTotal] = useState<number | null>(null);
  const [detalhes, setDetalhes] = useState<string | null>(null);

  useEffect(() => {
    calcular();
  }, [params, tipo]);

  const calcular = useCallback(() => {
    const { efetivo, diasOperacao, numeroRefIntermediarias } = params;

    if (efetivo <= 0 || diasOperacao <= 0) {
      setValorTotal(null);
      setDetalhes(null);
      return;
    }

    const tipoRefeicao = tipo.nome as TipoRefeicao;

    const valorEtapa = VALORES_REFEICAO[tipoRefeicao];
    let resultado = {
      total: 0,
      detalhamento: { valorEtapa: 0, valorRefIntermediaria: 0 },
      memoriaCalculo: "",
    };
    if (valorEtapa) {
      resultado = calcularValorOperacao({
        efetivo,
        numeroRefIntermediarias,
        valorRefeicao: valorEtapa,
        tipoRefeicao: tipoRefeicao,
        diasOperacao,
        diasEtapaCompleta: MAX_DIAS_ETAPA,
      });
    }

    const detalhesCalculo = gerarCarimboCompleto({
      destinacao: `Destinado à ${operacao.nome}`,
      descricaoOperacao: `Aquisição de gêneros alimentícios (${tipoRefeicao})`,
      nomeOperacao: operacao.nome,
      resultado,
      tipoRefeicao,
    });

    setValorTotal(resultado.total);
    setDetalhes(detalhesCalculo);
    onChange({ params, valor: resultado.total, descricao: detalhesCalculo });
  }, [params, onChange, operacao.nome, tipo]);

  const handleChange = (
    field: keyof ParametrosClasseI,
    value: string | number
  ) => {
    setParams((prev) => ({ ...prev, [field]: value }));
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
            value={params.efetivo || ""}
            onChange={(e) =>
              handleChange("efetivo", parseInt(e.target.value) || 0)
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
            placeholder="Número de militares"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Duração da Operação (dias) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            value={params.diasOperacao || ""}
            onChange={(e) =>
              handleChange("diasOperacao", parseInt(e.target.value) || 0)
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
            placeholder="Dias totais da operação"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Número de etapas intermediárias{" "}
          <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="numeroRefIntermediarias"
              value="2"
              checked={params.numeroRefIntermediarias === 2}
              onChange={(e) =>
                handleChange(
                  "numeroRefIntermediarias",
                  parseInt(e.target.value)
                )
              }
              className="mr-2"
            />
            <span>2 etapas</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="numeroRefIntermediarias"
              value="3"
              checked={params.numeroRefIntermediarias === 3}
              onChange={(e) =>
                handleChange(
                  "numeroRefIntermediarias",
                  parseInt(e.target.value)
                )
              }
              className="mr-2"
            />
            <span>3 etapas</span>
          </label>
        </div>
      </div>

      <PreviewCalculo valorTotal={valorTotal} carimbo={detalhes} />
    </div>
  );
}
