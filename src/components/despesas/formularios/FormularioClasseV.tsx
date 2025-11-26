"use client";

import { useState, useEffect, useMemo } from "react";
import { PreviewCalculo } from "../PreviewCalculo";
import { Plus, Trash2 } from "lucide-react";
import {
  ParametrosClasseV,
  ItemArmamento,
  TipoArmamento,
  ARMAMENTOS,
  calcularClasseV,
  listarTodosArmamentos,
  getCustoDiaEfetivo,
} from "@/lib/calculos/classeV";
import { HandleParametrosChange } from "../ModalCriarDespesa";
import type { OperacaoWithEfetivo, UserOM } from "@/types/despesas";

interface FormularioClasseVProps {
  value: ParametrosClasseV | null;
  onChange: (params: HandleParametrosChange) => void;
  operacao: OperacaoWithEfetivo;
  userOm: UserOM | null;
}

export function FormularioClasseV({
  value,
  onChange,
  operacao,
  userOm,
}: FormularioClasseVProps) {
  // Calcular dias totais da operação
  const diasTotaisOperacao = useMemo(() => {
    const inicio = new Date(operacao.dataInicio);
    const final = new Date(operacao.dataFinal);
    const diffTime = Math.abs(final.getTime() - inicio.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  }, [operacao.dataInicio, operacao.dataFinal]);

  const [armamentos, setArmamentos] = useState<ItemArmamento[]>(
    value?.armamentos || []
  );

  const [valorTotal, setValorTotal] = useState<number | null>(null);
  const [carimbo, setCarimbo] = useState<string>("");
  const [carimboEditadoManualmente, setCarimboEditadoManualmente] = useState(false);

  // Estado para novo item de armamento
  const [tipoArmamentoSelecionado, setTipoArmamentoSelecionado] =
    useState<TipoArmamento | null>(null);
  const [quantidade, setQuantidade] = useState(1);
  const [diasUso, setDiasUso] = useState(0);
  const [custoMntDia, setCustoMntDia] = useState<number>(0);

  const armamentosDisponiveis = listarTodosArmamentos();

  useEffect(() => {
    calcular();
  }, [armamentos]);

  const calcular = () => {
    if (armamentos.length === 0) {
      setValorTotal(null);
      setCarimbo("");
      return;
    }

    try {
      const resultado = calcularClasseV(
        { armamentos },
        userOm?.sigla,
        operacao.nome
      );
      setValorTotal(resultado.valorTotal);
      setCarimbo(resultado.detalhamento);
      setCarimboEditadoManualmente(false);
      onChange({
        params: { armamentos },
        valor: resultado.valorTotal,
        descricao: resultado.detalhamento,
      });
    } catch (error) {
      console.error("Erro no cálculo:", error);
      setValorTotal(null);
      setCarimbo("");
    }
  };

  const handleCarimboChange = (novoCarimbo: string) => {
    setCarimbo(novoCarimbo);
    setCarimboEditadoManualmente(true);
    onChange({ params: { armamentos }, valor: valorTotal || 0, descricao: novoCarimbo });
  };

  const handleResetCarimbo = () => {
    setCarimboEditadoManualmente(false);
    calcular();
  };

  const adicionarArmamento = () => {
    if (
      !tipoArmamentoSelecionado ||
      quantidade <= 0 ||
      diasUso <= 0 ||
      custoMntDia <= 0
    ) {
      return;
    }

    if (diasUso > diasTotaisOperacao) {
      alert(
        `O número de dias não pode exceder ${diasTotaisOperacao} dias (duração da operação)`
      );
      return;
    }

    const armamentoPadrao = ARMAMENTOS[tipoArmamentoSelecionado];
    const isCustomizado = custoMntDia !== armamentoPadrao.custoMntDiaOpMil;

    const novoArmamento: ItemArmamento = {
      tipoArmamento: tipoArmamentoSelecionado,
      quantidade,
      diasUso,
      ...(isCustomizado && { custoMntDiaCustomizado: custoMntDia }),
    };

    setArmamentos([...armamentos, novoArmamento]);
    resetFormulario();
  };

  const resetFormulario = () => {
    setTipoArmamentoSelecionado(null);
    setQuantidade(1);
    setDiasUso(0);
    setCustoMntDia(0);
  };

  const handleTipoArmamentoChange = (tipo: TipoArmamento | null) => {
    setTipoArmamentoSelecionado(tipo);
    if (tipo) {
      setCustoMntDia(ARMAMENTOS[tipo].custoMntDiaOpMil);
    } else {
      setCustoMntDia(0);
    }
  };

  const removerArmamento = (index: number) => {
    setArmamentos(armamentos.filter((_, i) => i !== index));
  };

  const calcularCustoItem = (item: ItemArmamento): number => {
    const custoDia = getCustoDiaEfetivo(item);
    return item.quantidade * custoDia * item.diasUso;
  };

  const armamentoSelecionadoInfo = tipoArmamentoSelecionado
    ? ARMAMENTOS[tipoArmamentoSelecionado]
    : null;

  return (
    <div className="space-y-4">
      {/* Lista de armamentos adicionados */}
      {armamentos.length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Armamentos Adicionados
          </label>
          {armamentos.map((item, index) => {
            const armamento = ARMAMENTOS[item.tipoArmamento];
            const custoDia = getCustoDiaEfetivo(item);
            const custoItem = calcularCustoItem(item);
            const isCustomizado = item.custoMntDiaCustomizado !== undefined;

            return (
              <div
                key={index}
                className="bg-gray-50 border border-gray-200 rounded-md p-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-amber-100 text-amber-800">
                        {armamento.categoria}
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        R$ {custoItem.toFixed(2)}
                      </span>
                      {isCustomizado && (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          Customizado
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-600">
                      <p className="font-medium">
                        {item.quantidade}x {armamento.nome}
                      </p>
                      <p>
                        R$ {custoDia.toFixed(2)}/dia × {item.diasUso} dias
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removerArmamento(index)}
                    className="ml-2 p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Remover armamento"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Formulário para adicionar armamento */}
      <div className="bg-amber-50 border border-amber-200 rounded-md p-4 space-y-3">
        <p className="text-sm font-semibold text-amber-900">
          Adicionar Armamento
        </p>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Tipo de Armamento <span className="text-red-500">*</span>
          </label>
          <select
            value={tipoArmamentoSelecionado || ""}
            onChange={(e) =>
              handleTipoArmamentoChange(
                (e.target.value as TipoArmamento) || null
              )
            }
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
          >
            <option value="">Selecione um armamento</option>
            <optgroup label="Armamento Leve (Armt L)">
              {armamentosDisponiveis
                .filter((a) => a.info.categoria === "ARMT_L")
                .map((a) => (
                  <option key={a.tipo} value={a.tipo}>
                    {a.info.nome} - R$ {a.info.custoMntDiaOpMil.toFixed(2)}/dia
                  </option>
                ))}
            </optgroup>
            <optgroup label="Armamento Pesado (Armt P)">
              {armamentosDisponiveis
                .filter((a) => a.info.categoria === "ARMT_P")
                .map((a) => (
                  <option key={a.tipo} value={a.tipo}>
                    {a.info.nome} - R$ {a.info.custoMntDiaOpMil.toFixed(2)}/dia
                  </option>
                ))}
            </optgroup>
            <optgroup label="IODCT">
              {armamentosDisponiveis
                .filter((a) => a.info.categoria === "IODCT")
                .map((a) => (
                  <option key={a.tipo} value={a.tipo}>
                    {a.info.nome} - R$ {a.info.custoMntDiaOpMil.toFixed(2)}/dia
                  </option>
                ))}
            </optgroup>
            <optgroup label="DQBRN">
              {armamentosDisponiveis
                .filter((a) => a.info.categoria === "DQBRN")
                .map((a) => (
                  <option key={a.tipo} value={a.tipo}>
                    {a.info.nome} - R$ {a.info.custoMntDiaOpMil.toFixed(2)}/dia
                  </option>
                ))}
            </optgroup>
          </select>
        </div>

        {armamentoSelecionadoInfo && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Custo Manutenção/Dia (R$) <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={custoMntDia || ""}
                onChange={(e) =>
                  setCustoMntDia(parseFloat(e.target.value) || 0)
                }
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
                placeholder="0.00"
              />
              {custoMntDia !== armamentoSelecionadoInfo.custoMntDiaOpMil && (
                <button
                  type="button"
                  onClick={() =>
                    setCustoMntDia(armamentoSelecionadoInfo.custoMntDiaOpMil)
                  }
                  className="text-xs text-blue-600 hover:text-blue-800 underline whitespace-nowrap"
                >
                  Restaurar padrão
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Valor padrão: R${" "}
              {armamentoSelecionadoInfo.custoMntDiaOpMil.toFixed(2)}/dia
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Quantidade <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={quantidade || ""}
              onChange={(e) => setQuantidade(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
              placeholder="1"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Dias de uso <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              max={diasTotaisOperacao}
              step="1"
              value={diasUso || ""}
              onChange={(e) => {
                const valor = parseInt(e.target.value) || 0;
                setDiasUso(Math.min(valor, diasTotaisOperacao));
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
              placeholder={`Máx: ${diasTotaisOperacao}`}
            />
          </div>
        </div>

        {armamentoSelecionadoInfo &&
          quantidade > 0 &&
          diasUso > 0 &&
          custoMntDia > 0 && (
            <div className="bg-white rounded p-2 text-xs text-gray-600">
              <p>
                <strong>Custo estimado:</strong> {quantidade} × R${" "}
                {custoMntDia.toFixed(2)} × {diasUso} dias ={" "}
                <span className="font-semibold text-green-700">
                  R$ {(quantidade * custoMntDia * diasUso).toFixed(2)}
                </span>
                {custoMntDia !== armamentoSelecionadoInfo.custoMntDiaOpMil && (
                  <span className="ml-2 text-amber-600">
                    (custo customizado)
                  </span>
                )}
              </p>
            </div>
          )}

        <button
          type="button"
          onClick={adicionarArmamento}
          disabled={
            !tipoArmamentoSelecionado ||
            quantidade <= 0 ||
            diasUso <= 0 ||
            custoMntDia <= 0
          }
          className="w-full px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Adicionar Armamento
        </button>
      </div>

      {/* Preview do cálculo */}
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
          onChange={(e) => handleCarimboChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm resize-y min-h-[200px] focus:ring-2 focus:ring-green-600 focus:border-transparent"
          placeholder="O carimbo será gerado automaticamente..."
        />

        <p className="text-xs text-gray-500">
          Este texto será usado como justificativa da despesa. Edite se necessário.
        </p>
      </div>
    </div>
  );
}
