"use client";

import { useState, useEffect, useMemo } from "react";
import { PreviewCalculo } from "../PreviewCalculo";
import { Plus, Trash2, AlertCircle } from "lucide-react";
import {
  ParametrosClasseVI,
  ItemEquipamentoEngenharia,
  TipoEquipamento,
  EQUIPAMENTOS,
  calcularClasseVI,
  listarTodosEquipamentos,
  getCustoHoraEfetivo,
  getNomeEquipamento,
} from "@/lib/calculos/classeVI";
import { HandleParametrosChange } from "../ModalCriarDespesa";
import type { OperacaoWithEfetivo, UserOM } from "@/types/despesas";

interface FormularioClasseVIProps {
  value: ParametrosClasseVI | null;
  onChange: (params: HandleParametrosChange) => void;
  operacao: OperacaoWithEfetivo;
  userOm: UserOM | null;
}

const FATOR_SEGURANCA = 1.1;

export function FormularioClasseVI({
  value,
  onChange,
  operacao,
  userOm,
}: FormularioClasseVIProps) {
  const [equipamentos, setEquipamentos] = useState<ItemEquipamentoEngenharia[]>(
    value?.equipamentos || []
  );

  const [valorTotal, setValorTotal] = useState<number | null>(null);
  const [carimbo, setCarimbo] = useState<string>("");
  const [carimboEditadoManualmente, setCarimboEditadoManualmente] =
    useState(false);

  // Estado para novo equipamento
  const [tipoEquipamentoSelecionado, setTipoEquipamentoSelecionado] =
    useState<TipoEquipamento | null>(null);
  const [nomeCustomizado, setNomeCustomizado] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [diasUso, setDiasUso] = useState(0);
  const [horasPorDia, setHorasPorDia] = useState(0);
  const [custoHora, setCustoHora] = useState(0);

  const diasTotaisOperacao = useMemo(() => {
    const inicio = new Date(operacao.dataInicio);
    const final = new Date(operacao.dataFinal);
    const diffTime = Math.abs(final.getTime() - inicio.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  }, [operacao.dataInicio, operacao.dataFinal]);

  // Estado para filtro de categoria
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<
    "GERADORES" | "EMBARCACOES" | "MAQUINAS_PESADAS" | "OUTRO"
  >("MAQUINAS_PESADAS");

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
      const resultado = calcularClasseVI(
        { equipamentos },
        userOm?.sigla,
        operacao.nome
      );
      setValorTotal(resultado.valorTotal);
      setCarimbo(resultado.carimbo);
      setCarimboEditadoManualmente(false);

      onChange({
        params: { equipamentos },
        valor: resultado.valorTotal,
        descricao: resultado.carimbo,
      });
    } catch (error) {
      console.error("Erro no cálculo:", error);
      setValorTotal(null);
      setCarimbo("");
    }
  };

  const handleTipoEquipamentoChange = (tipo: TipoEquipamento | null) => {
    setTipoEquipamentoSelecionado(tipo);
    if (tipo && tipo !== "OUTRO") {
      setCustoHora(EQUIPAMENTOS[tipo].totalHora);
      setNomeCustomizado("");
    } else {
      setCustoHora(0);
    }
  };

  const adicionarEquipamento = () => {
    if (tipoEquipamentoSelecionado === "OUTRO") {
      if (
        !nomeCustomizado ||
        quantidade <= 0 ||
        diasUso <= 0 ||
        horasPorDia <= 0 ||
        custoHora <= 0
      ) {
        return;
      }
    } else {
      if (
        !tipoEquipamentoSelecionado ||
        quantidade <= 0 ||
        diasUso <= 0 ||
        horasPorDia <= 0 ||
        custoHora <= 0
      ) {
        return;
      }
    }

    if (diasUso > diasTotaisOperacao) {
      alert(
        `O número de dias não pode exceder ${diasTotaisOperacao} dias (duração da operação)`
      );
      return;
    }

    let novoEquipamento: ItemEquipamentoEngenharia;

    if (tipoEquipamentoSelecionado === "OUTRO") {
      novoEquipamento = {
        tipoEquipamento: "OUTRO",
        nomeCustomizado,
        quantidade,
        diasUso,
        horasPorDia,
        custoHoraCustomizado: custoHora,
      };
    } else {
      const equipamentoPadrao = EQUIPAMENTOS[tipoEquipamentoSelecionado!];
      const isCustomizado = custoHora !== equipamentoPadrao.totalHora;

      novoEquipamento = {
        tipoEquipamento: tipoEquipamentoSelecionado!,
        quantidade,
        diasUso,
        horasPorDia,
        ...(isCustomizado && { custoHoraCustomizado: custoHora }),
      };
    }

    setEquipamentos([...equipamentos, novoEquipamento]);
    resetFormulario();
  };

  const resetFormulario = () => {
    setTipoEquipamentoSelecionado(null);
    setNomeCustomizado("");
    setQuantidade(1);
    setDiasUso(0);
    setHorasPorDia(0);
    setCustoHora(0);
  };

  const removerEquipamento = (index: number) => {
    setEquipamentos(equipamentos.filter((_, i) => i !== index));
  };

  const calcularCustoItem = (item: ItemEquipamentoEngenharia): number => {
    const custoHoraItem = getCustoHoraEfetivo(item);
    const horasTotais = item.diasUso * item.horasPorDia;
    return item.quantidade * custoHoraItem * horasTotais * FATOR_SEGURANCA;
  };

  const handleCarimboChange = (novoCarimbo: string) => {
    setCarimbo(novoCarimbo);
    setCarimboEditadoManualmente(true);

    onChange({
      params: { equipamentos },
      valor: valorTotal || 0,
      descricao: novoCarimbo,
    });
  };

  const handleResetCarimbo = () => {
    setCarimboEditadoManualmente(false);
    calcular();
  };

  const equipamentoSelecionadoInfo =
    tipoEquipamentoSelecionado && tipoEquipamentoSelecionado !== "OUTRO"
      ? EQUIPAMENTOS[tipoEquipamentoSelecionado]
      : null;

  return (
    <div className="space-y-4">
      {/* Informação sobre fator de segurança */}
      <div className="bg-amber-50 border border-amber-300 rounded-md p-3 flex items-start gap-2">
        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-amber-800">
          <p className="font-semibold">Fator de Segurança Obrigatório</p>
          <p className="mt-1">
            Todo cálculo aplica automaticamente o fator de segurança de{" "}
            {FATOR_SEGURANCA} (10% adicional).
          </p>
        </div>
      </div>

      {/* Formulário para adicionar equipamento */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 space-y-4">
        <p className="text-sm font-semibold text-blue-900">
          Adicionar Equipamento de Engenharia
        </p>

        {/* Seletor de categoria */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Categoria
          </label>
          <div className="flex flex-wrap gap-2">
            {(
              ["MAQUINAS_PESADAS", "EMBARCACOES", "GERADORES", "OUTRO"] as const
            ).map((categoria) => (
              <button
                key={categoria}
                type="button"
                onClick={() => {
                  setCategoriaSelecionada(categoria);
                  setTipoEquipamentoSelecionado(null);
                  setCustoHora(0);
                  setNomeCustomizado("");
                }}
                className={`px-3 py-1 text-xs rounded-md transition-all ${
                  categoriaSelecionada === categoria
                    ? "bg-blue-600 text-white"
                    : "bg-white border border-blue-300 text-blue-700 hover:bg-blue-100"
                }`}
              >
                {categoria === "MAQUINAS_PESADAS"
                  ? "Máquinas Pesadas"
                  : categoria === "EMBARCACOES"
                  ? "Embarcações"
                  : categoria === "GERADORES"
                  ? "Geradores"
                  : "Outro"}
              </button>
            ))}
          </div>
        </div>

        {/* Seleção de equipamento ou input customizado */}
        {categoriaSelecionada === "OUTRO" ? (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Nome do Equipamento <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nomeCustomizado}
              onChange={(e) => {
                setNomeCustomizado(e.target.value);
                setTipoEquipamentoSelecionado("OUTRO");
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
              placeholder="Ex: Compressor de ar"
            />
          </div>
        ) : (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Equipamento <span className="text-red-500">*</span>
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
              {equipamentosDisponiveis
                .filter((e) => e.info.categoria === categoriaSelecionada)
                .map((e) => (
                  <option key={e.tipo} value={e.tipo}>
                    {e.info.nome} - R$ {e.info.totalHora.toFixed(2)}/h
                  </option>
                ))}
            </select>
          </div>
        )}

        {/* Custo por hora editável */}
        {(tipoEquipamentoSelecionado || categoriaSelecionada === "OUTRO") && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Custo por Hora (R$/h) <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={custoHora || ""}
                onChange={(e) => setCustoHora(parseFloat(e.target.value) || 0)}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
                placeholder="0.00"
              />
              {equipamentoSelecionadoInfo &&
                custoHora !== equipamentoSelecionadoInfo.totalHora && (
                  <button
                    type="button"
                    onClick={() =>
                      setCustoHora(equipamentoSelecionadoInfo.totalHora)
                    }
                    className="text-xs text-blue-600 hover:text-blue-800 underline whitespace-nowrap"
                  >
                    Restaurar padrão
                  </button>
                )}
            </div>
            {equipamentoSelecionadoInfo && (
              <p className="text-xs text-gray-500 mt-1">
                Valor padrão: R${" "}
                {equipamentoSelecionadoInfo.totalHora.toFixed(2)}/h (Peças: R${" "}
                {equipamentoSelecionadoInfo.pecasInsumos.toFixed(2)} + Sv Mnt:
                R$ {equipamentoSelecionadoInfo.svMnt.toFixed(2)})
              </p>
            )}
          </div>
        )}

        {/* Quantidade, dias e horas */}
        <div className="grid grid-cols-3 gap-3">
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

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Horas/dia <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0.5"
              step="0.5"
              value={horasPorDia || ""}
              onChange={(e) => setHorasPorDia(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
              placeholder="0"
            />
          </div>
        </div>

        {/* Preview do custo */}
        {custoHora > 0 && quantidade > 0 && diasUso > 0 && horasPorDia > 0 && (
          <div className="bg-white rounded p-2 text-xs text-gray-600">
            <p>
              <strong>Custo estimado:</strong> {quantidade} × R${" "}
              {custoHora.toFixed(2)}/h × {diasUso} dias × {horasPorDia}h/dia × {FATOR_SEGURANCA} ={" "}
              <span className="font-semibold text-green-700">
                R${" "}
                {(quantidade * custoHora * diasUso * horasPorDia * FATOR_SEGURANCA).toFixed(
                  2
                )}
              </span>
              {equipamentoSelecionadoInfo &&
                custoHora !== equipamentoSelecionadoInfo.totalHora && (
                  <span className="ml-2 text-amber-600">
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
            (categoriaSelecionada === "OUTRO"
              ? !nomeCustomizado
              : !tipoEquipamentoSelecionado) ||
            quantidade <= 0 ||
            diasUso <= 0 ||
            horasPorDia <= 0 ||
            custoHora <= 0
          }
          className="w-full px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Adicionar Equipamento
        </button>
      </div>

      {/* Lista de equipamentos adicionados */}
      {equipamentos.length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Equipamentos Adicionados
          </label>
          {equipamentos.map((item, index) => {
            const custoHoraItem = getCustoHoraEfetivo(item);
            const horasTotais = item.diasUso * item.horasPorDia;
            const custoItem = calcularCustoItem(item);
            const nomeEquip = getNomeEquipamento(item);
            const isCustomizado = item.custoHoraCustomizado !== undefined;

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
                      {item.tipoEquipamento === "OUTRO" && (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                          Outro
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-600">
                      <p className="font-medium">
                        {item.quantidade}x {nomeEquip}
                      </p>
                      <p>
                        R$ {custoHoraItem.toFixed(2)}/h × {item.diasUso} dias × {item.horasPorDia}h/dia × {FATOR_SEGURANCA}
                      </p>
                      <p className="text-gray-500">
                        (Total: {horasTotais}h)
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

      {/* Preview do cálculo total */}
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
          className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm resize-y min-h-[150px] focus:ring-2 focus:ring-green-600 focus:border-transparent"
          placeholder="A memória de cálculo será gerada automaticamente..."
        />

        <p className="text-xs text-gray-500">
          Este texto documenta o cálculo da despesa. Edite se necessário.
        </p>
      </div>
    </div>
  );
}
