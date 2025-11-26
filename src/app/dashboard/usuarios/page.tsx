'use client';

import { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, Building2, Mail, Phone, User, Lock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface User {
  id: string;
  email: string;
  nomeCompleto: string;
  nomeGuerra: string | null;
  postoGraduacao: string;
  telefone: string | null;
  role: string;
  isActive: boolean;
  om: {
    id: string;
    nome: string;
    sigla: string;
    tipo: string;
  };
  createdAt: string;
}

interface OM {
  id: string;
  nome: string;
  sigla: string;
  tipo: string;
  codUG: string;
}

const ROLE_LABELS: Record<string, string> = {
  COMANDANTE: 'Comandante',
  S4: 'S4',
  INTEGRANTE: 'Integrante',
  SUPER_ADMIN: 'Super Admin',
};

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [oms, setOms] = useState<OM[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    nomeCompleto: '',
    nomeGuerra: '',
    postoGraduacao: '',
    telefone: '',
    role: 'INTEGRANTE',
    omId: '',
    senha: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadUsers();
    loadOms();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Erro ao carregar usuários');
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError('Erro ao carregar usuários');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadOms = async () => {
    try {
      const response = await fetch('/api/organizacoes');
      if (!response.ok) throw new Error('Erro ao carregar OMs');
      const data = await response.json();
      setOms(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          nomeGuerra: formData.nomeGuerra || undefined,
          telefone: formData.telefone || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.details) {
          const errors: Record<string, string> = {};
          data.details.forEach((err: any) => {
            if (err.path && err.path[0]) {
              errors[err.path[0]] = err.message;
            }
          });
          setFormErrors(errors);
        } else {
          setError(data.error || 'Erro ao criar usuário');
        }
        return;
      }

      setSuccess('Usuário criado com sucesso!');
      setShowCreateModal(false);
      setFormData({
        email: '',
        nomeCompleto: '',
        nomeGuerra: '',
        postoGraduacao: '',
        telefone: '',
        role: 'INTEGRANTE',
        omId: '',
        senha: '',
      });
      loadUsers();

      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError('Erro ao criar usuário');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao atualizar usuário');
      }

      setSuccess(`Usuário ${!currentStatus ? 'ativado' : 'desativado'} com sucesso!`);
      loadUsers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar usuário');
      setTimeout(() => setError(null), 5000);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.nomeCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.om.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.om.sigla.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-olive-700">Carregando...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-military-900 mb-2">Gerenciamento de Usuários</h1>
          <p className="text-olive-700">Administrar usuários e permissões do sistema</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          Novo Usuário
        </Button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 bg-military-50 border border-military-200 text-military-800 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      <div className="mb-6">
        <Input
          type="text"
          placeholder="Buscar por nome, email ou OM..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="bg-white rounded-lg border border-olive-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-military-50 border-b border-olive-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-military-900 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-military-900 uppercase tracking-wider">
                  OM
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-military-900 uppercase tracking-wider">
                  Permissão
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-military-900 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-military-900 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-olive-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-olive-600">
                    Nenhum usuário encontrado
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-olive-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-military-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-military-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-military-900">
                            {user.postoGraduacao} {user.nomeGuerra || user.nomeCompleto}
                          </div>
                          <div className="text-sm text-olive-600">{user.email}</div>
                          {user.telefone && (
                            <div className="text-sm text-olive-500 flex items-center gap-1 mt-1">
                              <Phone className="w-3 h-3" />
                              {user.telefone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-olive-600" />
                        <div>
                          <div className="font-medium text-military-900">{user.om.sigla}</div>
                          <div className="text-sm text-olive-600">{user.om.nome}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-military-600" />
                        <span className="text-sm font-medium text-military-800">
                          {ROLE_LABELS[user.role] || user.role}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {user.isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Inativo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Button
                        variant={user.isActive ? 'danger' : 'success'}
                        size="sm"
                        onClick={() => handleToggleActive(user.id, user.isActive)}
                      >
                        {user.isActive ? 'Desativar' : 'Ativar'}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-olive-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-military-900 flex items-center gap-2">
                  <UserPlus className="w-6 h-6" />
                  Novo Usuário
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-olive-500 hover:text-olive-700"
                >
                  ✕
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-military-900 mb-1">
                    Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-olive-500" />
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                  {formErrors.email && (
                    <p className="text-red-600 text-sm mt-1">{formErrors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-military-900 mb-1">
                    Senha *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-olive-500" />
                    <Input
                      type="password"
                      value={formData.senha}
                      onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                  {formErrors.senha && (
                    <p className="text-red-600 text-sm mt-1">{formErrors.senha}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-military-900 mb-1">
                  Nome Completo *
                </label>
                <Input
                  type="text"
                  value={formData.nomeCompleto}
                  onChange={(e) => setFormData({ ...formData, nomeCompleto: e.target.value })}
                  required
                />
                {formErrors.nomeCompleto && (
                  <p className="text-red-600 text-sm mt-1">{formErrors.nomeCompleto}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-military-900 mb-1">
                    Nome de Guerra
                  </label>
                  <Input
                    type="text"
                    value={formData.nomeGuerra}
                    onChange={(e) => setFormData({ ...formData, nomeGuerra: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-military-900 mb-1">
                    Posto/Graduação *
                  </label>
                  <Input
                    type="text"
                    value={formData.postoGraduacao}
                    onChange={(e) => setFormData({ ...formData, postoGraduacao: e.target.value })}
                    placeholder="Ex: Cap, Maj, Cel"
                    required
                  />
                  {formErrors.postoGraduacao && (
                    <p className="text-red-600 text-sm mt-1">{formErrors.postoGraduacao}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-military-900 mb-1">
                  Telefone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-olive-500" />
                  <Input
                    type="tel"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    className="pl-10"
                    placeholder="(92) 98765-4321"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-military-900 mb-1">
                    Permissão *
                  </label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-olive-500 pointer-events-none" />
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-olive-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-military-500 focus:border-transparent bg-white"
                      required
                    >
                      {Object.entries(ROLE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  {formErrors.role && (
                    <p className="text-red-600 text-sm mt-1">{formErrors.role}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-military-900 mb-1">
                    Organização Militar *
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-olive-500 pointer-events-none" />
                    <select
                      value={formData.omId}
                      onChange={(e) => setFormData({ ...formData, omId: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-olive-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-military-500 focus:border-transparent bg-white"
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
                  {formErrors.omId && (
                    <p className="text-red-600 text-sm mt-1">{formErrors.omId}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-olive-200">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowCreateModal(false)}
                  disabled={submitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Criando...' : 'Criar Usuário'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
