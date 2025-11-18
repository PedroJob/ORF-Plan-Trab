'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArrowLeft, Plus, Trash2, Check, X } from 'lucide-react';
import Link from 'next/link';

interface ItemFinanceiro {
  id: string;
  descricao: string;
  valorUnitario: number;
  quantidade: number;
  valorTotal: number;
  om: {
    id: string;
    nome: string;
    sigla: string;
    codUG: string;
  };
  natureza: {
    id: string;
    codigo: string;
    nome: string;
  };
}

interface PlanoTrabalho {
  id: string;
  titulo: string;
  versao: number;
  status: string;
  prioridade: string;
  operacao: {
    id: string;
    nome: string;
    om: {
      id: string;
      nome: string;
      sigla: string;
    };
  };
  responsavel: {
    nomeCompleto: string;
    postoGraduacao: string;
  };
}

interface OM {
  id: string;
  nome: string;
  sigla: string;
  tipo: string;
  codUG: string;
}

interface Natureza {
  id: string;
  codigo: string;
  nome: string;
  descricao: string | null;
}

export default function PlanoTrabalhoPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [plano, setPlano] = useState<PlanoTrabalho | null>(null);
  const [itens, setItens] = useState<ItemFinanceiro[]>([]);
  const [oms, setOms] = useState<OM[]>([]);
  const [naturezas, setNaturezas] = useState<Natureza[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddItem, setShowAddItem] = useState(false);

  // Form state for new item
  const [newItem, setNewItem] = useState({
    descricao: '',
    valorUnitario: '',
    quantidade: '',
    omId: '',
    naturezaId: '',
  });

  useEffect(() => {
    if (id) {
      fetchData();
      fetchOms();
      fetchNaturezas();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      const [planoRes, itensRes] = await Promise.all([
        fetch(`/api/planos/${id}`),
        fetch(`/api/planos/${id}/itens`),
      ]);

      if (planoRes.ok) {
        const planoData = await planoRes.json();
        setPlano(planoData);
      }

      if (itensRes.ok) {
        const itensData = await itensRes.json();
        setItens(itensData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOms = async () => {
    try {
      const response = await fetch('/api/organizacoes');
      if (response.ok) {
        const data = await response.json();
        setOms(data);
      }
    } catch (error) {
      console.error('Error fetching OMs:', error);
    }
  };

  const fetchNaturezas = async () => {
    try {
      const response = await fetch('/api/naturezas');
      if (response.ok) {
        const data = await response.json();
        setNaturezas(data);
      }
    } catch (error) {
      console.error('Error fetching naturezas:', error);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();

    const valorTotal = parseFloat(newItem.valorUnitario) * parseFloat(newItem.quantidade);

    try {
      const response = await fetch(`/api/planos/${id}/itens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          descricao: newItem.descricao,
          valorUnitario: parseFloat(newItem.valorUnitario),
          quantidade: parseFloat(newItem.quantidade),
          valorTotal,
          omId: newItem.omId,
          naturezaId: newItem.naturezaId,
        }),
      });

      if (response.ok) {
        const novoItem = await response.json();
        setItens([...itens, novoItem]);
        setNewItem({
          descricao: '',
          valorUnitario: '',
          quantidade: '',
          omId: '',
          naturezaId: '',
        });
        setShowAddItem(false);
      } else {
        const error = await response.json();
        console.error('Error response:', error);
        alert(`Erro ao adicionar item: ${error.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Erro ao adicionar item');
    }
  };

  const handleAprovar = async () => {
    if (!confirm('Deseja aprovar este plano de trabalho?')) return;

    try {
      const response = await fetch(`/api/planos/${id}/aprovar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao: 'APROVADO' }),
      });

      if (response.ok) {
        alert('Plano aprovado com sucesso!');
        fetchData();
      }
    } catch (error) {
      console.error('Error approving:', error);
    }
  };

  const handleReprovar = async () => {
    const motivo = prompt('Motivo da reprovação:');
    if (!motivo) return;

    try {
      const response = await fetch(`/api/planos/${id}/aprovar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao: 'REPROVADO', motivo }),
      });

      if (response.ok) {
        alert('Plano reprovado!');
        fetchData();
      }
    } catch (error) {
      console.error('Error rejecting:', error);
    }
  };

  const calcularTotal = () => {
    return itens.reduce((sum, item) => sum + item.valorTotal, 0);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!plano) {
    return <div>Plano não encontrado</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/dashboard/planos" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Planos
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{plano.titulo}</h1>
            <p className="text-gray-600 mt-1">
              Operação: {plano.operacao.nome} | Versão: {plano.versao}
            </p>
          </div>
          <div className="flex gap-2">
            {plano.status === 'EM_ANALISE' && (
              <>
                <Button variant="success" onClick={handleAprovar}>
                  <Check className="w-4 h-4 mr-2" />
                  Aprovar
                </Button>
                <Button variant="danger" onClick={handleReprovar}>
                  <X className="w-4 h-4 mr-2" />
                  Reprovar
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600">Status</div>
          <div className="text-lg font-semibold text-gray-900">{plano.status.replace('_', ' ')}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600">Responsável</div>
          <div className="text-lg font-semibold text-gray-900">
            {plano.responsavel.postoGraduacao} {plano.responsavel.nomeCompleto}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600">Valor Total</div>
          <div className="text-lg font-semibold text-blue-600">{formatCurrency(calcularTotal())}</div>
        </div>
      </div>

      {/* Itens Financeiros */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Itens Financeiros</h2>
          <Button size="sm" onClick={() => setShowAddItem(!showAddItem)}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Item
          </Button>
        </div>

        {showAddItem && (
          <form onSubmit={handleAddItem} className="mb-6 p-4 bg-military-50 rounded-lg space-y-4 border border-military-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-military-900 mb-1">
                  Descrição *
                </label>
                <Input
                  value={newItem.descricao}
                  onChange={(e) => setNewItem({ ...newItem, descricao: e.target.value })}
                  required
                  placeholder="Ex: Aquisição de gêneros alimentícios..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-military-900 mb-1">
                  Organização Militar *
                </label>
                <select
                  value={newItem.omId}
                  onChange={(e) => setNewItem({ ...newItem, omId: e.target.value })}
                  className="w-full px-4 py-2 border border-olive-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-military-500 focus:border-transparent bg-white"
                  required
                >
                  <option value="">Selecione uma OM</option>
                  {oms.map((om) => (
                    <option key={om.id} value={om.id}>
                      {om.sigla} - {om.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-military-900 mb-1">
                  Natureza de Despesa *
                </label>
                <select
                  value={newItem.naturezaId}
                  onChange={(e) => setNewItem({ ...newItem, naturezaId: e.target.value })}
                  className="w-full px-4 py-2 border border-olive-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-military-500 focus:border-transparent bg-white"
                  required
                >
                  <option value="">Selecione uma natureza</option>
                  {naturezas.map((natureza) => (
                    <option key={natureza.id} value={natureza.id}>
                      {natureza.codigo} - {natureza.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-military-900 mb-1">
                  Valor Unitário (R$) *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={newItem.valorUnitario}
                  onChange={(e) => setNewItem({ ...newItem, valorUnitario: e.target.value })}
                  required
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-military-900 mb-1">
                  Quantidade *
                </label>
                <Input
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={newItem.quantidade}
                  onChange={(e) => setNewItem({ ...newItem, quantidade: e.target.value })}
                  required
                  placeholder="1"
                />
              </div>
            </div>

            {newItem.valorUnitario && newItem.quantidade && (
              <div className="bg-white p-3 rounded border border-military-200">
                <span className="text-sm text-olive-700">Valor Total: </span>
                <span className="text-lg font-bold text-military-700">
                  {formatCurrency(parseFloat(newItem.valorUnitario) * parseFloat(newItem.quantidade))}
                </span>
              </div>
            )}

            <div className="flex gap-2">
              <Button type="submit" size="sm">Adicionar</Button>
              <Button type="button" size="sm" variant="secondary" onClick={() => setShowAddItem(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        )}

        {/* Tabela de Itens */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left p-3 text-sm font-medium text-gray-700">OM</th>
                <th className="text-left p-3 text-sm font-medium text-gray-700">Natureza</th>
                <th className="text-left p-3 text-sm font-medium text-gray-700">Descrição</th>
                <th className="text-right p-3 text-sm font-medium text-gray-700">Valor Unit.</th>
                <th className="text-right p-3 text-sm font-medium text-gray-700">Qtd</th>
                <th className="text-right p-3 text-sm font-medium text-gray-700">Total</th>
              </tr>
            </thead>
            <tbody>
              {itens.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-8 text-gray-500">
                    Nenhum item cadastrado
                  </td>
                </tr>
              ) : (
                itens.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3 text-sm text-gray-900">{item.om.sigla}</td>
                    <td className="p-3 text-sm text-gray-900">{item.natureza.nome}</td>
                    <td className="p-3 text-sm text-gray-600">{item.descricao}</td>
                    <td className="p-3 text-sm text-gray-900 text-right">{formatCurrency(item.valorUnitario)}</td>
                    <td className="p-3 text-sm text-gray-900 text-right">{item.quantidade}</td>
                    <td className="p-3 text-sm font-medium text-gray-900 text-right">
                      {formatCurrency(item.valorTotal)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-300">
                <td colSpan={5} className="p-3 text-right font-semibold text-gray-900">
                  Total:
                </td>
                <td className="p-3 text-right font-bold text-blue-600 text-lg">
                  {formatCurrency(calcularTotal())}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
