"use client";

import { useState, useEffect } from "react";
import { PreviewCalculo } from "../PreviewCalculo";
import { Plus, Trash2 } from "lucide-react";
import {
  ParametrosClasseVIII,
  ItemMaterialSaude,
  TipoKit,
  KITS_SAUDE,
  calcularClasseVIII,
  listarTodosKits,
  getCustoEfetivo,
  getNomeMaterial,
} from "@/lib/calculos/classeVIII";
import { HandleParametrosChange } from "../ModalCriarDespesa";
import type {
  OperacaoWithEfetivo,
  UserOM,
  NaturezaSelect,
  RateioNatureza,
} from "@/types/despesas";

interface FormularioClasseVIIIProps {
  value: ParametrosClasseVIII | null;
  onChange: (params: HandleParametrosChange) => void;
  operacao: OperacaoWithEfetivo;
  userOm: UserOM | null;
  planoOm: UserOM | null;
  naturezas: NaturezaSelect[];
  rateioNaturezas: RateioNatureza[];
}

export function FormularioClasseVIII({
  value,
  onChange,
  operacao,
  userOm,
  planoOm,
  naturezas,
  rateioNaturezas,
}: FormularioClasseVIIIProps) {
  const [materiais, setMateriais] = useState<ItemMaterialSaude[]>(
    value?.materiais || []
  );

  const [valorTotal, setValorTotal] = useState<number | null>(null);
  const [carimbo, setCarimbo] = useState<string>("");
  const [carimboEditadoManualmente, setCarimboEditadoManualmente] =
    useState(false);

  // Estado para novo material
  const [tipoKitSelecionado, setTipoKitSelecionado] = useState<TipoKit | null>(
    null
  );
  const [nomeCustomizado, setNomeCustomizado] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [custo, setCusto] = useState(0);

  // Estado para modo de seleção
  const [modoOutro, setModoOutro] = useState(false);

  const kitsDisponiveis = listarTodosKits();

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
  }, [materiais]);

  const calcular = () => {
    if (materiais.length === 0) {
      setValorTotal(null);
      setCarimbo("");
      return;
    }

    try {
      const resultado = calcularClasseVIII(
        { materiais },
        planoOm?.sigla,
        operacao.nome,
        getNaturezasCodigos()
      );
      setValorTotal(resultado.valorTotal);
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
      setCarimbo("");
    }
  };

  const handleTipoKitChange = (tipo: TipoKit | null) => {
    setTipoKitSelecionado(tipo);
    if (tipo && tipo !== "OUTRO") {
      setCusto(KITS_SAUDE[tipo].custo);
      setNomeCustomizado("");
    } else {
      setCusto(0);
    }
  };

  const adicionarMaterial = () => {
    if (modoOutro) {
      if (!nomeCustomizado || quantidade <= 0 || custo <= 0) {
        return;
      }
    } else {
      if (!tipoKitSelecionado || quantidade <= 0 || custo <= 0) {
        return;
      }
    }

    let novoMaterial: ItemMaterialSaude;

    if (modoOutro) {
      novoMaterial = {
        tipoKit: "OUTRO",
        nomeCustomizado,
        quantidade,
        custoCustomizado: custo,
      };
    } else {
      const kitPadrao =
        KITS_SAUDE[tipoKitSelecionado! as Exclude<TipoKit, "OUTRO">];
      const isCustomizado = custo !== kitPadrao.custo;

      novoMaterial = {
        tipoKit: tipoKitSelecionado!,
        quantidade,
        ...(isCustomizado && { custoCustomizado: custo }),
      };
    }

    setMateriais([...materiais, novoMaterial]);
    resetFormulario();
  };

  const resetFormulario = () => {
    setTipoKitSelecionado(null);
    setNomeCustomizado("");
    setQuantidade(1);
    setCusto(0);
  };

  const removerMaterial = (index: number) => {
    setMateriais(materiais.filter((_, i) => i !== index));
  };

  const calcularCustoItem = (item: ItemMaterialSaude): number => {
    const custoItem = getCustoEfetivo(item);
    return item.quantidade * custoItem;
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

  const kitSelecionadoInfo =
    tipoKitSelecionado && tipoKitSelecionado !== "OUTRO"
      ? KITS_SAUDE[tipoKitSelecionado]
      : null;

  return (
    <div className="space-y-4">
      {/* Info sobre a classe */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm">
        <p className="text-blue-800 font-medium mb-1">Material de Saúde</p>
        <p className="text-blue-700 text-xs">
          Kits de primeiros socorros e materiais médicos para operações
        </p>
      </div>

      {/* Lista de materiais adicionados */}
      {materiais.length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Materiais Adicionados
          </label>
          {materiais.map((item, index) => {
            const custoItem = getCustoEfetivo(item);
            const custoTotal = calcularCustoItem(item);
            const nomeMaterial = getNomeMaterial(item);
            const isCustomizado = item.custoCustomizado !== undefined;

            return (
              <div
                key={index}
                className="bg-gray-50 border border-gray-200 rounded-md p-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-900">
                        R${" "}
                        {custoTotal.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                      {isCustomizado && (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          Customizado
                        </span>
                      )}
                      {item.tipoKit === "OUTRO" && (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                          Outro
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-600">
                      <p className="font-medium">
                        {item.quantidade}x {nomeMaterial}
                      </p>
                      <p>
                        R${" "}
                        {custoItem.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}{" "}
                        / unidade
                      </p>
                    </div>
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
            );
          })}
        </div>
      )}

      {/* Formulário para adicionar material */}
      <div className="bg-green-50 border border-green-200 rounded-md p-4 space-y-4">
        <p className="text-sm font-semibold text-green-900">
          Adicionar Material de Saúde
        </p>

        {/* Toggle entre kit padrão e outro */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setModoOutro(false);
              resetFormulario();
            }}
            className={`flex-1 px-3 py-2 text-xs rounded-md transition-all ${
              !modoOutro
                ? "bg-green-600 text-white"
                : "bg-white border border-green-300 text-green-700 hover:bg-green-100"
            }`}
          >
            Kit Padrão
          </button>
          <button
            type="button"
            onClick={() => {
              setModoOutro(true);
              resetFormulario();
            }}
            className={`flex-1 px-3 py-2 text-xs rounded-md transition-all ${
              modoOutro
                ? "bg-green-600 text-white"
                : "bg-white border border-green-300 text-green-700 hover:bg-green-100"
            }`}
          >
            Outro Material
          </button>
        </div>

        {/* Seleção de kit ou input customizado */}
        {modoOutro ? (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Nome do Material <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nomeCustomizado}
              onChange={(e) => setNomeCustomizado(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
              placeholder="Ex: Medicamentos diversos"
            />
          </div>
        ) : (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Kit de Saúde <span className="text-red-500">*</span>
            </label>
            <select
              value={tipoKitSelecionado || ""}
              onChange={(e) =>
                handleTipoKitChange((e.target.value as TipoKit) || null)
              }
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
            >
              <option value="">Selecione um kit</option>
              {kitsDisponiveis.map((kit) => (
                <option key={kit.tipo} value={kit.tipo}>
                  {kit.info.nome} - R${" "}
                  {kit.info.custo.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </option>
              ))}
            </select>

            {kitSelecionadoInfo && (
              <p className="text-xs text-gray-500 mt-1">
                {kitSelecionadoInfo.descricao}
              </p>
            )}
          </div>
        )}

        {/* Custo editável */}
        {(tipoKitSelecionado || modoOutro) && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Custo Unitário (R$) <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                disabled={!modoOutro}
                type="number"
                min="0.01"
                step="0.01"
                value={custo || ""}
                onChange={(e) => setCusto(parseFloat(e.target.value) || 0)}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
                placeholder="0.00"
              />
              {kitSelecionadoInfo && custo !== kitSelecionadoInfo.custo && (
                <button
                  type="button"
                  onClick={() => setCusto(kitSelecionadoInfo.custo)}
                  className="text-xs text-blue-600 hover:text-blue-800 underline whitespace-nowrap"
                >
                  Restaurar padrão
                </button>
              )}
            </div>
            {kitSelecionadoInfo && (
              <p className="text-xs text-gray-500 mt-1">
                Valor padrão: R${" "}
                {kitSelecionadoInfo.custo.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </p>
            )}
          </div>
        )}

        {/* Quantidade */}
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

        {/* Preview do custo */}
        {custo > 0 && quantidade > 0 && (
          <div className="bg-white rounded p-2 text-xs text-gray-600">
            <p>
              <strong>Custo estimado:</strong> {quantidade} × R${" "}
              {custo.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}{" "}
              ={" "}
              <span className="font-semibold text-green-700">
                R${" "}
                {(quantidade * custo).toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </span>
              {kitSelecionadoInfo && custo !== kitSelecionadoInfo.custo && (
                <span className="ml-2 text-amber-600">(custo customizado)</span>
              )}
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={adicionarMaterial}
          disabled={
            (modoOutro ? !nomeCustomizado : !tipoKitSelecionado) ||
            quantidade <= 0 ||
            custo <= 0
          }
          className="w-full px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Adicionar Material
        </button>
      </div>

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
          disabled={true}
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
