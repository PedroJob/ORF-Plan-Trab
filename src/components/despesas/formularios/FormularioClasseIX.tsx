"use client";

import { useState, useEffect, useMemo } from "react";
import { PreviewCalculo } from "../PreviewCalculo";
import { Plus, Trash2 } from "lucide-react";
import {
  ParametrosClasseIX,
  ItemViatura,
  TipoViatura,
  GrupoViatura,
  VIATURAS,
  GRUPOS_VIATURA,
  calcularClasseIX,
  listarTodasViaturas,
  getCustoMntDiaEfetivo,
  getValorAcionamentoEfetivo,
  calcularCiclos30Dias,
  getGrupoViatura,
} from "@/lib/calculos/classeIX";
import { HandleParametrosChange } from "../ModalCriarDespesa";
import type {
  OperacaoWithEfetivo,
  UserOM,
  NaturezaSelect,
  RateioNatureza,
} from "@/types/despesas";

interface FormularioClasseIXProps {
  value: ParametrosClasseIX | null;
  onChange: (params: HandleParametrosChange) => void;
  operacao: OperacaoWithEfetivo;
  userOm: UserOM | null;
  planoOm: UserOM | null;
  naturezas: NaturezaSelect[];
  rateioNaturezas: RateioNatureza[];
}

