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
import type { OperacaoWithEfetivo, UserOM, NaturezaSelect, RateioNatureza } from "@/types/despesas";

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
  userOm: UserOM | null;
  planoOm: UserOM | null;
  naturezas: NaturezaSelect[];
  rateioNaturezas: RateioNatureza[];
}

export function FormularioClasseI({
  value,
  tipo,
  onChange,
  operacao,
  userOm,
  planoOm,
  naturezas,
  rateioNaturezas,
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
  const [carimbo, setCarimbo] = useState<string>("");
  const [carimboEditadoManualmente, setCarimboEditadoManualmente] =
    useState(false);

  // Mapear naturezas selecionadas para códigos
  const getNaturezasCodigos = useCallback(() => {
    return rateioNaturezas
      .map(rateio => naturezas.find(n => n.id === rateio.naturezaId)?.codigo)
      .filter((codigo): codigo is string => codigo !== undefined);
  }, [rateioNaturezas, naturezas]);

  useEffect(() => {
    calcular();
  }, [params, tipo, rateioNaturezas]);

  const calcular = useCallback(() => {
    const { efetivo, diasOperacao, numeroRefIntermediarias } = params;

    if (efetivo <= 0 || diasOperacao <= 0) {
      setValorTotal(null);
      setCarimbo("");
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

    // Usar planoOm ao invés de userOm, e passar naturezas selecionadas
    const detalhesCalculo = gerarCarimboCompleto({
      unidade: planoOm?.sigla || "OM não identificada",
      nomeOperacao: operacao.nome,
      efetivo,
      resultado,
      tipoRefeicao,
      naturezas: getNaturezasCodigos(),
    });

    setValorTotal(resultado.total);

    // Sempre regenerar carimbo dos parâmetros
    setCarimbo(detalhesCalculo);
    setCarimboEditadoManualmente(false);

    onChange({ params, valor: resultado.total, descricao: detalhesCalculo });
  }, [params, onChange, operacao.nome, tipo, planoOm, getNaturezasCodigos]);

  const handleChange = (
    field: keyof ParametrosClasseI,
    value: string | number
  ) => {
    let finalValue = value;

    if (field === "diasOperacao" && typeof value === "number") {
      const maxDias = calcularDias();
      finalValue = Math.min(value, maxDias);
    }

    setParams((prev) => ({ ...prev, [field]: finalValue }));
  };

  const handleCarimboChange = (novoCarimbo: string) => {
    setCarimbo(novoCarimbo);
    setCarimboEditadoManualmente(true);

    onChange({
      params,
      valor: valorTotal || 0,
      descricao: novoCarimbo,
    });
  };

  const handleResetCarimbo = () => {
    setCarimboEditadoManualmente(false);
    calcular();
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
            step="1"
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
            max={calcularDias()}
            step="1"
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
          Número de refeições intermediárias{" "}
          <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="numeroRefIntermediarias"
              value="0"
              checked={params.numeroRefIntermediarias === 0}
              onChange={(e) =>
                handleChange(
                  "numeroRefIntermediarias",
                  parseInt(e.target.value)
                )
              }
              className="mr-2"
            />
            0
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="numeroRefIntermediarias"
              value="1"
              checked={params.numeroRefIntermediarias === 1}
              onChange={(e) =>
                handleChange(
                  "numeroRefIntermediarias",
                  parseInt(e.target.value)
                )
              }
              className="mr-2"
            />
            1
          </label>
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
            2
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
            3
          </label>
        </div>
      </div>

      <PreviewCalculo valorTotal={valorTotal} />

      {/* Carimbo editável */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            Carimbo
          </label>
          {carimboEditadoManualmente && (
            <button
              type="button"
              onClick={handleResetCarimbo}
              className="text-xs text-blue-600 hover:text-blue-800 underline"
            >
              Restaurar automático
            </button>
          )}
        </div>

        <textarea
          value={carimbo || ""}
          disabled={true}
          onChange={(e) => handleCarimboChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm resize-y min-h-[200px] focus:ring-2 focus:ring-green-600 focus:border-transparent"
          placeholder="O carimbo será gerado automaticamente..."
        />

        <p className="text-xs text-gray-500">
          Este texto será usado como justificativa da despesa. Edite se
          necessário.
        </p>
      </div>
    </div>
  );
}
