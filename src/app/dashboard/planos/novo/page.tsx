"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useSession } from "@/hooks/useSession";

interface OMParticipante {
  omId: string;
  om: {
    id: string;
    nome: string;
    sigla: string;
  };
}

interface Operacao {
  id: string;
  nome: string;
  status: string;
  om: {
    nome: string;
    sigla: string;
  };
  omsParticipantes: OMParticipante[];
}

export default function NovoPlanoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [operacoes, setOperacoes] = useState<Operacao[]>([]);
  const [loadingOperacoes, setLoadingOperacoes] = useState(true);

  const [formData, setFormData] = useState({
    titulo: "P Trab LOG CMA",
    operacaoId: searchParams.get("operacaoId") || "",
    prioridade: "MEDIA",
    tipo: "LOGISTICO",
    acoes: "",
    despesasOperacionais: "",
    omId: searchParams.get("omId") || user?.om.id || "",
  });

  useEffect(() => {
    fetchOperacoes();
  }, []);

  useEffect(() => {
    if (user?.om.id && !formData.omId) {
      setFormData((prev) => ({ ...prev, omId: user.om.id }));
    }
  }, [user?.om.id]);

  const fetchOperacoes = async () => {
    try {
      const response = await fetch("/api/operacoes");
      const data = await response.json();
      setOperacoes(data);
    } catch (error) {
      console.error("Error fetching operacoes:", error);
    } finally {
      setLoadingOperacoes(false);
    }
  };

  // Filtrar operações onde a OM pai do usuário participa
  const operacoesFiltradas = operacoes.filter((op) => {
    if (!user?.om.omPaiId) return true;

    return op.omsParticipantes.some(
      (p) => p.omId === user.om.omPaiId || p.omId === user.om.id
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/planos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao criar plano");
      }

      router.push(`/dashboard/planos/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar plano");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/dashboard/planos"
          className="inline-flex items-center text-olive-700 hover:text-military-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Planos
        </Link>
        <h1 className="text-3xl font-bold text-military-900">
          Novo Plano de Trabalho
        </h1>
      </div>

      <div className="bg-white rounded-lg border border-olive-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-olive-800 mb-1">
                Tipo de Plano <span className="text-red-600">*</span>
              </label>
              <select
                value={formData.tipo}
                onChange={(e) =>
                  setFormData({ ...formData, tipo: e.target.value })
                }
                className="w-full px-3 py-2 border border-olive-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-military-500 bg-white"
                required
              >
                <option value="LOGISTICO">Logístico</option>
                <option value="OPERACIONAL_GND3" disabled>
                  Operacional GND3 (Em desenvolvimento)
                </option>
                <option value="OPERACIONAL_GND4" disabled>
                  Operacional GND4 (Em desenvolvimento)
                </option>
                <option value="RACAO_R2" disabled>
                  Ração R2 (Em desenvolvimento)
                </option>
                <option value="MUNICAO" disabled>
                  Munição (Em desenvolvimento)
                </option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-olive-800 mb-1">
                Prioridade <span className="text-red-600">*</span>
              </label>
              <select
                value={formData.prioridade}
                onChange={(e) =>
                  setFormData({ ...formData, prioridade: e.target.value })
                }
                className="w-full px-3 py-2 border border-olive-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-military-500 bg-white"
                required
              >
                <option value="BAIXA">Baixa</option>
                <option value="MEDIA">Média</option>
                <option value="ALTA">Alta</option>
                <option value="CRITICA">Crítica</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <Input
                label="Título do Plano"
                value={formData.titulo}
                onChange={(e) =>
                  setFormData({ ...formData, titulo: e.target.value })
                }
                placeholder="Ex: Plano Logístico Operação CATRIMANI II"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-olive-800 mb-1">
                Operação <span className="text-red-600">*</span>
              </label>
              {loadingOperacoes ? (
                <div className="w-full px-3 py-2 border border-olive-300 rounded-lg bg-military-50 text-olive-700">
                  Carregando operações...
                </div>
              ) : operacoesFiltradas.length === 0 ? (
                <div className="space-y-2">
                  <div className="w-full px-3 py-2 border border-amber-300 rounded-lg bg-amber-50 text-amber-800">
                    Nenhuma operação disponível para sua OM
                  </div>
                </div>
              ) : (
                <select
                  value={formData.operacaoId}
                  onChange={(e) =>
                    setFormData({ ...formData, operacaoId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-olive-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-military-500 bg-white"
                  required
                >
                  <option value="">Selecione uma operação</option>
                  {operacoesFiltradas.map((op) => (
                    <option key={op.id} value={op.id}>
                      {op.nome} ({op.om.sigla}) - {op.status}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex gap-4">
            <Button
              type="submit"
              isLoading={isLoading}
              disabled={operacoesFiltradas.length === 0}
            >
              Criar Plano de Trabalho
            </Button>
            <Link href="/dashboard/planos">
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
