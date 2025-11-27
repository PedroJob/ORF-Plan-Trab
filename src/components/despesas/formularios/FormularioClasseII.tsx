"use client";

import { useState, useEffect } from "react";
import { PreviewCalculo } from "../PreviewCalculo";
import {
  calcularClasseII,
  ParametrosClasseII,
  MaterialClasseII,
  ItemManutencao,
  TipoMaterialClasseII,
  VALORES_MANUTENCAO,
  VIDA_UTIL,
} from "@/lib/calculos/classeII";
import { Trash2, Plus, X } from "lucide-react";
import { HandleParametrosChange } from "../ModalCriarDespesa";
import {
  OperacaoWithEfetivo,
  UserOM,
  NaturezaSelect,
  RateioNatureza,
} from "@/types/despesas";

interface FormularioClasseIIProps {
  operacao: OperacaoWithEfetivo;
  value: ParametrosClasseII | null;
  onChange: (params: HandleParametrosChange) => void;
  userOm: UserOM | null;
  planoOm: UserOM | null;
  naturezas: NaturezaSelect[];
  rateioNaturezas: RateioNatureza[];
}

const LABELS_TIPO_MATERIAL: Record<TipoMaterialClasseII, string> = {
  EQUIPAMENTO_INDIVIDUAL: "Equipamento Individual",
  MATERIAL_BALISTICO: "Material Balístico",
  ESTACIONAMENTO_ALOJAMENTO: "Estacionamento/Alojamento",
};

