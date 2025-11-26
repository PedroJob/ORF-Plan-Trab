"use client";

import { useState, useEffect, useMemo } from "react";
import { PreviewCalculo } from "../PreviewCalculo";
import { Plus, Trash2 } from "lucide-react";
import {
  ParametrosClasseVII,
  ItemEquipamento,
  TipoEquipamento,
  EQUIPAMENTOS,
  calcularClasseVII,
  listarTodosEquipamentos,
  getCustoDiaEfetivo,
} from "@/lib/calculos/classeVII";
import { HandleParametrosChange } from "../ModalCriarDespesa";
import type { OperacaoWithEfetivo, UserOM } from "@/types/despesas";

interface FormularioClasseVIIProps {
  value: ParametrosClasseVII | null;
  onChange: (params: HandleParametrosChange) => void;
  operacao: OperacaoWithEfetivo;
  userOm: UserOM | null;
}

export function FormularioClasseVII({
  value,
  onChange,
  operacao,
  userOm,
}: FormularioClasseVIIProps) {
  const diasTotaisOperacao = useMemo(() => {
    const inicio = new Date(operacao.dataInicio);
    const final = new Date(operacao.dataFinal);
    const diffTime = Math.abs(final.getTime() - inicio.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  }, [operacao.dataInicio, operacao.dataFinal]);

  const [equipamentos, setEquipamentos] = useState<ItemEquipamento[]>(
    value?.equipamentos || []
  );

  const [valorTotal, setValorTotal] = useState<number | null>(null);
  const [carimbo, setCarimbo] = useState<string>("");
  const [carimboEditadoManualmente, setCarimboEditadoManualmente] = useState(false);

  const [tipoEquipamentoSelecionado, setTipoEquipamentoSelecionado] =
    useState<TipoEquipamento | null>(null);
  const [quantidade, setQuantidade] = useState(1);
  const [diasUso, setDiasUso] = useState(0);
  const [custoMntDia, setCustoMntDia] = useState<number>(0);

  const equipamentosDisponiveis = listarTodosEquipamentos();

  useEffect(() => {
    calcular();
  }, [equipamentos]);

  const calcular = () => {
    if (equipamentos.length === 0) {
      setValorTotal(null);
      setCarimbo("");
      return;
    }

    try {
      const resultado = calcularClasseVII(
        { equipamentos },
        userOm?.sigla,
        operacao.nome
      );
      setValorTotal(resultado.valorTotal);
      setCarimbo(resultado.detalhamento);
      setCarimboEditadoManualmente(false);
      onChange({
        params: { equipamentos },
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
    onChange({ params: { equipamentos }, valor: valorTotal || 0, descricao: novoCarimbo });
  };

  const handleResetCarimbo = () => {
    setCarimboEditadoManualmente(false);
    calcular();
  };

  const adicionarEquipamento = () => {
    if (
      !tipoEquipamentoSelecionado ||
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

    const equipamentoPadrao = EQUIPAMENTOS[tipoEquipamentoSelecionado];
    const isCustomizado = custoMntDia !== equipamentoPadrao.custoMntDia;

    const novoEquipamento: ItemEquipamento = {
      tipoEquipamento: tipoEquipamentoSelecionado,
      quantidade,
      diasUso,
      ...(isCustomizado && { custoMntDiaCustomizado: custoMntDia }),
    };

    setEquipamentos([...equipamentos, novoEquipamento]);
    resetFormulario();
  };

  const resetFormulario = () => {
    setTipoEquipamentoSelecionado(null);
    setQuantidade(1);
    setDiasUso(0);
    setCustoMntDia(0);
  };

  const handleTipoEquipamentoChange = (tipo: TipoEquipamento | null) => {
    setTipoEquipamentoSelecionado(tipo);
    if (tipo) {
      setCustoMntDia(EQUIPAMENTOS[tipo].custoMntDia);
    } else {
      setCustoMntDia(0);
    }
  };

  const removerEquipamento = (index: number) => {
    setEquipamentos(equipamentos.filter((_, i) => i !== index));
  };

  const calcularCustoItem = (item: ItemEquipamento): number => {
    const custoDia = getCustoDiaEfetivo(item);
    return item.quantidade * custoDia * item.diasUso;
  };

  const equipamentoSelecionadoInfo = tipoEquipamentoSelecionado
    ? EQUIPAMENTOS[tipoEquipamentoSelecionado]
    : null;

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 space-y-3">
        <p className="text-sm font-semibold text-blue-900">
          Adicionar Equipamento
        </p>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Tipo de Equipamento <span className="text-red-500">*</span>
          </label>
          <select
            value={tipoEquipamentoSelecionado || ""}
            onChange={(e) =>
              handleTipoEquipamentoChange(
                (e.target.value as TipoEquipamento) || null
              )
            }
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
          >
            <option value="">Selecione um equipamento</option>
            {equipamentosDisponiveis.map((e) => (
              <option key={e.tipo} value={e.tipo}>
                {e.info.nome} - R$ {e.info.custoMntDia.toFixed(2)}/dia
              </option>
            ))}
          </select>
        </div>

        {equipamentoSelecionadoInfo && (
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
              {custoMntDia !== equipamentoSelecionadoInfo.custoMntDia && (
                <button
                  type="button"
                  onClick={() =>
                    setCustoMntDia(equipamentoSelecionadoInfo.custoMntDia)
                  }
                  className="text-xs text-blue-600 hover:text-blue-800 underline whitespace-nowrap"
                >
                  Restaurar padrão
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Valor padrão: R${" "}
              {equipamentoSelecionadoInfo.custoMntDia.toFixed(2)}/dia
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

        {equipamentoSelecionadoInfo &&
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
                {custoMntDia !== equipamentoSelecionadoInfo.custoMntDia && (
                  <span className="ml-2 text-blue-600">
                    (custo customizado)
                  </span>
                )}
              </p>
            </div>
          )}

        <button
          type="button"
          onClick={adicionarEquipamento}
          disabled={
            !tipoEquipamentoSelecionado ||
            quantidade <= 0 ||
            diasUso <= 0 ||
            custoMntDia <= 0
          }
          className="w-full px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Adicionar Equipamento
        </button>
      </div>

      {equipamentos.length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Equipamentos Adicionados
          </label>
          {equipamentos.map((item, index) => {
            const equipamento = EQUIPAMENTOS[item.tipoEquipamento];
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
                        {item.quantidade}x {equipamento.nome}
                      </p>
                      <p>
                        R$ {custoDia.toFixed(2)}/dia × {item.diasUso} dias
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removerEquipamento(index)}
                    className="ml-2 p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Remover equipamento"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
