"use client";

import { useState, useEffect } from "react";
import { PreviewCalculo } from "../PreviewCalculo";
import { Plus, X, Trash2 } from "lucide-react";
import { HandleParametrosChange } from "../ModalCriarDespesa";
import { Tipo } from "@prisma/client";
import type { OperacaoWithEfetivo } from "@/types/despesas";
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
}

export function FormularioClasseIII({
  tipoSelecionado,
  operacao,
  value,
  onChange,
}: FormularioClasseIIIProps) {
  // Mapear tipo do banco para tipo de combustível
  const getTipoCombustivel = (): TipoCombustivel => {
    const nomeTipo = tipoSelecionado.nome.toUpperCase();
    if (nomeTipo.includes('DIESEL') || nomeTipo.includes('OD')) return 'OD';
    if (nomeTipo.includes('GASOLINA') || nomeTipo.includes('GC')) return 'GC';
    return 'GAS'; // Genérico
  };

  const tipoCombustivel = getTipoCombustivel();

  const [itens, setItens] = useState<ItemClasseIII[]>(value?.itens || []);
  const [valorTotal, setValorTotal] = useState<number | null>(null);
  const [valorCombustivel, setValorCombustivel] = useState<number | null>(null);
  const [carimbo, setCarimbo] = useState<string | null>(null);

  // Estado para adicionar novo item
  const [showFormulario, setShowFormulario] = useState(false);
  const [tipoItemSelecionado, setTipoItemSelecionado] = useState<'VIATURA' | 'EQUIPAMENTO' | null>(null);

  // Viaturas e equipamentos disponíveis (filtrados por combustível)
  const viaturasDisponiveis = filtrarViaturasPorCombustivel(tipoCombustivel);
  const equipamentosDisponiveis = filtrarEquipamentosPorCombustivel(tipoCombustivel);

  // Estado para novo item de viatura
  const [viaturaSelecionada, setViaturaSelecionada] = useState<Viatura | null>(null);
  const [quantidadeViatura, setQuantidadeViatura] = useState(1);
  const [kmTotal, setKmTotal] = useState(0);

  // Estado para novo item de equipamento
  const [equipamentoSelecionado, setEquipamentoSelecionado] = useState<Equipamento | null>(null);
  const [quantidadeEquipamento, setQuantidadeEquipamento] = useState(1);
  const [horasTotal, setHorasTotal] = useState(0);

  useEffect(() => {
    calcular();
  }, [itens]);

  const calcular = () => {
    if (itens.length === 0) {
      setValorTotal(null);
      setValorCombustivel(null);
      setCarimbo(null);
      return;
    }

    try {
      const resultado = calcularClasseIII({ itens, tipoCombustivel });
      setValorTotal(resultado.valorTotal);
      setValorCombustivel(resultado.valorCombustivel);
      setCarimbo(resultado.carimbo);
      onChange({
        params: { itens, tipoCombustivel },
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
    if (!viaturaSelecionada || quantidadeViatura <= 0 || kmTotal <= 0) {
      alert("Preencha todos os campos obrigatórios");
      return;
    }

    const novoItem: ItemClasseIII = {
      tipoItem: 'VIATURA',
      viatura: viaturaSelecionada,
      quantidade: quantidadeViatura,
      kmTotal,
    };

    setItens([...itens, novoItem]);
    resetFormulario();
  };

  const adicionarEquipamento = () => {
    if (!equipamentoSelecionado || quantidadeEquipamento <= 0 || horasTotal <= 0) {
      alert("Preencha todos os campos obrigatórios");
      return;
    }

    const novoItem: ItemClasseIII = {
      tipoItem: 'EQUIPAMENTO',
      equipamento: equipamentoSelecionado,
      quantidade: quantidadeEquipamento,
      horasTotal,
    };

    setItens([...itens, novoItem]);
    resetFormulario();
  };

  const resetFormulario = () => {
    setShowFormulario(false);
    setTipoItemSelecionado(null);
    setViaturaSelecionada(null);
    setQuantidadeViatura(1);
    setKmTotal(0);
    setEquipamentoSelecionado(null);
    setQuantidadeEquipamento(1);
    setHorasTotal(0);
  };

  const removerItem = (index: number) => {
    setItens(itens.filter((_, i) => i !== index));
  };

  const calcularConsumoItem = (item: ItemClasseIII): number => {
    if (item.tipoItem === 'VIATURA') {
      return (item.kmTotal / item.viatura.consumoKmL) * item.quantidade;
    } else {
      return item.equipamento.consumoLH * item.horasTotal * item.quantidade;
    }
  };

  const getNomeTipoCombustivel = (): string => {
    switch (tipoCombustivel) {
      case 'OD': return 'Óleo Diesel';
      case 'GC': return 'Gasolina Comum';
      case 'GAS': return 'Gasolina';
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
          Preço médio nacional: R$ {PRECOS_COMBUSTIVEL[tipoCombustivel].toFixed(2)}/litro
        </p>
        <p className="text-blue-700 text-xs">
          Fator de segurança: 1,3 (30% adicional)
        </p>
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
                      {item.tipoItem === 'VIATURA' ? 'Viatura' : 'Equipamento'}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {calcularConsumoItem(item).toFixed(1)} L
                    </span>
                  </div>

                  {item.tipoItem === 'VIATURA' ? (
                    <div className="text-xs text-gray-600">
                      <p className="font-medium">
                        {item.quantidade}x {item.viatura.exemplo}
                      </p>
                      <p>
                        {item.kmTotal} km cada × {item.viatura.consumoKmL} km/L
                      </p>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-600">
                      <p className="font-medium">
                        {item.quantidade}x {item.equipamento.nome}
                      </p>
                      <p>
                        {item.horasTotal} horas cada × {item.equipamento.consumoLH} L/h
                      </p>
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
                  setTipoItemSelecionado('VIATURA');
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
                  setTipoItemSelecionado('EQUIPAMENTO');
                  setShowFormulario(true);
                }}
                className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                disabled={equipamentosDisponiveis.length === 0}
              >
                <Plus className="w-4 h-4 inline mr-2" />
                Equipamento
              </button>
            </div>
            {viaturasDisponiveis.length === 0 && equipamentosDisponiveis.length === 0 && (
              <p className="text-xs text-red-600 mt-2">
                Não há viaturas ou equipamentos compatíveis com {getNomeTipoCombustivel()}
              </p>
            )}
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-blue-900">
                {tipoItemSelecionado === 'VIATURA' ? 'Adicionar Viatura' : 'Adicionar Equipamento'}
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

            {tipoItemSelecionado === 'VIATURA' ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Viatura <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={viaturaSelecionada?.exemplo || ''}
                    onChange={(e) => {
                      const viatura = viaturasDisponiveis.find(v => v.exemplo === e.target.value);
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

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Quantidade <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={quantidadeViatura || ''}
                      onChange={(e) => setQuantidadeViatura(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
                      placeholder="1"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Km Totais (cada) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={kmTotal || ''}
                      onChange={(e) => setKmTotal(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
                      placeholder="0"
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
                    value={equipamentoSelecionado?.nome || ''}
                    onChange={(e) => {
                      const equip = equipamentosDisponiveis.find(eq => eq.nome === e.target.value);
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

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Quantidade <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={quantidadeEquipamento || ''}
                      onChange={(e) => setQuantidadeEquipamento(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
                      placeholder="1"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Horas Totais (cada) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={horasTotal || ''}
                      onChange={(e) => setHorasTotal(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
                      placeholder="0"
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

      <PreviewCalculo
        valorTotal={valorTotal}
        valorCombustivel={valorCombustivel}
        carimbo={carimbo}
        isCombustivel={true}
      />
    </div>
  );
}