export function FormularioClasseII({
  operacao,
  value,
  onChange,
  userOm,
  planoOm,
  naturezas,
  rateioNaturezas,
}: FormularioClasseIIProps) {
  const [materiais, setMateriais] = useState<MaterialClasseII[]>(
    value?.materiais || []
  );
  const [valorTotal, setValorTotal] = useState<number | null>(null);
  const [carimbo, setCarimbo] = useState<string>("");
  const [carimboEditadoManualmente, setCarimboEditadoManualmente] =
    useState(false);

  const calcularDias = () => {
    const inicio = new Date(operacao.dataInicio);
    const final = new Date(operacao.dataFinal);
    const diffTime = Math.abs(final.getTime() - inicio.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const intervaloDias = calcularDias() + 1;

  // Estado para adicionar novo material
  const [tipoSelecionado, setTipoSelecionado] =
    useState<TipoMaterialClasseII | null>(null);
  const [showFormulario, setShowFormulario] = useState(false);

  // Estados para formulários específicos
  const [numeroMilitares, setNumeroMilitares] = useState(0);
  const [periodoDias, setPeriodoDias] = useState(intervaloDias);
  const [itensBalisticos, setItensBalisticos] = useState<ItemManutencao[]>([]);
  const [itensEstacionamento, setItensEstacionamento] = useState<
    ItemManutencao[]
  >([]);
  const [novoItem, setNovoItem] = useState<Partial<ItemManutencao>>({
    tipo: "",
    quantidade: 1,
    mntDia: 0,
    periodoDias: intervaloDias,
  });

  // Mapear naturezas selecionadas para códigos
  const getNaturezasCodigos = () => {
    return rateioNaturezas
      .map(
        (rateio) => naturezas.find((n) => n.id === rateio.naturezaId)?.codigo
      )
      .filter((codigo): codigo is string => codigo !== undefined);
  };

  useEffect(() => {
    calcular();
  }, [materiais, rateioNaturezas]);

  const calcular = () => {
    if (materiais.length === 0) {
      setValorTotal(null);
      setCarimbo("");
      return;
    }

    try {
      // Usar planoOm ao invés de userOm, e passar naturezas selecionadas
      const resultado = calcularClasseII(
        { materiais },
        planoOm?.sigla,
        operacao.nome,
        getNaturezasCodigos()
      );
      setValorTotal(resultado.valorTotal);

      // Sempre regenerar carimbo dos parâmetros
      setCarimbo(resultado.carimbo);
      setCarimboEditadoManualmente(false);

      onChange({
        params: { materiais },
        valor: resultado.valorTotal,
        descricao: resultado.carimbo,
      });
    } catch (error) {
      console.error("Erro no cálculo:", error);
      setValorTotal(null);
      setCarimbo(error instanceof Error ? error.message : "Erro desconhecido");
    }
  };

  const tiposDisponiveis = (): TipoMaterialClasseII[] => {
    const tiposAdicionados = materiais.map((m) => m.tipo);
    const todosTipos: TipoMaterialClasseII[] = [
      "EQUIPAMENTO_INDIVIDUAL",
      "MATERIAL_BALISTICO",
      "ESTACIONAMENTO_ALOJAMENTO",
    ];
    return todosTipos.filter((tipo) => !tiposAdicionados.includes(tipo));
  };

  const adicionarMaterial = () => {
    if (!tipoSelecionado) return;

    let novoMaterial: MaterialClasseII | null = null;

    switch (tipoSelecionado) {
      case "EQUIPAMENTO_INDIVIDUAL":
        if (numeroMilitares <= 0 || periodoDias <= 0) {
          alert("Preencha todos os campos obrigatórios");
          return;
        }
        novoMaterial = {
          tipo: "EQUIPAMENTO_INDIVIDUAL",
          numeroMilitares,
          periodoDias,
        };
        break;

      case "MATERIAL_BALISTICO":
        if (itensBalisticos.length === 0) {
          alert("Adicione pelo menos um item balístico");
          return;
        }
        novoMaterial = {
          tipo: "MATERIAL_BALISTICO",
          itens: itensBalisticos,
        };
        break;

      case "ESTACIONAMENTO_ALOJAMENTO":
        if (itensEstacionamento.length === 0) {
          alert("Adicione pelo menos um item");
          return;
        }
        novoMaterial = {
          tipo: "ESTACIONAMENTO_ALOJAMENTO",
          itens: itensEstacionamento,
        };
        break;
    }

    if (novoMaterial) {
      setMateriais([...materiais, novoMaterial]);
      resetFormulario();
    }
  };

  const resetFormulario = () => {
    setTipoSelecionado(null);
    setShowFormulario(false);
    setNumeroMilitares(0);
    setPeriodoDias(0);
    setItensBalisticos([]);
    setItensEstacionamento([]);
    setNovoItem({ tipo: "", quantidade: 1, mntDia: 0, periodoDias: 0 });
  };

  const removerMaterial = (index: number) => {
    const novosMateriais = materiais.filter((_, i) => i !== index);
    setMateriais(novosMateriais);
  };

  const adicionarItemBalistico = (
    tipo: "Capacete Balístico" | "Colete Balístico"
  ) => {
    const valorDia =
      tipo === "Capacete Balístico"
        ? VALORES_MANUTENCAO.CAPACETE_DIA
        : VALORES_MANUTENCAO.COLETE_DIA;

    const novoItem: ItemManutencao = {
      tipo,
      quantidade: 1,
      mntDia: valorDia,
      periodoDias: intervaloDias,
    };

    setItensBalisticos([...itensBalisticos, novoItem]);
  };

  const removerItemBalistico = (index: number) => {
    setItensBalisticos(itensBalisticos.filter((_, i) => i !== index));
  };

  const adicionarItemEstacionamento = () => {
    if (
      !novoItem.tipo ||
      !novoItem.quantidade ||
      !novoItem.mntDia ||
      !novoItem.periodoDias
    ) {
      alert("Preencha todos os campos do item");
      return;
    }

    const itemCompleto: ItemManutencao = {
      tipo: novoItem.tipo,
      quantidade: novoItem.quantidade,
      mntDia: novoItem.mntDia,
      periodoDias: novoItem.periodoDias,
    };

    setItensEstacionamento([...itensEstacionamento, itemCompleto]);
    setNovoItem({ tipo: "", quantidade: 1, mntDia: 0, periodoDias: 0 });
  };

  const removerItemEstacionamento = (index: number) => {
    setItensEstacionamento(itensEstacionamento.filter((_, i) => i !== index));
  };

  const preencherItemPadrao = (tipoItem: string) => {
    const valoresPadrao: Record<string, number> = {
      "Barraca de Campanha": VALORES_MANUTENCAO.BARRACA_CAMPANHA,
      Toldo: VALORES_MANUTENCAO.TOLDO,
      "Barraca Individual": VALORES_MANUTENCAO.BARRACA_INDIVIDUAL,
      Cama: VALORES_MANUTENCAO.CAMA,
      Armário: VALORES_MANUTENCAO.ARMARIO,
      Beliche: VALORES_MANUTENCAO.BELICHE,
      Colchão: VALORES_MANUTENCAO.COLCHAO,
    };

    setNovoItem((prev) => ({
      ...prev,
      tipo: tipoItem,
      mntDia: valoresPadrao[tipoItem] || 0,
    }));
  };

  const calcularValorMaterial = (material: MaterialClasseII): number => {
    switch (material.tipo) {
      case "EQUIPAMENTO_INDIVIDUAL":
        return (
          material.numeroMilitares *
          VALORES_MANUTENCAO.EQUIPAMENTO_INDIVIDUAL_DIA *
          material.periodoDias
        );
      case "MATERIAL_BALISTICO":
        return material.itens.reduce(
          (sum, item) => sum + item.quantidade * item.mntDia * item.periodoDias,
          0
        );
      case "ESTACIONAMENTO_ALOJAMENTO":
        return material.itens.reduce(
          (sum, item) => sum + item.quantidade * item.mntDia * item.periodoDias,
          0
        );
      default:
        return 0;
    }
  };

  const handleCarimboChange = (novoCarimbo: string) => {
    setCarimbo(novoCarimbo);
    setCarimboEditadoManualmente(true);

    onChange({
      params: { materiais },
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
      {/* Adicionar novo material */}
      {tiposDisponiveis().length > 0 && (
        <div className="border-t pt-4">
          {!showFormulario ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adicionar Material
              </label>
              <div className="grid grid-cols-2 gap-2">
                {tiposDisponiveis().map((tipo) => (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => {
                      setTipoSelecionado(tipo);
                      setShowFormulario(true);
                    }}
                    className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <Plus className="w-4 h-4 inline mr-2" />
                    {LABELS_TIPO_MATERIAL[tipo]}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-blue-900">
                  {tipoSelecionado && LABELS_TIPO_MATERIAL[tipoSelecionado]}
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

              {/* Formulário Equipamento Individual */}
              {tipoSelecionado === "EQUIPAMENTO_INDIVIDUAL" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Número de Militares{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={numeroMilitares || ""}
                      onChange={(e) =>
                        setNumeroMilitares(parseInt(e.target.value) || 0)
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
                      placeholder="Número de militares"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Período (dias) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={intervaloDias}
                      step="1"
                      value={periodoDias || ""}
                      onChange={(e) => {
                        const valor = parseInt(e.target.value) || 0;
                        setPeriodoDias(Math.min(valor, intervaloDias));
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
                      placeholder="Dias de operação"
                    />
                  </div>
                </div>
              )}

              {/* Formulário Material Balístico */}
              {tipoSelecionado === "MATERIAL_BALISTICO" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Itens Balísticos
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          adicionarItemBalistico("Capacete Balístico")
                        }
                        className="px-3 py-2 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100"
                      >
                        + Capacete (R${" "}
                        {VALORES_MANUTENCAO.CAPACETE_DIA.toFixed(2)}/dia)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          adicionarItemBalistico("Colete Balístico")
                        }
                        className="px-3 py-2 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100"
                      >
                        + Colete (R$ {VALORES_MANUTENCAO.COLETE_DIA.toFixed(2)}
                        /dia)
                      </button>
                    </div>
                  </div>

                  {itensBalisticos.length > 0 && (
                    <div className="space-y-2">
                      {itensBalisticos.map((item, index) => (
                        <div
                          key={index}
                          className="bg-gray-50 rounded border border-gray-200 p-2 flex items-center justify-between"
                        >
                          <div className="flex-1 grid grid-cols-3 gap-2 text-xs">
                            <span className="font-medium">{item.tipo}</span>
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={item.quantidade}
                              onChange={(e) => {
                                const novosItens = [...itensBalisticos];
                                novosItens[index].quantidade =
                                  parseInt(e.target.value) || 1;
                                setItensBalisticos(novosItens);
                              }}
                              className="px-2 py-1 border border-gray-300 rounded"
                              placeholder="Qtd"
                            />
                            <input
                              type="number"
                              min="1"
                              max={intervaloDias}
                              step="1"
                              value={item.periodoDias}
                              onChange={(e) => {
                                const valor = parseInt(e.target.value) || 1;
                                const novosItens = [...itensBalisticos];
                                novosItens[index].periodoDias = Math.min(
                                  valor,
                                  intervaloDias
                                );
                                setItensBalisticos(novosItens);
                              }}
                              className="px-2 py-1 border border-gray-300 rounded"
                              placeholder="Dias"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removerItemBalistico(index)}
                            className="ml-2 p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Formulário Estacionamento/Alojamento */}
              {tipoSelecionado === "ESTACIONAMENTO_ALOJAMENTO" && (
                <div className="space-y-3">
                  {/* Botões de itens padrão */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Itens Padrão
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {Object.keys({
                        "Barraca de Campanha":
                          VALORES_MANUTENCAO.BARRACA_CAMPANHA,
                        Toldo: VALORES_MANUTENCAO.TOLDO,
                        "Barraca Individual":
                          VALORES_MANUTENCAO.BARRACA_INDIVIDUAL,
                        Cama: VALORES_MANUTENCAO.CAMA,
                        Armário: VALORES_MANUTENCAO.ARMARIO,
                        Beliche: VALORES_MANUTENCAO.BELICHE,
                        Colchão: VALORES_MANUTENCAO.COLCHAO,
                      }).map((tipo) => (
                        <button
                          key={tipo}
                          type="button"
                          onClick={() => preencherItemPadrao(tipo)}
                          className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100"
                        >
                          {tipo}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Lista de itens adicionados */}
                  {itensEstacionamento.length > 0 && (
                    <div className="bg-white rounded border border-gray-300 p-2 space-y-2">
                      <p className="text-xs font-medium text-gray-700">
                        Itens adicionados:
                      </p>
                      {itensEstacionamento.map((item, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded"
                        >
                          <span>
                            {item.tipo}: {item.quantidade} × R${" "}
                            {item.mntDia.toFixed(2)} × {item.periodoDias} dias
                          </span>
                          <button
                            type="button"
                            onClick={() => removerItemEstacionamento(i)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Formulário adicionar item */}
                  <div className="bg-white rounded border border-gray-300 p-3 space-y-2">
                    <p className="text-xs font-medium text-gray-700">
                      Adicionar item:
                    </p>
                    <input
                      type="text"
                      value={novoItem.tipo || ""}
                      onChange={(e) =>
                        setNovoItem((prev) => ({
                          ...prev,
                          tipo: e.target.value,
                        }))
                      }
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                      placeholder="Tipo do item"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex flex-col">
                        <p className="text-xs font-medium text-gray-700">
                          Quantidade:
                        </p>
                        <input
                          type="number"
                          min="1"
                          value={novoItem.quantidade || ""}
                          onChange={(e) =>
                            setNovoItem((prev) => ({
                              ...prev,
                              quantidade: parseInt(e.target.value) || 1,
                            }))
                          }
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                          placeholder="Qtd"
                        />
                      </div>
                      <div className="flex flex-col">
                        <p className="text-xs font-medium text-gray-700">
                          Manutenção (R$/dia):
                        </p>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          disabled
                          value={novoItem.mntDia || ""}
                          onChange={(e) =>
                            setNovoItem((prev) => ({
                              ...prev,
                              mntDia: parseFloat(e.target.value) || 0,
                            }))
                          }
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                          placeholder="R$/dia"
                        />
                      </div>
                      <div className="flex flex-col">
                        <p className="text-xs font-medium text-gray-700">
                          Período (dias):
                        </p>
                        <input
                          type="number"
                          min="1"
                          max={operacao.diasTotais}
                          value={novoItem.periodoDias || ""}
                          onChange={(e) =>
                            setNovoItem((prev) => ({
                              ...prev,
                              periodoDias: parseInt(e.target.value) || 0,
                            }))
                          }
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                          placeholder="Dias"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={adicionarItemEstacionamento}
                      className="w-full px-3 py-1.5 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700"
                    >
                      <Plus className="w-3 h-3 inline mr-1" />
                      Adicionar Item
                    </button>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={adicionarMaterial}
                className="w-full px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
              >
                Confirmar e Adicionar
              </button>
            </div>
          )}
        </div>
      )}

      {materiais.length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Materiais Adicionados
          </label>
          {materiais.map((material, index) => (
            <div
              key={index}
              className="bg-gray-50 border border-gray-200 rounded-md p-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                      {LABELS_TIPO_MATERIAL[material.tipo]}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      R$ {calcularValorMaterial(material).toFixed(2)}
                    </span>
                  </div>

                  {material.tipo === "EQUIPAMENTO_INDIVIDUAL" && (
                    <p className="text-xs text-gray-600">
                      {material.numeroMilitares} militares ×{" "}
                      {material.periodoDias} dias × R${" "}
                      {VALORES_MANUTENCAO.EQUIPAMENTO_INDIVIDUAL_DIA.toFixed(2)}
                      /dia
                    </p>
                  )}

                  {material.tipo === "MATERIAL_BALISTICO" && (
                    <div className="text-xs text-gray-600">
                      <p className="font-medium mb-1">
                        {material.itens.length} item(ns):
                      </p>
                      <ul className="space-y-1 ml-3">
                        {material.itens.map((item, i) => (
                          <li key={i}>
                            {item.tipo}: {item.quantidade} × R${" "}
                            {item.mntDia.toFixed(2)} × {item.periodoDias} dias =
                            R${" "}
                            {(
                              item.quantidade *
                              item.mntDia *
                              item.periodoDias
                            ).toFixed(2)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {material.tipo === "ESTACIONAMENTO_ALOJAMENTO" && (
                    <div className="text-xs text-gray-600">
                      <p className="font-medium mb-1">
                        {material.itens.length} item(ns):
                      </p>
                      <ul className="space-y-1 ml-3">
                        {material.itens.map((item, i) => (
                          <li key={i}>
                            {item.tipo}: {item.quantidade} × R${" "}
                            {item.mntDia.toFixed(2)} × {item.periodoDias} dias =
                            R${" "}
                            {(
                              item.quantidade *
                              item.mntDia *
                              item.periodoDias
                            ).toFixed(2)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => removerMaterial(index)}
                  className="ml-2 p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Remover material"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
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
