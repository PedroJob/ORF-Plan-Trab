import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...\n');

  // Limpar dados existentes (opcional - cuidado em produção!)
  console.log('🗑️  Limpando dados existentes...');
  await prisma.auditoriaLog.deleteMany();
  await prisma.aprovacaoHistorico.deleteMany();
  await prisma.anotacao.deleteMany();
  await prisma.documentoReferencia.deleteMany();
  await prisma.itemFinanceiro.deleteMany();
  await prisma.naturezaDespesa.deleteMany();
  await prisma.planoTrabalho.deleteMany();
  await prisma.operacao.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organizacaoMilitar.deleteMany();

  // Criar estrutura de OMs (hierarquia)
  console.log('🏢 Criando estrutura organizacional...');

  const coter = await prisma.organizacaoMilitar.create({
    data: {
      nome: 'Comando de Operações Terrestres',
      sigla: 'COTER',
      tipo: 'COTER',
      codUG: '160548',
    },
  });
  console.log('  ✓ COTER criado');

  const cma = await prisma.organizacaoMilitar.create({
    data: {
      nome: 'Comando Militar da Amazônia',
      sigla: 'CMA',
      tipo: 'CMA',
      codUG: '160016',
      omPaiId: coter.id,
    },
  });
  console.log('  ✓ CMA criado');

  const brigada = await prisma.organizacaoMilitar.create({
    data: {
      nome: '1ª Brigada de Infantaria de Selva',
      sigla: '1ª Bda Inf Sl',
      tipo: 'BRIGADA',
      codUG: '160482',
      omPaiId: cma.id,
    },
  });
  console.log('  ✓ 1ª Brigada criada');

  const bec = await prisma.organizacaoMilitar.create({
    data: {
      nome: '6º Batalhão de Engenharia de Construção',
      sigla: '6º BEC',
      tipo: 'BATALHAO',
      codUG: '160353',
      omPaiId: brigada.id,
    },
  });
  console.log('  ✓ 6º BEC criado');

  const bis = await prisma.organizacaoMilitar.create({
    data: {
      nome: '7º Batalhão de Infantaria de Selva',
      sigla: '7º BIS',
      tipo: 'BATALHAO',
      codUG: '160352',
      omPaiId: brigada.id,
    },
  });
  console.log('  ✓ 7º BIS criado');

  const rm12 = await prisma.organizacaoMilitar.create({
    data: {
      nome: 'Comando da 12ª Região Militar',
      sigla: 'Cmdo 12ª RM',
      tipo: 'BRIGADA',
      codUG: '160014',
      omPaiId: cma.id,
    },
  });
  console.log('  ✓ 12ª RM criada');

  // Criar usuários
  console.log('\n👥 Criando usuários...');

  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@eb.mil.br',
      passwordHash: adminPassword,
      nomeCompleto: 'Administrador do Sistema',
      nomeGuerra: 'Admin',
      postoGraduacao: 'Gen Div',
      telefone: '(61) 3415-5000',
      role: 'SUPER_ADMIN',
      isActive: true,
      omId: coter.id,
    },
  });
  console.log('  ✓ Super Admin criado (admin@eb.mil.br / admin123)');

  const cmtCmaPassword = await bcrypt.hash('senha123', 10);
  const cmtCma = await prisma.user.create({
    data: {
      email: 'cmt.cma@eb.mil.br',
      passwordHash: cmtCmaPassword,
      nomeCompleto: 'Ricardo Augusto do Amaral Peixoto',
      nomeGuerra: 'Peixoto',
      postoGraduacao: 'Gen Div',
      telefone: '(92) 3659-1174',
      role: 'CMT_CMA',
      isActive: true,
      omId: cma.id,
    },
  });
  console.log('  ✓ Comandante CMA criado (cmt.cma@eb.mil.br / senha123)');

  const cmtBrigadaPassword = await bcrypt.hash('senha123', 10);
  const cmtBrigada = await prisma.user.create({
    data: {
      email: 'cmt.brigada@eb.mil.br',
      passwordHash: cmtBrigadaPassword,
      nomeCompleto: 'João da Silva Santos',
      nomeGuerra: 'Silva',
      postoGraduacao: 'Gen Bda',
      telefone: '(92) 3234-5678',
      role: 'CMT_BRIGADA',
      isActive: true,
      omId: brigada.id,
    },
  });
  console.log('  ✓ Comandante Brigada criado (cmt.brigada@eb.mil.br / senha123)');

  const cmtBecPassword = await bcrypt.hash('senha123', 10);
  const cmtBec = await prisma.user.create({
    data: {
      email: 'cmt.bec@eb.mil.br',
      passwordHash: cmtBecPassword,
      nomeCompleto: 'Carlos Alberto Oliveira',
      nomeGuerra: 'Oliveira',
      postoGraduacao: 'Cel',
      telefone: '(92) 3234-1111',
      role: 'CMT_OM',
      isActive: true,
      omId: bec.id,
    },
  });
  console.log('  ✓ Comandante 6º BEC criado (cmt.bec@eb.mil.br / senha123)');

  const integrantePassword = await bcrypt.hash('senha123', 10);
  const integrante = await prisma.user.create({
    data: {
      email: 'integrante@eb.mil.br',
      passwordHash: integrantePassword,
      nomeCompleto: 'José Maria Pereira',
      nomeGuerra: 'Pereira',
      postoGraduacao: 'Cap',
      telefone: '(92) 3234-2222',
      role: 'INTEGRANTE_OM',
      isActive: true,
      omId: bec.id,
    },
  });
  console.log('  ✓ Integrante OM criado (integrante@eb.mil.br / senha123)');

  // Criar naturezas de despesa
  console.log('\n💰 Criando naturezas de despesa...');

  const naturezas = [
    { codigo: 'GND-3-01', nome: 'Gêneros Alimentícios', descricao: 'Aquisição de gêneros alimentícios para complemento da alimentação' },
    { codigo: 'GND-3-02', nome: 'Combustível', descricao: 'Aquisição de combustível para viaturas e geradores' },
    { codigo: 'GND-3-03', nome: 'Manutenção de Comunicações/TI', descricao: 'Manutenção de equipamentos de comunicações, eletrônica e informática' },
    { codigo: 'GND-3-04', nome: 'Manutenção de Viaturas', descricao: 'Aquisição de peças e serviços para manutenção de viaturas' },
    { codigo: 'GND-3-05', nome: 'Manutenção de Embarcações', descricao: 'Aquisição de peças e serviços para embarcações' },
    { codigo: 'GND-3-06', nome: 'Suprimento de Fundos', descricao: 'Despesas eventuais e inopinadas' },
    { codigo: 'GND-3-07', nome: 'Diárias', descricao: 'Pagamento de diárias a militares' },
    { codigo: 'GND-3-08', nome: 'Passagens', descricao: 'Aquisição de passagem aérea e rodoviária' },
    { codigo: 'GND-3-09', nome: 'Locação de Veículos', descricao: 'Locação de veículos para transporte' },
    { codigo: 'GND-3-10', nome: 'Manutenção de Ar Condicionado', descricao: 'Serviços de manutenção de ar condicionado' },
    { codigo: 'GND-3-11', nome: 'Telecomunicações', descricao: 'Serviços de telecomunicações via satélite' },
    { codigo: 'GND-3-12', nome: 'Fretamento Aéreo', descricao: 'Contratação de fretamento aéreo' },
    { codigo: 'GND-3-13', nome: 'Materiais de Consumo', descricao: 'Aquisição de materiais de consumo diversos' },
    { codigo: 'GND-3-14', nome: 'Materiais de Higiene e Limpeza', descricao: 'Aquisição de materiais de higiene e limpeza' },
    { codigo: 'GND-3-15', nome: 'Verba Operacional de Inteligência', descricao: 'Custeio de atividades de inteligência' },
  ];

  for (const nat of naturezas) {
    await prisma.naturezaDespesa.create({ data: nat });
  }
  console.log(`  ✓ ${naturezas.length} naturezas de despesa criadas`);

  // Criar operação de exemplo
  console.log('\n🎯 Criando operação de exemplo...');

  const operacao = await prisma.operacao.create({
    data: {
      nome: 'Operação CATRIMANI II 2025',
      efetivo: 500,
      dataInicio: new Date('2025-01-01'),
      dataFinal: new Date('2025-12-31'),
      prioridade: 'ALTA',
      status: 'RASCUNHO',
      finalidade: 'Custear as necessidades de recursos financeiros nas ações logísticas e operacionais referentes à montagem, aperfeiçoamento e operação das Bases Interagências KAYANAÚ e PALIKAPI, DEF de WAIKÁS e 4º PEF, no contexto da Operação CATRIMANI II.',
      motivacao: 'A aplicação dos recursos solicitados é basilar para que as organizações militares empregadas tenham condições de atuar nas suas Z Aç no contexto da Operação CATRIMANI II.',
      consequenciaNaoAtendimento: 'A capacidade de realização das ações no contexto da Operação CATRIMANI II será comprometida, implicando em significativa redução de militares, materiais e equipamentos necessários ao eficaz cumprimento da missão coordenada pelo Comando Operacional Conjunto CATRIMANI.',
      observacoes: 'As memórias de cálculo detalhadas e parametrizadas das despesas custeadas serão mantidas em arquivos próprios. O bem e/ou serviço requisitado está de acordo com a "Descrição" da AO e com a "Caracterização" do PO do Cadastro de Ações do SIOP.',
      omId: cma.id,
    },
  });
  console.log('  ✓ Operação CATRIMANI II criada');

  // Log de auditoria
  await prisma.auditoriaLog.create({
    data: {
      tipoEvento: 'CRIACAO',
      descricao: `Operação "${operacao.nome}" criada via seed`,
      usuarioId: admin.id,
      operacaoId: operacao.id,
      metadados: { seed: true },
    },
  });

  console.log('\n✅ Seed concluído com sucesso!\n');
  console.log('═══════════════════════════════════════════════');
  console.log('📧 CREDENCIAIS DE ACESSO');
  console.log('═══════════════════════════════════════════════');
  console.log('');
  console.log('Super Admin:');
  console.log('  Email: admin@eb.mil.br');
  console.log('  Senha: admin123');
  console.log('');
  console.log('Comandante CMA:');
  console.log('  Email: cmt.cma@eb.mil.br');
  console.log('  Senha: senha123');
  console.log('');
  console.log('Comandante Brigada:');
  console.log('  Email: cmt.brigada@eb.mil.br');
  console.log('  Senha: senha123');
  console.log('');
  console.log('Comandante 6º BEC:');
  console.log('  Email: cmt.bec@eb.mil.br');
  console.log('  Senha: senha123');
  console.log('');
  console.log('Integrante OM:');
  console.log('  Email: integrante@eb.mil.br');
  console.log('  Senha: senha123');
  console.log('');
  console.log('═══════════════════════════════════════════════');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
