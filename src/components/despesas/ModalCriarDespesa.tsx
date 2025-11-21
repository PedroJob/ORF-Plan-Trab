'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Loader2 } from 'lucide-react';
import { RateioOMs } from './RateioOMs';
import { SeletorNaturezas } from './SeletorNaturezas';
import {
  FormularioClasseI,
  FormularioClasseII,
  FormularioClasseIII,
  FormularioClasseIV,
  FormularioClasseV,
  FormularioClasseVI,
  FormularioClasseVII,
  FormularioClasseVIII,
  FormularioClasseIX,
  FormularioClasseX,
} from './formularios';

interface Classe {
  id: string;
  nome: string;
  descricao: string;
  naturezasPermitidas: string[];
  possuiCalculoAutomatizado: boolean;
}

interface Tipo {
  id: string;
  nome: string;
  isCombustivel: boolean;
  isCriavelUsuario: boolean;
}

interface OM {
  id: string;
  nome: string;
  sigla: string;
  codUG: string;
}

interface RateioOM {
  omId: string;
  percentual: number;
}

interface Operacao {
  id: string;
  nome: string;
  efetivo: number;
  dataInicio: string;
  dataFinal: string;
}

interface ModalCriarDespesaProps {
  isOpen: boolean;
  onClose: () => void;
  planoId: string;
  oms: OM[];
  operacao: Operacao;
  onSuccess: () => void;
}

