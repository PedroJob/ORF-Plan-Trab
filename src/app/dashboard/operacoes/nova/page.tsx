"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ArrowLeft, Plus, X, AlertCircle } from "lucide-react";
import Link from "next/link";

interface OM {
  id: string;
  nome: string;
  sigla: string;
  tipo: string;
  codUG: string;
}

interface OMParticipante {
  omId: string;
  valorLimite: string;
}

export default function NovaOperacaoPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [oms, setOms] = useState<OM[]>([]);
  const [loadingOms, setLoadingOms] = useState(true);

  const [formData, setFormData] = useState({
    nome: "",
    efetivoMil: "",
    efetivoExt: "",
    dataInicio: "",
    dataFinal: "",
    prioridade: "MEDIA",
    finalidade: "",
    motivacao: "",
    consequenciaNaoAtendimento: "",
    observacoes: "",
    valorLimiteTotal: "",
  });

  const [omsParticipantes, setOmsParticipantes] = useState<OMParticipante[]>([]);

  // Carregar OMs disponíveis
  useEffect(() => {
    async function loadOms() {
      try {
        const response = await fetch("/api/organizacoes");
        if (response.ok) {
          const data = await response.json();
          setOms(data);
        }
      } catch (err) {
        console.error("Erro ao carregar OMs:", err);
      } finally {
        setLoadingOms(false);
      }
    }
    loadOms();
  }, []);

  // Calcular soma dos valores das OMs
  const somaValoresOms = omsParticipantes.reduce(
    (acc, om) => acc + (parseFloat(om.valorLimite) || 0),
    0
  );

  const valorLimiteTotal = parseFloat(formData.valorLimiteTotal) || 0;
  const excedeLimite = valorLimiteTotal > 0 && somaValoresOms > valorLimiteTotal;
  const valorRestante = valorLimiteTotal - somaValoresOms;

  const handleAddOm = () => {
    setOmsParticipantes([...omsParticipantes, { omId: "", valorLimite: "" }]);
  };

  const handleRemoveOm = (index: number) => {
    setOmsParticipantes(omsParticipantes.filter((_, i) => i !== index));
  };

  const handleOmChange = (
    index: number,
    field: keyof OMParticipante,
    value: string
  ) => {
    const updated = [...omsParticipantes];
    updated[index] = { ...updated[index], [field]: value };
    setOmsParticipantes(updated);
  };

  // Filtrar OMs já selecionadas
  const omsDisponiveis = (currentIndex: number) => {
    const selectedIds = omsParticipantes
      .filter((_, i) => i !== currentIndex)
      .map((om) => om.omId);
    return oms.filter((om) => !selectedIds.includes(om.id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validar que soma não excede limite
    if (excedeLimite) {
      setError(
        "A soma dos valores das OMs participantes excede o valor limite total"
      );
      return;
    }

    // Validar que todas as OMs participantes estão preenchidas
    const omsIncompletas = omsParticipantes.some(
      (om) => !om.omId || !om.valorLimite
    );
    if (omsIncompletas) {
      setError("Preencha todos os campos das OMs participantes");
      return;
    }

    setIsLoading(true);

    try {
      // Criar datas ao meio-dia para evitar problemas de timezone
      const dataInicioDate = new Date(formData.dataInicio + "T12:00:00");
      const dataFinalDate = new Date(formData.dataFinal + "T12:00:00");

      const response = await fetch("/api/operacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          efetivoMil: parseInt(formData.efetivoMil),
          efetivoExt: formData.efetivoExt
            ? parseInt(formData.efetivoExt)
            : undefined,
          dataInicio: dataInicioDate.toISOString(),
          dataFinal: dataFinalDate.toISOString(),
          valorLimiteTotal: formData.valorLimiteTotal
            ? parseFloat(formData.valorLimiteTotal)
            : undefined,
          omsParticipantes:
            omsParticipantes.length > 0
              ? omsParticipantes.map((om) => ({
                  omId: om.omId,
                  valorLimite: parseFloat(om.valorLimite),
                }))
              : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao criar operação");
      }

      router.push(`/dashboard/operacoes/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar operação");
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/dashboard/operacoes"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Operações
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Nova Operação</h1>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados básicos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <Input
                label="Nome da Operação"
                value={formData.nome}
                onChange={(e) =>
                  setFormData({ ...formData, nome: e.target.value })
                }
                placeholder="Ex: Operação CATRIMANI II 2025"
                required
              />
            </div>

            <Input
              label="Efetivo (militares)"
              type="number"
              value={formData.efetivoMil}
              onChange={(e) =>
                setFormData({ ...formData, efetivoMil: e.target.value })
              }
              placeholder="500"
              min="1"
              required
            />
            <Input
              label="Efetivo (agentes externos)"
              type="number"
              value={formData.efetivoExt}
              onChange={(e) =>
                setFormData({ ...formData, efetivoExt: e.target.value })
              }
              placeholder="500"
              min="1"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prioridade <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.prioridade}
                onChange={(e) =>
                  setFormData({ ...formData, prioridade: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="BAIXA">Baixa</option>
                <option value="MEDIA">Média</option>
                <option value="ALTA">Alta</option>
                <option value="CRITICA">Crítica</option>
              </select>
            </div>

            <Input
              label="Valor Limite Total (R$)"
              type="number"
              value={formData.valorLimiteTotal}
              onChange={(e) =>
                setFormData({ ...formData, valorLimiteTotal: e.target.value })
              }
              placeholder="1000000.00"
              min="0"
              step="0.01"
            />

            <Input
              label="Data de Início"
              type="date"
              value={formData.dataInicio}
              onChange={(e) =>
                setFormData({ ...formData, dataInicio: e.target.value })
              }
              required
            />

            <Input
              label="Data Final"
              type="date"
              value={formData.dataFinal}
              onChange={(e) =>
                setFormData({ ...formData, dataFinal: e.target.value })
              }
              required
            />
          </div>

          {/* OMs Participantes */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  OMs Participantes
                </h3>
                <p className="text-sm text-gray-500">
                  Defina quais OMs participarão desta operação e seus valores
                  limite
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={handleAddOm}
                disabled={loadingOms}
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar OM
              </Button>
            </div>

            {omsParticipantes.length > 0 ? (
              <div className="space-y-3">
                {omsParticipantes.map((omPart, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Organização Militar
                      </label>
                      <select
                        value={omPart.omId}
                        onChange={(e) =>
                          handleOmChange(index, "omId", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Selecione uma OM</option>
                        {omsDisponiveis(index).map((om) => (
                          <option key={om.id} value={om.id}>
                            {om.sigla} - {om.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-48">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Valor Limite (R$)
                      </label>
                      <input
                        type="number"
                        value={omPart.valorLimite}
                        onChange={(e) =>
                          handleOmChange(index, "valorLimite", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveOm(index)}
                      className="mt-6 p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}

                {/* Resumo dos valores */}
                <div
                  className={`p-4 rounded-lg ${excedeLimite ? "bg-red-50 border border-red-200" : "bg-blue-50 border border-blue-200"}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Soma dos valores alocados:
                      </p>
                      <p
                        className={`text-lg font-bold ${excedeLimite ? "text-red-600" : "text-blue-600"}`}
                      >
                        {formatCurrency(somaValoresOms)}
                      </p>
                    </div>
                    {valorLimiteTotal > 0 && (
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-700">
                          {excedeLimite ? "Excedente:" : "Disponível:"}
                        </p>
                        <p
                          className={`text-lg font-bold ${excedeLimite ? "text-red-600" : "text-green-600"}`}
                        >
                          {formatCurrency(Math.abs(valorRestante))}
                        </p>
                      </div>
                    )}
                  </div>
                  {excedeLimite && (
                    <div className="flex items-center gap-2 mt-2 text-red-600">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">
                        A soma excede o valor limite total da operação
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <p className="text-gray-500">
                  Nenhuma OM participante adicionada
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Clique em &quot;Adicionar OM&quot; para definir as organizações
                  participantes
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex gap-4">
            <Button type="submit" isLoading={isLoading} disabled={excedeLimite}>
              Criar Operação
            </Button>
            <Link href="/dashboard/operacoes">
              <Button type="button" variant="secondary">
                Cancelar
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
