'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NovaOperacaoPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    nome: '',
    efetivoMil: '',
    efetivoExt: '',
    dataInicio: '',
    dataFinal: '',
    prioridade: 'MEDIA',
    finalidade: '',
    motivacao: '',
    consequenciaNaoAtendimento: '',
    observacoes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/operacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          efetivoMil: parseInt(formData.efetivoMil),
          efetivoExt: formData.efetivoExt ? parseInt(formData.efetivoExt) : undefined,
          dataInicio: new Date(formData.dataInicio).toISOString(),
          dataFinal: new Date(formData.dataFinal).toISOString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar operação');
      }

      router.push(`/dashboard/operacoes/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar operação');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <Link href="/dashboard/operacoes" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Operações
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Nova Operação</h1>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <Input
                label="Nome da Operação"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Operação CATRIMANI II 2025"
                required
              />
            </div>

            <Input
              label="Efetivo (militares)"
              type="number"
              value={formData.efetivoMil}
              onChange={(e) => setFormData({ ...formData, efetivoMil: e.target.value })}
              placeholder="500"
              min="1"
              required
            />
            <Input
              label="Efetivo (agentes externos)"
              type="number"
              value={formData.efetivoExt}
              onChange={(e) => setFormData({ ...formData, efetivoExt: e.target.value })}
              placeholder="500"
              min="1"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prioridade <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.prioridade}
                onChange={(e) => setFormData({ ...formData, prioridade: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="BAIXA">Baixa</option>
                <option value="MEDIA">Média</option>
                <option value="ALTA">Alta</option>
                <option value="CRITICA">Crítica</option>
              </select>
            </div>

            <br />

            <Input
              label="Data de Início"
              type="date"
              value={formData.dataInicio}
              onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })}
              required
            />

            <Input
              label="Data Final"
              type="date"
              value={formData.dataFinal}
              onChange={(e) => setFormData({ ...formData, dataFinal: e.target.value })}
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex gap-4">
            <Button type="submit" isLoading={isLoading}>
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