export function FormularioClasseIX({
  value,
  onChange,
  operacao,
  userOm,
  planoOm,
  naturezas,
  rateioNaturezas,
}: FormularioClasseIXProps) {
  const diasTotaisOperacao = useMemo(() => {
    const inicio = new Date(operacao.dataInicio);
    const final = new Date(operacao.dataFinal);
    const diffTime = Math.abs(final.getTime() - inicio.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  }, [operacao.dataInicio, operacao.dataFinal]);

  const [viaturas, setViaturas] = useState<ItemViatura[]>(
    value?.viaturas || []
  );

  const [valorTotal, setValorTotal] = useState<number | null>(null);
  const [carimbo, setCarimbo] = useState<string>("");
  const [carimboEditadoManualmente, setCarimboEditadoManualmente] =
    useState(false);

  const [tipoViaturaSelecionado, setTipoViaturaSelecionado] =
    useState<TipoViatura | null>(null);
  const [quantidade, setQuantidade] = useState(1);
  const [diasUso, setDiasUso] = useState(0);
  const [custoMntDia, setCustoMntDia] = useState<number>(0);
  const [valorAcionamento, setValorAcionamento] = useState<number>(0);

  const [categoriaSelecionada, setCategoriaSelecionada] = useState<
    "NAO_BLINDADA" | "BLINDADA" | "OUTRO"
  >("NAO_BLINDADA");

  const [nomeViaturaCustomizado, setNomeViaturaCustomizado] =
    useState<string>("");
  const [grupoCustomizado, setGrupoCustomizado] =
    useState<GrupoViatura>("GP1");

  const viaturasDisponiveis = listarTodasViaturas();

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
  }, [viaturas]);

  const calcular = () => {
    if (viaturas.length === 0) {
      setValorTotal(null);
      setCarimbo("");
      return;
    }

    try {
      const resultado = calcularClasseIX(
        { viaturas },
        planoOm?.sigla,
        operacao.nome,
        getNaturezasCodigos()
      );
      setValorTotal(resultado.valorTotal);
      setCarimbo(resultado.detalhamento);
      setCarimboEditadoManualmente(false);
      onChange({
        params: { viaturas },
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
    onChange({
      params: { viaturas },
      valor: valorTotal || 0,
      descricao: novoCarimbo,
    });
  };

  const handleResetCarimbo = () => {
    setCarimboEditadoManualmente(false);
    calcular();
  };

  const adicionarViatura = () => {
    // Validações para categoria "OUTRO"
    if (categoriaSelecionada === "OUTRO") {
      if (
        !nomeViaturaCustomizado.trim() ||
        quantidade <= 0 ||
        diasUso <= 0 ||
        custoMntDia <= 0 ||
        valorAcionamento <= 0
      ) {
        return;
      }
    } else {
      // Validações para categorias padrão
      if (
        !tipoViaturaSelecionado ||
        quantidade <= 0 ||
        diasUso <= 0 ||
        custoMntDia <= 0 ||
        valorAcionamento <= 0
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

    if (categoriaSelecionada === "OUTRO") {
      // Para categoria "OUTRO", criar viatura customizada
      const novaViatura: ItemViatura = {
        tipoViatura: "OUTRO" as TipoViatura,
        nomeCustomizado: nomeViaturaCustomizado.trim(),
        grupoCustomizado: grupoCustomizado,
        quantidade,
        diasUso,
        custoMntDiaCustomizado: custoMntDia,
        valorAcionamentoCustomizado: valorAcionamento,
      };

      setViaturas([...viaturas, novaViatura]);
    } else {
      // Para categorias padrão
      const viaturaPadrao =
        VIATURAS[tipoViaturaSelecionado! as Exclude<TipoViatura, "OUTRO">];
      const isCustoCustomizado = custoMntDia !== viaturaPadrao.custoMntDia;
      const isAcionamentoCustomizado =
        valorAcionamento !== viaturaPadrao.valorAcionamento;

      const novaViatura: ItemViatura = {
        tipoViatura: tipoViaturaSelecionado!,
        quantidade,
        diasUso,
        ...(isCustoCustomizado && { custoMntDiaCustomizado: custoMntDia }),
        ...(isAcionamentoCustomizado && {
          valorAcionamentoCustomizado: valorAcionamento,
        }),
      };

      setViaturas([...viaturas, novaViatura]);
    }

    resetFormulario();
  };

  const resetFormulario = () => {
    setTipoViaturaSelecionado(null);
    setQuantidade(1);
    setDiasUso(0);
    setCustoMntDia(0);
    setValorAcionamento(0);
    setNomeViaturaCustomizado("");
    setGrupoCustomizado("GP1");
  };

  const handleTipoViaturaChange = (tipo: TipoViatura | null) => {
    setTipoViaturaSelecionado(tipo);
    if (tipo && tipo !== "OUTRO") {
      setCustoMntDia(
        VIATURAS[tipo as Exclude<TipoViatura, "OUTRO">].custoMntDia
      );
      setValorAcionamento(
        VIATURAS[tipo as Exclude<TipoViatura, "OUTRO">].valorAcionamento
      );
    } else {
      setCustoMntDia(0);
      setValorAcionamento(0);
    }
  };

  const handleCategoriaChange = (
    categoria: "NAO_BLINDADA" | "BLINDADA" | "OUTRO"
  ) => {
    setCategoriaSelecionada(categoria);
    setTipoViaturaSelecionado(null);
    setCustoMntDia(0);
    setValorAcionamento(0);
    setNomeViaturaCustomizado("");
    setGrupoCustomizado("GP1");
  };

  const removerViatura = (index: number) => {
    setViaturas(viaturas.filter((_, i) => i !== index));
  };

  const calcularCustoItem = (item: ItemViatura): number => {
    const custoMntDia = getCustoMntDiaEfetivo(item);
    const valorAcionamento = getValorAcionamentoEfetivo(item);
    const ciclos = calcularCiclos30Dias(item.diasUso);

    const custoManutencao = item.diasUso * custoMntDia;
    const custoAcionamento = ciclos * valorAcionamento;
    const custoUnitario = custoManutencao + custoAcionamento;

    return item.quantidade * custoUnitario;
  };

  const viaturaSelecionadaInfo =
    tipoViaturaSelecionado && tipoViaturaSelecionado !== "OUTRO"
      ? VIATURAS[tipoViaturaSelecionado as Exclude<TipoViatura, "OUTRO">]
      : null;

  return (
    <div className="space-y-4">
      {viaturas.length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Viaturas Adicionadas
          </label>
          {viaturas.map((item, index) => {
            const viatura =
              item.tipoViatura !== "OUTRO"
                ? VIATURAS[item.tipoViatura as Exclude<TipoViatura, "OUTRO">]
                : null;
            const custoMntDia = getCustoMntDiaEfetivo(item);
            const valorAcionamento = getValorAcionamentoEfetivo(item);
            const ciclos = calcularCiclos30Dias(item.diasUso);
            const custoItem = calcularCustoItem(item);
            const grupo = getGrupoViatura(item);
            const grupoTexto = GRUPOS_VIATURA[grupo];
            const isCustomizado =
              item.custoMntDiaCustomizado !== undefined ||
              item.valorAcionamentoCustomizado !== undefined;

            return (
              <div
                key={index}
                className="bg-gray-50 border border-gray-200 rounded-md p-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                        {item.tipoViatura === "OUTRO"
                          ? "Outro"
                          : viatura?.categoria === "BLINDADA"
                          ? "Blindada"
                          : "Não Blindada"}
                      </span>
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                        {grupoTexto}
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
                        {item.quantidade}x{" "}
                        {item.tipoViatura === "OUTRO"
                          ? item.nomeCustomizado || "Viatura Customizada"
                          : viatura?.nome}
                      </p>
                      <p>
                        Mnt: {item.diasUso} dias × R$ {custoMntDia.toFixed(2)}
                        /dia
                      </p>
                      <p>
                        Acion: {ciclos} ciclo(s) × R${" "}
                        {valorAcionamento.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removerViatura(index)}
                    className="ml-2 p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Remover viatura"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="bg-purple-50 border border-purple-200 rounded-md p-4 space-y-3">
        <p className="text-sm font-semibold text-purple-900">
          Adicionar Viatura
        </p>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Categoria
          </label>
          <div className="flex gap-2">
            {(["NAO_BLINDADA", "BLINDADA", "OUTRO"] as const).map(
              (categoria) => (
                <button
                  key={categoria}
                  type="button"
                  onClick={() => handleCategoriaChange(categoria)}
                  className={`px-3 py-1 text-xs rounded-md transition-all ${
                    categoriaSelecionada === categoria
                      ? "bg-purple-600 text-white"
                      : "bg-white border border-purple-300 text-purple-700 hover:bg-purple-100"
                  }`}
                >
                  {categoria === "NAO_BLINDADA"
                    ? "Não Blindada"
                    : categoria === "BLINDADA"
                    ? "Blindada"
                    : "Outro"}
                </button>
              )
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Tipo de Viatura <span className="text-red-500">*</span>
          </label>
          <select
            value={tipoViaturaSelecionado || ""}
            onChange={(e) =>
              handleTipoViaturaChange((e.target.value as TipoViatura) || null)
            }
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
          >
            <option value="">Selecione uma viatura</option>
            {viaturasDisponiveis
              .filter((v) => v.info.categoria === categoriaSelecionada)
              .map((v) => (
                <option key={v.tipo} value={v.tipo}>
                  {v.info.nome}
                </option>
              ))}
          </select>
        </div>

        {categoriaSelecionada === "OUTRO" && (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Nome da Viatura <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={nomeViaturaCustomizado}
                onChange={(e) => setNomeViaturaCustomizado(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
                placeholder="Ex: Caminhão Especial, Viatura XYZ..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Grupo da Viatura <span className="text-red-500">*</span>
              </label>
              <select
                value={grupoCustomizado}
                onChange={(e) =>
                  setGrupoCustomizado(e.target.value as GrupoViatura)
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
              >
                {(Object.entries(GRUPOS_VIATURA) as [GrupoViatura, string][]).map(
                  ([grupo, nome]) => (
                    <option key={grupo} value={grupo}>
                      {nome}
                    </option>
                  )
                )}
              </select>
            </div>
          </>
        )}

        {(viaturaSelecionadaInfo || categoriaSelecionada === "OUTRO") && (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Custo Manutenção/Dia (R$){" "}
                <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  disabled
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
                {viaturaSelecionadaInfo &&
                  custoMntDia !== viaturaSelecionadaInfo.custoMntDia && (
                    <button
                      type="button"
                      onClick={() =>
                        setCustoMntDia(viaturaSelecionadaInfo.custoMntDia)
                      }
                      className="text-xs text-blue-600 hover:text-blue-800 underline whitespace-nowrap"
                    >
                      Restaurar padrão
                    </button>
                  )}
              </div>
              {viaturaSelecionadaInfo && (
                <p className="text-xs text-gray-500 mt-1">
                  Valor padrão: R${" "}
                  {viaturaSelecionadaInfo.custoMntDia.toFixed(2)}
                  /dia
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Valor Acionamento (R$) <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  disabled={categoriaSelecionada !== "OUTRO"}
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={valorAcionamento || ""}
                  onChange={(e) =>
                    setValorAcionamento(parseFloat(e.target.value) || 0)
                  }
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
                  placeholder="0.00"
                />
                {viaturaSelecionadaInfo &&
                  valorAcionamento !==
                    viaturaSelecionadaInfo.valorAcionamento && (
                    <button
                      type="button"
                      onClick={() =>
                        setValorAcionamento(
                          viaturaSelecionadaInfo.valorAcionamento
                        )
                      }
                      className="text-xs text-blue-600 hover:text-blue-800 underline whitespace-nowrap"
                    >
                      Restaurar padrão
                    </button>
                  )}
              </div>
              {viaturaSelecionadaInfo && (
                <p className="text-xs text-gray-500 mt-1">
                  Valor padrão: R${" "}
                  {viaturaSelecionadaInfo.valorAcionamento.toFixed(2)}
                </p>
              )}
            </div>
          </>
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

        {(viaturaSelecionadaInfo || categoriaSelecionada === "OUTRO") &&
          quantidade > 0 &&
          diasUso > 0 &&
          custoMntDia > 0 &&
          valorAcionamento > 0 && (
            <div className="bg-white rounded p-2 text-xs text-gray-600">
              <p>
                <strong>Custo estimado:</strong>
              </p>
              <p className="mt-1">
                Mnt: {diasUso} dias × R$ {custoMntDia.toFixed(2)}/dia = R${" "}
                {(diasUso * custoMntDia).toFixed(2)}
              </p>
              <p>
                Acion: {calcularCiclos30Dias(diasUso)} ciclo(s) × R${" "}
                {valorAcionamento.toFixed(2)} = R${" "}
                {(calcularCiclos30Dias(diasUso) * valorAcionamento).toFixed(2)}
              </p>
              <p className="mt-1">
                <strong>Unitário:</strong>{" "}
                <span className="font-semibold text-purple-700">
                  R${" "}
                  {(
                    diasUso * custoMntDia +
                    calcularCiclos30Dias(diasUso) * valorAcionamento
                  ).toFixed(2)}
                </span>
              </p>
              <p>
                <strong>Total ({quantidade}x):</strong>{" "}
                <span className="font-semibold text-green-700">
                  R${" "}
                  {(
                    quantidade *
                    (diasUso * custoMntDia +
                      calcularCiclos30Dias(diasUso) * valorAcionamento)
                  ).toFixed(2)}
                </span>
              </p>
            </div>
          )}

        <button
          type="button"
          onClick={adicionarViatura}
          disabled={
            categoriaSelecionada === "OUTRO"
              ? !nomeViaturaCustomizado.trim() ||
                quantidade <= 0 ||
                diasUso <= 0 ||
                custoMntDia <= 0 ||
                valorAcionamento <= 0
              : !tipoViaturaSelecionado ||
                quantidade <= 0 ||
                diasUso <= 0 ||
                custoMntDia <= 0 ||
                valorAcionamento <= 0
          }
          className="w-full px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Adicionar Viatura
        </button>
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
