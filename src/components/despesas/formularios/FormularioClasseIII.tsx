"use client";

import { useState, useEffect, useMemo } from "react";
import { PreviewCalculo } from "../PreviewCalculo";
import { Plus, X, Trash2 } from "lucide-react";
import { HandleParametrosChange } from "../ModalCriarDespesa";
import { Tipo } from "@prisma/client";
import type { OperacaoWithEfetivo, UserOM } from "@/types/despesas";
import {
  calcularClasseIII,
  ParametrosClasseIII,
  ItemClasseIII,
  TipoCombustivel,
  Viatura,
  Equipamento,
  filtrarViaturasPorCombustivel,
  filtrarEquipamentosPorCombustivel,
  PRECOS_COMBUSTIVEL,
} from "@/lib/calculos/classeIII";

interface FormularioClasseIIIProps {
  tipoSelecionado: Tipo;
  operacao: OperacaoWithEfetivo;
  value: ParametrosClasseIII | null;
  onChange: (params: HandleParametrosChange) => void;
  userOm: UserOM | null;
}

export function FormularioClasseIII({
  tipoSelecionado,
  operacao,
  value,
  onChange,
  userOm,
}: FormularioClasseIIIProps) {
  // Mapear tipo do banco para tipo de combustível
  const getTipoCombustivel = (): TipoCombustivel => {
    const nomeTipo = tipoSelecionado.nome.toUpperCase();
    if (nomeTipo.includes("DIESEL") || nomeTipo.includes("OD")) return "OD";
    if (nomeTipo.includes("GASOLINA") || nomeTipo.includes("GC")) return "GAS";
    return "GAS";
  };

  const tipoCombustivel = getTipoCombustivel();

  // Calcular dias totais da operação
  const diasTotaisOperacao = useMemo(() => {
    const inicio = new Date(operacao.dataInicio);
    const final = new Date(operacao.dataFinal);
    const diffTime = Math.abs(final.getTime() - inicio.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  }, [operacao.dataInicio, operacao.dataFinal]);

  const [itens, setItens] = useState<ItemClasseIII[]>(value?.itens || []);
  const [precoCombustivelCustomizado, setPrecoCombustivelCustomizado] =
    useState<number | undefined>(value?.precoCombustivelCustomizado);
  const [usarPrecoCustomizado, setUsarPrecoCustomizado] = useState<boolean>(
    value?.precoCombustivelCustomizado !== undefined
  );
  const [valorTotal, setValorTotal] = useState<number | null>(null);
  const [valorCombustivel, setValorCombustivel] = useState<number | null>(null);
  const [carimbo, setCarimbo] = useState<string>("");
  const [carimboEditadoManualmente, setCarimboEditadoManualmente] =
    useState(false);

  // Estado para adicionar novo item
  const [showFormulario, setShowFormulario] = useState(false);
  const [tipoItemSelecionado, setTipoItemSelecionado] = useState<
    "VIATURA" | "EQUIPAMENTO" | null
  >(null);

  // Viaturas e equipamentos disponíveis (filtrados por combustível)
  const viaturasDisponiveis = filtrarViaturasPorCombustivel(tipoCombustivel);
  const equipamentosDisponiveis =
    filtrarEquipamentosPorCombustivel(tipoCombustivel);

  // Estado para novo item de viatura
  const [viaturaSelecionada, setViaturaSelecionada] = useState<Viatura | null>(
    null
  );
  const [quantidadeViatura, setQuantidadeViatura] = useState(1);
  const [kmMedioDiario, setKmMedioDiario] = useState(0);
  const [diasUsoViatura, setDiasUsoViatura] = useState(0);

  // Estado para novo item de equipamento
  const [equipamentoSelecionado, setEquipamentoSelecionado] =
    useState<Equipamento | null>(null);
  const [quantidadeEquipamento, setQuantidadeEquipamento] = useState(1);
  const [horasMediaDiaria, setHorasMediaDiaria] = useState(0);
  const [diasUsoEquipamento, setDiasUsoEquipamento] = useState(0);

  useEffect(() => {
    calcular();
  }, [itens, precoCombustivelCustomizado, usarPrecoCustomizado]);

  const calcular = () => {
    if (itens.length === 0) {
      setValorTotal(null);
      setValorCombustivel(null);
      setCarimbo("");
      return;
    }

    try {
      const resultado = calcularClasseIII(
        {
          itens,
          tipoCombustivel,
          precoCombustivelCustomizado: usarPrecoCustomizado
            ? precoCombustivelCustomizado
            : undefined,
        },
        userOm?.sigla,
        operacao.nome
      );
      setValorTotal(resultado.valorTotal);
      setValorCombustivel(resultado.valorCombustivel);

      // Sempre regenerar carimbo dos parâmetros
      setCarimbo(resultado.carimbo);
      setCarimboEditadoManualmente(false);

      onChange({
        params: {
          itens,
          tipoCombustivel,
          precoCombustivelCustomizado: usarPrecoCustomizado
            ? precoCombustivelCustomizado
            : undefined,
        },
        valor: resultado.valorTotal,
        valorCombustivel: resultado.valorCombustivel,
        descricao: resultado.carimbo,
      });
    } catch (error) {
      console.error("Erro no cálculo:", error);
      setValorTotal(null);
      setValorCombustivel(null);
      setCarimbo(error instanceof Error ? error.message : "Erro desconhecido");
    }
  };

  const adicionarViatura = () => {
    if (
      !viaturaSelecionada ||
      quantidadeViatura <= 0 ||
      kmMedioDiario <= 0 ||
      diasUsoViatura <= 0
    ) {
      alert("Preencha todos os campos obrigatórios");
      return;
    }

    if (diasUsoViatura > diasTotaisOperacao) {
      alert(
        `O número de dias não pode exceder ${diasTotaisOperacao} dias (duração da operação)`
      );
      return;
    }

    const novoItem: ItemClasseIII = {
      tipoItem: "VIATURA",
      viatura: viaturaSelecionada,
      quantidade: quantidadeViatura,
      kmMedioDiario,
      diasUso: diasUsoViatura,
    };

    setItens([...itens, novoItem]);
    resetFormulario();
  };

  const adicionarEquipamento = () => {
    if (
      !equipamentoSelecionado ||
      quantidadeEquipamento <= 0 ||
      horasMediaDiaria <= 0 ||
      diasUsoEquipamento <= 0
    ) {
      alert("Preencha todos os campos obrigatórios");
      return;
    }

    if (diasUsoEquipamento > diasTotaisOperacao) {
      alert(
        `O número de dias não pode exceder ${diasTotaisOperacao} dias (duração da operação)`
      );
      return;
    }

    const novoItem: ItemClasseIII = {
      tipoItem: "EQUIPAMENTO",
      equipamento: equipamentoSelecionado,
      quantidade: quantidadeEquipamento,
      horasMediaDiaria,
      diasUso: diasUsoEquipamento,
    };

    setItens([...itens, novoItem]);
    resetFormulario();
  };

  const resetFormulario = () => {
    setShowFormulario(false);
    setTipoItemSelecionado(null);
    setViaturaSelecionada(null);
    setQuantidadeViatura(1);
    setKmMedioDiario(0);
    setDiasUsoViatura(0);
    setEquipamentoSelecionado(null);
    setQuantidadeEquipamento(1);
    setHorasMediaDiaria(0);
    setDiasUsoEquipamento(0);
  };

  const removerItem = (index: number) => {
    setItens(itens.filter((_, i) => i !== index));
  };

  const calcularConsumoItem = (item: ItemClasseIII): number => {
    if (item.tipoItem === "VIATURA") {
      const kmTotal = item.kmMedioDiario * item.diasUso;
      return (kmTotal / item.viatura.consumoKmL) * item.quantidade;
    } else {
      const horasTotal = item.horasMediaDiaria * item.diasUso;
      return item.equipamento.consumoLH * horasTotal * item.quantidade;
    }
  };

  const getNomeTipoCombustivel = (): string => {
    switch (tipoCombustivel) {
      case "OD":
        return "Óleo Diesel";
      case "GAS":
        return "Gasolina";
    }
  };

  const handleCarimboChange = (novoCarimbo: string) => {
    setCarimbo(novoCarimbo);
    setCarimboEditadoManualmente(true);

    onChange({
      params: {
        itens,
        tipoCombustivel,
        precoCombustivelCustomizado: usarPrecoCustomizado
          ? precoCombustivelCustomizado
          : undefined,
      },
      valor: valorTotal || 0,
      valorCombustivel: valorCombustivel || 0,
      descricao: novoCarimbo,
    });
  };

  const handleResetCarimbo = () => {
    setCarimboEditadoManualmente(false);
    calcular();
  };

  const handleTogglePrecoCustomizado = () => {
    if (usarPrecoCustomizado) {
      setUsarPrecoCustomizado(false);
      setPrecoCombustivelCustomizado(undefined);
    } else {
      setUsarPrecoCustomizado(true);
      setPrecoCombustivelCustomizado(PRECOS_COMBUSTIVEL[tipoCombustivel]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Info sobre combustível e preço */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm">
        <p className="text-blue-800 font-medium mb-1">
          Tipo de Combustível: {getNomeTipoCombustivel()}
        </p>
        <p className="text-blue-700 text-xs">
          Duração da operação: {diasTotaisOperacao} dias
        </p>
        <p className="text-blue-700 text-xs">
          Fator de segurança: 1,3 (30% adicional)
        </p>
      </div>

      {/* Configuração de preço do combustível */}
      <div className="bg-gray-50 border border-gray-200 rounded-md p-3 space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            Preço do Combustível
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={usarPrecoCustomizado}
              onChange={handleTogglePrecoCustomizado}
              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            Usar preço customizado
          </label>
        </div>

        {usarPrecoCustomizado ? (
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">R$</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={precoCombustivelCustomizado || ""}
                onChange={(e) =>
                  setPrecoCombustivelCustomizado(
                    parseFloat(e.target.value) || 0
                  )
                }
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
                placeholder="0.00"
              />
              <span className="text-sm text-gray-600">/ litro</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Preço médio nacional: R${" "}
              {PRECOS_COMBUSTIVEL[tipoCombustivel].toFixed(2)}/litro
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-600">
            Usando preço médio nacional: R${" "}
            {PRECOS_COMBUSTIVEL[tipoCombustivel].toFixed(2)}/litro
          </p>
        )}
      </div>

      {/* Adicionar novo item */}
      <div className="border-t pt-4">
        {!showFormulario ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adicionar Item
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setTipoItemSelecionado("VIATURA");
                  setShowFormulario(true);
                }}
                className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                disabled={viaturasDisponiveis.length === 0}
              >
                <Plus className="w-4 h-4 inline mr-2" />
                Viatura
              </button>
              <button
                type="button"
                onClick={() => {
                  setTipoItemSelecionado("EQUIPAMENTO");
                  setShowFormulario(true);
                }}
                className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                disabled={equipamentosDisponiveis.length === 0}
              >
                <Plus className="w-4 h-4 inline mr-2" />
                Equipamento
              </button>
            </div>
            {viaturasDisponiveis.length === 0 &&
              equipamentosDisponiveis.length === 0 && (
                <p className="text-xs text-red-600 mt-2">
                  Não há viaturas ou equipamentos compatíveis com{" "}
                  {getNomeTipoCombustivel()}
                </p>
              )}
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-blue-900">
                {tipoItemSelecionado === "VIATURA"
                  ? "Adicionar Viatura"
                  : "Adicionar Equipamento"}
              </h4>
              <button
                type="button"
                onClick={resetFormulario}
                className="p-1 text-gray-600 hover:bg-white rounded"
                title="Cancelar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {tipoItemSelecionado === "VIATURA" ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Viatura <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={viaturaSelecionada?.exemplo || ""}
                    onChange={(e) => {
                      const viatura = viaturasDisponiveis.find(
                        (v) => v.exemplo === e.target.value
                      );
                      setViaturaSelecionada(viatura || null);
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
                  >
                    <option value="">Selecione uma viatura</option>
                    {viaturasDisponiveis.map((v, i) => (
                      <option key={i} value={v.exemplo}>
                        {v.exemplo} ({v.nome}) - {v.consumoKmL} km/L
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Quantidade <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={quantidadeViatura || ""}
                    onChange={(e) =>
                      setQuantidadeViatura(parseInt(e.target.value) || 0)
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
                    placeholder="1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Média de Km percorridos por dia{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={kmMedioDiario || ""}
                      onChange={(e) =>
                        setKmMedioDiario(parseInt(e.target.value) || 0)
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
                      placeholder="0"
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
                      value={diasUsoViatura || ""}
                      onChange={(e) => {
                        const valor = parseInt(e.target.value) || 0;
                        setDiasUsoViatura(Math.min(valor, diasTotaisOperacao));
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
                      placeholder={`Máx: ${diasTotaisOperacao}`}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={adicionarViatura}
                  className="w-full px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                >
                  Confirmar e Adicionar
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Equipamento <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={equipamentoSelecionado?.nome || ""}
                    onChange={(e) => {
                      const equip = equipamentosDisponiveis.find(
                        (eq) => eq.nome === e.target.value
                      );
                      setEquipamentoSelecionado(equip || null);
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
                  >
                    <option value="">Selecione um equipamento</option>
                    {equipamentosDisponiveis.map((eq, i) => (
                      <option key={i} value={eq.nome}>
                        {eq.nome} - {eq.consumoLH} L/h
                      </option>
                    ))}
                  </select>
                  {equipamentoSelecionado?.observacoes && (
                    <p className="text-xs text-blue-600 mt-1">
                      {equipamentoSelecionado.observacoes}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Quantidade <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={quantidadeEquipamento || ""}
                    onChange={(e) =>
                      setQuantidadeEquipamento(parseInt(e.target.value) || 0)
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
                    placeholder="1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Horas médias/dia <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={horasMediaDiaria || ""}
                      onChange={(e) =>
                        setHorasMediaDiaria(parseFloat(e.target.value) || 0)
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
                      placeholder="0"
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
                      value={diasUsoEquipamento || ""}
                      onChange={(e) => {
                        const valor = parseInt(e.target.value) || 0;
                        setDiasUsoEquipamento(
                          Math.min(valor, diasTotaisOperacao)
                        );
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
                      placeholder={`Máx: ${diasTotaisOperacao}`}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={adicionarEquipamento}
                  className="w-full px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                >
                  Confirmar e Adicionar
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lista de itens adicionados */}
      {itens.length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Viaturas e Equipamentos Adicionados
          </label>
          {itens.map((item, index) => (
            <div
              key={index}
              className="bg-gray-50 border border-gray-200 rounded-md p-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                      {item.tipoItem === "VIATURA" ? "Viatura" : "Equipamento"}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {calcularConsumoItem(item).toFixed(1)} L
                    </span>
                  </div>

                  {item.tipoItem === "VIATURA" ? (
                    <div className="text-xs text-gray-600">
                      <p className="font-medium">
                        {item.quantidade}x Viatura ({item.viatura.exemplo})
                      </p>
                      <p>
                        {item.kmMedioDiario} km/dia × {item.diasUso} dias ={" "}
                        {item.kmMedioDiario * item.diasUso} km
                      </p>
                      <p>Consumo: {item.viatura.consumoKmL} km/L</p>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-600">
                      <p className="font-medium">
                        {item.quantidade}x {item.equipamento.nome}
                      </p>
                      <p>
                        {item.horasMediaDiaria} h/dia × {item.diasUso} dias ={" "}
                        {item.horasMediaDiaria * item.diasUso} horas
                      </p>
                      <p>Consumo: {item.equipamento.consumoLH} L/h</p>
                      {item.equipamento.observacoes && (
                        <p className="text-xs text-blue-600 mt-1">
                          {item.equipamento.observacoes}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => removerItem(index)}
                  className="ml-2 p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Remover item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <PreviewCalculo
        valorTotal={valorTotal}
        valorCombustivel={valorCombustivel}
        isCombustivel={true}
      />

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
