"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, FileText, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Prisma } from "@prisma/client";
import { useSession } from "@/hooks/useSession";

type PlanoTrabalho = Prisma.PlanoTrabalhoGetPayload<{
  include: {
    operacao: {
      include: {
        om: {
          select: {
            id: true;
            nome: true;
            sigla: true;
            tipo: true;
          };
        };
        omsParticipantes: {
          include: {
            om: {
              select: {
                id: true;
                nome: true;
                sigla: true;
              };
            };
          };
        };
      };
    };
    om: {
      select: {
        id: true;
        nome: true;
        sigla: true;
        tipo: true;
      };
    };
    responsavel: {
      select: {
        id: true;
        nomeCompleto: true;
        nomeGuerra: true;
        postoGraduacao: true;
      };
    };
    despesas: {
      select: {
        id: true;
        valorCalculado: true;
      };
    };
    _count: {
      select: {
        despesas: true;
        documentosReferencia: true;
        anotacoes: true;
      };
    };
  };
}>;

export default function PlanosPage() {
  const [planos, setPlanos] = useState<PlanoTrabalho[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const { user } = useSession();

  useEffect(() => {
    fetchPlanos();
  }, []);

  const fetchPlanos = async () => {
    try {
      const response = await fetch("/api/planos");
      const data = await response.json();
      // Garantir que sempre seja um array
      setPlanos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching planos:", error);
      setPlanos([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      RASCUNHO: "bg-olive-100 text-olive-800",
      EM_ANALISE: "bg-amber-100 text-amber-800",
      APROVADO: "bg-military-200 text-military-900",
      REPROVADO: "bg-red-100 text-red-800",
    };
    return (
      colors[status as keyof typeof colors] || "bg-olive-100 text-olive-800"
    );
  };

  const getPrioridadeColor = (prioridade: string) => {
    const colors = {
      BAIXA: "bg-military-100 text-military-700",
      MEDIA: "bg-amber-100 text-amber-700",
      ALTA: "bg-orange-100 text-orange-800",
      CRITICA: "bg-red-100 text-red-800",
    };
    return (
      colors[prioridade as keyof typeof colors] || "bg-olive-100 text-olive-800"
    );
  };

  const calcularTotal = (despesas: Array<{ valorCalculado: number }>) => {
    return despesas.reduce(
      (sum, despesa) => sum + Number(despesa.valorCalculado),
      0
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const filteredPlanos = statusFilter
    ? planos.filter((p) => p.status === statusFilter)
    : planos;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-military-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-military-900 mb-2">
            Planos de Trabalho
          </h1>
          <p className="text-olive-700">
            Gerenciar planos de trabalho logísticos
          </p>
        </div>
        <Link href="/dashboard/planos/novo">
          <Button>
            <Plus className="w-5 h-5 mr-2" />
            Novo Plano
          </Button>
        </Link>
      </div>

      {/* Filtros */}
      <div className="mb-6 flex gap-2 flex-wrap">
        <button
          onClick={() => setStatusFilter("")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            statusFilter === ""
              ? "bg-military-600 text-white"
              : "bg-white border border-olive-300 text-olive-800 hover:bg-olive-50"
          }`}
        >
          Todos ({planos.length})
        </button>
        <button
          onClick={() => setStatusFilter("RASCUNHO")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            statusFilter === "RASCUNHO"
              ? "bg-military-600 text-white"
              : "bg-white border border-olive-300 text-olive-800 hover:bg-olive-50"
          }`}
        >
          Rascunho ({planos.filter((p) => p.status === "RASCUNHO").length})
        </button>
        <button
          onClick={() => setStatusFilter("EM_ANALISE")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            statusFilter === "EM_ANALISE"
              ? "bg-military-600 text-white"
              : "bg-white border border-olive-300 text-olive-800 hover:bg-olive-50"
          }`}
        >
          Em Análise ({planos.filter((p) => p.status === "EM_ANALISE").length})
        </button>
        <button
          onClick={() => setStatusFilter("APROVADO")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            statusFilter === "APROVADO"
              ? "bg-military-600 text-white"
              : "bg-white border border-olive-300 text-olive-800 hover:bg-olive-50"
          }`}
        >
          Aprovado ({planos.filter((p) => p.status === "APROVADO").length})
        </button>
        <button
          onClick={() => setStatusFilter("REPROVADO")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            statusFilter === "REPROVADO"
              ? "bg-military-600 text-white"
              : "bg-white border border-olive-300 text-olive-800 hover:bg-olive-50"
          }`}
        >
          Reprovado ({planos.filter((p) => p.status === "REPROVADO").length})
        </button>
      </div>

      {filteredPlanos.length === 0 ? (
        <div className="bg-white rounded-lg border border-olive-200 p-12 text-center">
          <FileText className="w-16 h-16 text-olive-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-military-900 mb-2">
            {statusFilter
              ? "Nenhum plano encontrado"
              : "Nenhum plano cadastrado"}
          </h3>
          <p className="text-olive-700 mb-6">
            {statusFilter
              ? `Não há planos com status "${statusFilter.replace("_", " ")}"`
              : "Comece criando um novo plano de trabalho"}
          </p>
          {!statusFilter && (
            <Link href="/dashboard/planos/novo">
              <Button>
                <Plus className="w-5 h-5 mr-2" />
                Novo Plano
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredPlanos.map((plano) => (
            <Link
              key={plano.id}
              href={`/dashboard/planos/${plano.id}`}
              className="bg-white rounded-lg border border-olive-200 hover:shadow-lg hover:border-military-400 transition-all p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-military-900">
                      {plano.titulo}
                    </h3>
                    <span className="text-sm text-olive-600">
                      v{plano.versao}
                    </span>
                  </div>
                  <p className="text-olive-700 text-sm mb-2">
                    Operação: {plano.operacao.nome}
                  </p>
                  <p className="text-olive-600 text-xs">
                    {plano.operacao.om.sigla}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(
                      plano.status
                    )}`}
                  >
                    {plano.status.replace("_", " ")}
                  </span>
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full ${getPrioridadeColor(
                      plano.prioridade
                    )}`}
                  >
                    {plano.prioridade}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center text-sm text-olive-700">
                  <User className="w-4 h-4 mr-2" />
                  {plano.responsavel.postoGraduacao}{" "}
                  {plano.responsavel.nomeGuerra ||
                    plano.responsavel.nomeCompleto}
                </div>
                <div className="flex items-center text-sm text-olive-700">
                  <FileText className="w-4 h-4 mr-2" />
                  {plano._count.despesas} despesas
                </div>
                <div className="flex items-center text-sm text-olive-700">
                  <Calendar className="w-4 h-4 mr-2" />
                  {format(new Date(plano.updatedAt), "dd 'de' MMM 'de' yyyy", {
                    locale: ptBR,
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-olive-100">
                <div className="text-sm text-olive-600">
                  {plano._count.documentosReferencia} documento(s) •{" "}
                  {plano._count.anotacoes} anotação(ões)
                </div>
                <div className="text-lg font-bold text-military-700">
                  {formatCurrency(
                    calcularTotal(
                      plano.despesas.map((d) => ({
                        valorCalculado: Number(d.valorCalculado),
                      }))
                    )
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
