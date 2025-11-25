'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Calendar, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Operacao {
  id: string;
  nome: string;
  efetivoMil: number;
  efetivoExt?: number;
  dataInicio: string;
  dataFinal: string;
  status: string;
  prioridade: string;
  om: {
    nome: string;
    sigla: string;
  };
  planosTrabalho: Array<{ id: string; titulo: string; status: string }>;
}

export default function OperacoesPage() {
  const [operacoes, setOperacoes] = useState<Operacao[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOperacoes();
  }, []);

  const fetchOperacoes = async () => {
    try {
      const response = await fetch('/api/operacoes');
      const data = await response.json();
      setOperacoes(data);
    } catch (error) {
      console.error('Error fetching operacoes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      RASCUNHO: 'bg-gray-100 text-gray-800',
      EM_ANALISE: 'bg-yellow-100 text-yellow-800',
      APROVADO: 'bg-green-100 text-green-800',
      REPROVADO: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getPrioridadeColor = (prioridade: string) => {
    const colors = {
      BAIXA: 'bg-blue-100 text-blue-800',
      MEDIA: 'bg-yellow-100 text-yellow-800',
      ALTA: 'bg-orange-100 text-orange-800',
      CRITICA: 'bg-red-100 text-red-800',
    };
    return colors[prioridade as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Operações</h1>
          <p className="text-gray-600">Gerenciar operações militares</p>
        </div>
        <Link href="/dashboard/operacoes/nova">
          <Button>
            <Plus className="w-5 h-5 mr-2" />
            Nova Operação
          </Button>
        </Link>
      </div>

      {operacoes.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma operação cadastrada</h3>
          <p className="text-gray-600 mb-6">Comece criando uma nova operação</p>
          <Link href="/dashboard/operacoes/nova">
            <Button>
              <Plus className="w-5 h-5 mr-2" />
              Nova Operação
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {operacoes.map((operacao) => (
            <Link
              key={operacao.id}
              href={`/dashboard/operacoes/${operacao.id}`}
              className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{operacao.nome}</h3>
                  <p className="text-sm text-gray-600">{operacao.om.sigla}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPrioridadeColor(operacao.prioridade)}`}>
                  {operacao.prioridade}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="w-4 h-4 mr-2" />
                  {operacao.efetivoMil} militares {operacao.efetivoExt ? ` - ${operacao.efetivoExt} externos` : null}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  {format(new Date(operacao.dataInicio), 'dd MMM', { locale: ptBR })} - {format(new Date(operacao.dataFinal), 'dd MMM yyyy', { locale: ptBR })}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <span className="text-sm text-gray-600">
                  {operacao.planosTrabalho.length} plano(s)
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(operacao.status)}`}>
                  {operacao.status.replace('_', ' ')}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