export function ModalCriarDespesa({
  isOpen,
  onClose,
  planoId,
  oms,
  operacao,
  onSuccess,
}: ModalCriarDespesaProps) {
  const [loading, setLoading] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingTipos, setLoadingTipos] = useState(false);
  const [loadingCriarTipo, setLoadingCriarTipo] = useState(false);

  const [classes, setClasses] = useState<Classe[]>([]);
  const [tipos, setTipos] = useState<Tipo[]>([]);

  const [classeId, setClasseId] = useState('');
  const [tipoId, setTipoId] = useState('');
  const [descricao, setDescricao] = useState('');
  const [naturezas, setNaturezas] = useState<string[]>([]);
  const [rateioOMs, setRateioOMs] = useState<RateioOM[]>([]);
  const [parametros, setParametros] = useState<any>(null);
  const [valorTotal, setValorTotal] = useState<number>(0);
  const [valorCombustivel, setValorCombustivel] = useState<number | undefined>(undefined);

  const [showCriarTipo, setShowCriarTipo] = useState(false);
  const [novoTipoNome, setNovoTipoNome] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const classeSelecionada = classes.find(c => c.id === classeId);
  const tipoSelecionado = tipos.find(t => t.id === tipoId);

  useEffect(() => {
    if (isOpen) {
      carregarClasses();
      resetForm();
    }
  }, [isOpen]);

  useEffect(() => {
    if (classeId) {
      carregarTipos(classeId);
      setTipoId('');
      setNaturezas([]);
      setParametros(null);
    }
  }, [classeId]);

  const carregarClasses = async () => {
    try {
      setLoadingClasses(true);
      const response = await fetch('/api/classes');
      if (response.ok) {
        const data = await response.json();
        setClasses(data);
      }
    } catch (error) {
      console.error('Erro ao carregar classes:', error);
    } finally {
      setLoadingClasses(false);
    }
  };

  const carregarTipos = async (classeId: string) => {
    try {
      setLoadingTipos(true);
      const response = await fetch(`/api/classes/${classeId}/tipos`);
      if (response.ok) {
        const data = await response.json();
        setTipos(data);
      }
    } catch (error) {
      console.error('Erro ao carregar tipos:', error);
    } finally {
      setLoadingTipos(false);
    }
  };

  const handleCriarTipo = async () => {
    if (!novoTipoNome.trim() || !classeId) return;

    try {
      setLoadingCriarTipo(true);
      const response = await fetch('/api/tipos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: novoTipoNome.trim(),
          classeId,
        }),
      });

      if (response.ok) {
        await carregarTipos(classeId);
        setNovoTipoNome('');
        setShowCriarTipo(false);
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao criar tipo');
      }
    } catch (error) {
      console.error('Erro ao criar tipo:', error);
      alert('Erro ao criar tipo');
    } finally {
      setLoadingCriarTipo(false);
    }
  };

  const resetForm = () => {
    setClasseId('');
    setTipoId('');
    setDescricao('');
    setNaturezas([]);
    setRateioOMs([]);
    setParametros(null);
    setValorTotal(0);
    setValorCombustivel(undefined);
    setShowCriarTipo(false);
    setNovoTipoNome('');
    setErrors({});
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!classeId) newErrors.classeId = 'Selecione uma classe';
    if (!tipoId) newErrors.tipoId = 'Selecione um tipo';
    if (!descricao.trim()) newErrors.descricao = 'Descrição é obrigatória';
    if (naturezas.length === 0) newErrors.naturezas = 'Selecione ao menos uma natureza';
    if (rateioOMs.length === 0) newErrors.rateioOMs = 'Adicione ao menos uma OM';

    const somaPercentuais = rateioOMs.reduce((sum, om) => sum + Number(om.percentual), 0);
    if (Math.abs(somaPercentuais - 100) > 0.01) {
      newErrors.rateioOMs = `A soma dos percentuais deve ser 100%. Soma atual: ${somaPercentuais.toFixed(2)}%`;
    }

    if (!parametros || valorTotal === 0) {
      newErrors.parametros = 'Preencha os parâmetros da despesa';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setLoading(true);

      const response = await fetch(`/api/planos/${planoId}/despesas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classeId,
          tipoId,
          descricao: descricao.trim(),
          naturezas,
          parametros,
          oms: rateioOMs,
        }),
      });

      if (response.ok) {
        onSuccess();
        onClose();
        resetForm();
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao criar despesa');
      }
    } catch (error) {
      console.error('Erro ao criar despesa:', error);
      alert('Erro ao criar despesa');
    } finally {
      setLoading(false);
    }
  };

  const renderFormularioClasse = () => {
    if (!classeSelecionada) return null;

    const handleParametrosChange = (params: any, valor: number, valorComb?: number) => {
      setParametros(params);
      setValorTotal(valor);
      setValorCombustivel(valorComb);
    };

    const formProps = {
      value: parametros,
      onChange: handleParametrosChange,
    };

    switch (classeSelecionada.nome) {
      case 'CLASSE_I':
        return <FormularioClasseI {...formProps} operacao={operacao} />;
      case 'CLASSE_II':
        return <FormularioClasseII {...formProps} />;
      case 'CLASSE_III':
        return <FormularioClasseIII {...formProps} />;
      case 'CLASSE_IV':
        return <FormularioClasseIV {...formProps} />;
      case 'CLASSE_V':
        return <FormularioClasseV {...formProps} />;
      case 'CLASSE_VI':
        return <FormularioClasseVI {...formProps} />;
      case 'CLASSE_VII':
        return <FormularioClasseVII {...formProps} />;
      case 'CLASSE_VIII':
        return <FormularioClasseVIII {...formProps} />;
      case 'CLASSE_IX':
        return <FormularioClasseIX {...formProps} />;
      case 'CLASSE_X':
        return <FormularioClasseX {...formProps} />;
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 overflow-y-auto py-8">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-xl font-bold text-gray-900">Nova Despesa Logística</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Classe */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Classe de Despesa <span className="text-red-500">*</span>
            </label>
            {loadingClasses ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
              </div>
            ) : (
              <select
                value={classeId}
                onChange={(e) => setClasseId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
              >
                <option value="">Selecione uma classe</option>
                {classes.map(classe => (
                  <option key={classe.id} value={classe.id}>
                    {classe.nome} - {classe.descricao}
                  </option>
                ))}
              </select>
            )}
            {errors.classeId && <p className="text-sm text-red-600 mt-1">{errors.classeId}</p>}
          </div>

          {/* Tipo */}
          {classeId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo <span className="text-red-500">*</span>
              </label>
              {loadingTipos ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                </div>
              ) : (
                <>
                  <select
                    value={tipoId}
                    onChange={(e) => setTipoId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent"
                  >
                    <option value="">Selecione um tipo</option>
                    {tipos.map(tipo => (
                      <option key={tipo.id} value={tipo.id}>
                        {tipo.nome} {tipo.isCombustivel && '(Combustível)'}
                      </option>
                    ))}
                  </select>

                  {!showCriarTipo && (
                    <button
                      type="button"
                      onClick={() => setShowCriarTipo(true)}
                      className="mt-2 text-sm text-green-700 hover:text-green-800 flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      Criar novo tipo
                    </button>
                  )}

                  {showCriarTipo && (
                    <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-md space-y-2">
                      <input
                        type="text"
                        value={novoTipoNome}
                        onChange={(e) => setNovoTipoNome(e.target.value)}
                        placeholder="Nome do novo tipo"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent text-sm"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleCriarTipo}
                          disabled={!novoTipoNome.trim() || loadingCriarTipo}
                          className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          {loadingCriarTipo && <Loader2 className="w-3 h-3 animate-spin" />}
                          Criar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowCriarTipo(false);
                            setNovoTipoNome('');
                          }}
                          className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
              {errors.tipoId && <p className="text-sm text-red-600 mt-1">{errors.tipoId}</p>}
            </div>
          )}

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição <span className="text-red-500">*</span>
            </label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-transparent resize-none"
              placeholder="Descreva a despesa..."
            />
            {errors.descricao && <p className="text-sm text-red-600 mt-1">{errors.descricao}</p>}
          </div>

          {/* Naturezas */}
          {classeSelecionada && (
            <SeletorNaturezas
              naturezasPermitidas={classeSelecionada.naturezasPermitidas}
              value={naturezas}
              onChange={setNaturezas}
              error={errors.naturezas}
            />
          )}

          {/* Parâmetros da Classe */}
          {classeSelecionada && tipoId && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Parâmetros de Cálculo - {classeSelecionada.nome}
              </h3>
              {renderFormularioClasse()}
              {errors.parametros && <p className="text-sm text-red-600 mt-2">{errors.parametros}</p>}
            </div>
          )}

          {/* Rateio OMs */}
          {classeSelecionada && (
            <div className="border-t pt-4">
              <RateioOMs
                oms={oms}
                value={rateioOMs}
                onChange={setRateioOMs}
                error={errors.rateioOMs}
              />
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Criar Despesa
          </button>
        </div>
      </div>
    </div>
  );
}
