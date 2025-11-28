"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Folder,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface Stats {
  totalOperacoes: number;
  totalPlanos: number;
  planosAprovados: number;
  planosEmAnalise: number;
  planosReprovados: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalOperacoes: 0,
    totalPlanos: 0,
    planosAprovados: 0,
    planosEmAnalise: 0,
    planosReprovados: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [operacoesRes, planosRes] = await Promise.all([
        fetch("/api/operacoes"),
        fetch("/api/planos"),
      ]);

      const operacoes = await operacoesRes.json();
      const planos = await planosRes.json();

      // Verificar se planos é um array
      const planosArray = Array.isArray(planos) ? planos : [];
      const operacoesArray = Array.isArray(operacoes) ? operacoes : [];

      setStats({
        totalOperacoes: operacoesArray.length,
        totalPlanos: planosArray.length,
        planosAprovados: planosArray.filter((p: any) => p.status === "APROVADO")
          .length,
        planosEmAnalise: planosArray.filter(
          (p: any) => p.status === "EM_ANALISE"
        ).length,
        planosReprovados: planosArray.filter(
          (p: any) => p.status === "REPROVADO"
        ).length,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total de Operações",
      value: stats.totalOperacoes,
      icon: Folder,
      color: "blue",
      href: "/dashboard/operacoes",
    },
    {
      title: "Planos de Trabalho",
      value: stats.totalPlanos,
      icon: FileText,
      color: "purple",
      href: "/dashboard/planos",
    },
    {
      title: "Planos Aprovados",
      value: stats.planosAprovados,
      icon: CheckCircle,
      color: "green",
      href: "/dashboard/planos?status=APROVADO",
    },
    {
      title: "Em Análise",
      value: stats.planosEmAnalise,
      icon: Clock,
      color: "yellow",
      href: "/dashboard/planos?status=EM_ANALISE",
    },
    {
      title: "Reprovados",
      value: stats.planosReprovados,
      icon: XCircle,
      color: "red",
      href: "/dashboard/planos?status=REPROVADO",
    },
  ];

  const colorClasses = {
    blue: "bg-military-100 text-military-700",
    purple: "bg-olive-100 text-olive-700",
    green: "bg-military-200 text-military-800",
    yellow: "bg-amber-50 text-amber-700",
    red: "bg-red-100 text-red-700",
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-military-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-military-900 mb-2">Dashboard</h1>
        <p className="text-olive-700">Visão geral do sistema SisPTrab</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.title}
              href={stat.href}
              className="bg-white p-6 rounded-lg border border-olive-200 hover:shadow-lg hover:border-military-400 transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`p-3 rounded-lg ${
                    colorClasses[stat.color as keyof typeof colorClasses]
                  }`}
                >
                  <Icon className="w-6 h-6" />
                </div>
              </div>
              <div className="text-3xl font-bold text-military-900 mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-olive-700">{stat.title}</div>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-olive-200 p-6">
        <h2 className="text-xl font-semibold text-military-900 mb-4">
          Ações Rápidas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/dashboard/operacoes/nova">
            <Button className="w-full" variant="primary">
              <Plus className="w-5 h-5 mr-2" />
              Nova Operação
            </Button>
          </Link>
          <Link href="/dashboard/planos/novo">
            <Button className="w-full" variant="secondary">
              <Plus className="w-5 h-5 mr-2" />
              Novo Plano de Trabalho
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
