import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed do banco de dados...\n");

  // Limpar dados existentes (opcional - cuidado em produção!)
  console.log("🗑️  Limpando dados existentes...");
  await prisma.auditoriaLog.deleteMany();
  await prisma.aprovacaoHistorico.deleteMany();
  await prisma.anotacao.deleteMany();
  await prisma.documentoReferencia.deleteMany();
  await prisma.despesaOM.deleteMany();
  await prisma.despesaNatureza.deleteMany();
  await prisma.despesa.deleteMany();
  await prisma.tipo.deleteMany();
  await prisma.classe.deleteMany();
  await prisma.naturezaDespesa.deleteMany();
  await prisma.planoTrabalho.deleteMany();
  await prisma.operacaoOM.deleteMany();
  await prisma.operacao.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organizacaoMilitar.deleteMany();

  // Criar estrutura de OMs (hierarquia)
  console.log("🏢 Criando estrutura organizacional...");

  const coter = await prisma.organizacaoMilitar.create({
    data: {
      nome: "Comando de Operações Terrestres",
      sigla: "COTER",
      tipo: "COTER",
      codUG: "160548",
    },
  });
  console.log("  ✓ COTER criado");

  const cma = await prisma.organizacaoMilitar.create({
    data: {
      nome: "Comando Militar da Amazônia",
      sigla: "CMA",
      tipo: "CMA",
      codUG: "160016",
      omPaiId: coter.id,
    },
  });
  console.log("  ✓ CMA criado");

  const brigada = await prisma.organizacaoMilitar.create({
    data: {
      nome: "1ª Brigada de Infantaria de Selva",
      sigla: "1ª Bda Inf Sl",
      tipo: "BRIGADA",
      codUG: "160482",
      omPaiId: cma.id,
    },
  });
  console.log("  ✓ 1ª Brigada criada");

  const bec = await prisma.organizacaoMilitar.create({
    data: {
      nome: "6º Batalhão de Engenharia de Construção",
      sigla: "6º BEC",
      tipo: "BATALHAO",
      codUG: "160353",
      omPaiId: brigada.id,
    },
  });
  console.log("  ✓ 6º BEC criado");

  const bis = await prisma.organizacaoMilitar.create({
    data: {
      nome: "7º Batalhão de Infantaria de Selva",
      sigla: "7º BIS",
      tipo: "BATALHAO",
      codUG: "160352",
      omPaiId: brigada.id,
    },
  });
  console.log("  ✓ 7º BIS criado");

  const rm12 = await prisma.organizacaoMilitar.create({
    data: {
      nome: "Comando da 12ª Região Militar",
      sigla: "Cmdo 12ª RM",
      tipo: "BRIGADA",
      codUG: "160014",
      omPaiId: cma.id,
    },
  });
  console.log("  ✓ 12ª RM criada");

  // Criar usuários
  console.log("\n👥 Criando usuários...");

  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.create({
    data: {
      email: "admin@eb.mil.br",
      passwordHash: adminPassword,
      nomeCompleto: "Administrador do Sistema",
      nomeGuerra: "Admin",
      postoGraduacao: "Gen Div",
      telefone: "(61) 3415-5000",
      role: "SUPER_ADMIN",
      isActive: true,
      omId: coter.id,
    },
  });
  console.log("  ✓ Super Admin criado (admin@eb.mil.br / admin123)");

  // Comandante do 6º BEC
  const cmtBecPassword = await bcrypt.hash("senha123", 10);
  const cmtBec = await prisma.user.create({
    data: {
      email: "cmt.bec@eb.mil.br",
      passwordHash: cmtBecPassword,
      nomeCompleto: "Carlos Alberto Oliveira",
      nomeGuerra: "Oliveira",
      postoGraduacao: "Cel",
      telefone: "(92) 3234-1111",
      role: "COMANDANTE",
      isActive: true,
      omId: bec.id,
    },
  });
  console.log("  ✓ Comandante 6º BEC criado (cmt.bec@eb.mil.br / senha123)");

  // S4 do 6º BEC (responsável por aprovações)
  const s4BecPassword = await bcrypt.hash("senha123", 10);
  const s4Bec = await prisma.user.create({
    data: {
      email: "s4.bec@eb.mil.br",
      passwordHash: s4BecPassword,
      nomeCompleto: "Fernando Souza Lima",
      nomeGuerra: "Souza",
      postoGraduacao: "Maj",
      telefone: "(92) 3234-3333",
      role: "S4",
      isActive: true,
      omId: bec.id,
    },
  });
  console.log("  ✓ S4 6º BEC criado (s4.bec@eb.mil.br / senha123)");

  // Integrante do 6º BEC
  const integrantePassword = await bcrypt.hash("senha123", 10);
  const integrante = await prisma.user.create({
    data: {
      email: "integrante@eb.mil.br",
      passwordHash: integrantePassword,
      nomeCompleto: "José Maria Pereira",
      nomeGuerra: "Pereira",
      postoGraduacao: "Cap",
      telefone: "(92) 3234-2222",
      role: "INTEGRANTE",
      isActive: true,
      omId: bec.id,
    },
  });
  console.log("  ✓ Integrante OM criado (integrante@eb.mil.br / senha123)");

  // S4 do 7º BIS
  const s4BisPassword = await bcrypt.hash("senha123", 10);
  const s4Bis = await prisma.user.create({
    data: {
      email: "s4.bis@eb.mil.br",
      passwordHash: s4BisPassword,
      nomeCompleto: "Marcos Antônio Costa",
      nomeGuerra: "Costa",
      postoGraduacao: "Maj",
      telefone: "(92) 3234-4444",
      role: "S4",
      isActive: true,
      omId: bis.id,
    },
  });
  console.log("  ✓ S4 7º BIS criado (s4.bis@eb.mil.br / senha123)");

  // Criar naturezas de despesa (apenas as 2 válidas)
  console.log("\n💰 Criando naturezas de despesa...");

  const naturezas = [
    {
      codigo: "33.90.30",
      nome: "Material de Consumo",
      descricao:
        "Despesas com aquisição de materiais de consumo destinados à manutenção de bens imóveis e/ou serviços",
    },
    {
      codigo: "33.90.39",
      nome: "Outros Serviços de Terceiros - Pessoa Jurídica",
      descricao:
        "Despesas com aquisição de serviços eventuais de pessoas jurídicas",
    },
  ];

  for (const nat of naturezas) {
    await prisma.naturezaDespesa.create({ data: nat });
  }
  console.log(`  ✓ ${naturezas.length} naturezas de despesa criadas`);

  // Criar Classes (I a X) para Planos LOGISTICO
  console.log("\n📚 Criando classes de despesa...");

  const classeI = await prisma.classe.create({
    data: {
      nome: "CLASSE_I",
      descricao: "Material de Subsistência",
      gnd: "GND 3",
      naturezasPermitidas: ["33.90.30"],
      possuiCalculoAutomatizado: true,
    },
  });

  const classeII = await prisma.classe.create({
    data: {
      nome: "CLASSE_II",
      descricao: "Manutenção de Material de Intendência",
      gnd: "GND 3",
      naturezasPermitidas: ["33.90.30", "33.90.39"],
      possuiCalculoAutomatizado: true,
    },
  });

  const classeIII = await prisma.classe.create({
    data: {
      nome: "CLASSE_III",
      descricao: "Combustíveis e Lubrificantes",
      gnd: "GND 3",
      naturezasPermitidas: ["33.90.30"],
      possuiCalculoAutomatizado: true,
    },
  });

  const classeIV = await prisma.classe.create({
    data: {
      nome: "CLASSE_IV",
      descricao: "Material de Construção",
      gnd: "GND 3",
      naturezasPermitidas: ["33.90.30", "33.90.39"],
      possuiCalculoAutomatizado: true,
    },
  });

  const classeV = await prisma.classe.create({
    data: {
      nome: "CLASSE_V",
      descricao: "Munição e Explosivos",
      gnd: "GND 3",
      naturezasPermitidas: ["33.90.30"],
      possuiCalculoAutomatizado: true,
    },
  });

  const classeVI = await prisma.classe.create({
    data: {
      nome: "CLASSE_VI",
      descricao: "Material Individual",
      gnd: "GND 3",
      naturezasPermitidas: ["33.90.30"],
      possuiCalculoAutomatizado: true,
    },
  });

  const classeVII = await prisma.classe.create({
    data: {
      nome: "CLASSE_VII",
      descricao: "Equipamento Principal",
      gnd: "GND 3",
      naturezasPermitidas: ["33.90.30", "33.90.39"],
      possuiCalculoAutomatizado: true,
    },
  });

  const classeVIII = await prisma.classe.create({
    data: {
      nome: "CLASSE_VIII",
      descricao: "Material de Saúde",
      gnd: "GND 3",
      naturezasPermitidas: ["33.90.30", "33.90.39"],
      possuiCalculoAutomatizado: true,
    },
  });

  const classeIX = await prisma.classe.create({
    data: {
      nome: "CLASSE_IX",
      descricao: "Manutenção de Viaturas",
      gnd: "GND 3",
      naturezasPermitidas: ["33.90.30", "33.90.39"],
      possuiCalculoAutomatizado: true,
    },
  });

  const classeX = await prisma.classe.create({
    data: {
      nome: "CLASSE_X",
      descricao: "Material Não Classificado",
      gnd: "GND 3",
      naturezasPermitidas: ["33.90.30", "33.90.39"],
      possuiCalculoAutomatizado: true,
    },
  });

  console.log("  ✓ 10 classes criadas");

  // Criar Tipos padrão para cada classe
  console.log("\n🏷️  Criando tipos de despesa...");

  // Classe I - Material de Subsistência
  await prisma.tipo.createMany({
    data: [
      {
        nome: "QR",
        classeId: classeI.id,
        isCombustivel: false,
        isCriavelUsuario: true,
      },
      {
        nome: "QS",
        classeId: classeI.id,
        isCombustivel: false,
        isCriavelUsuario: true,
      },
    ],
  });

  // Classe III - Combustíveis (não criáveis pelo usuário)
  await prisma.tipo.createMany({
    data: [
      {
        nome: "Óleo Diesel",
        classeId: classeIII.id,
        isCombustivel: true,
        isCriavelUsuario: false,
      },
      {
        nome: "Gasolina",
        classeId: classeIII.id,
        isCombustivel: true,
        isCriavelUsuario: false,
      },
    ],
  });

  // Classe V - Munição e Explosivos
  await prisma.tipo.createMany({
    data: [
      {
        nome: "Munição de Instrução",
        classeId: classeV.id,
        isCombustivel: false,
        isCriavelUsuario: true,
      },
      {
        nome: "Munição de Combate",
        classeId: classeV.id,
        isCombustivel: false,
        isCriavelUsuario: true,
      },
      {
        nome: "Explosivos",
        classeId: classeV.id,
        isCombustivel: false,
        isCriavelUsuario: true,
      },
    ],
  });

  // Classe VI - Material Individual
  await prisma.tipo.createMany({
    data: [
      {
        nome: "Fardamento",
        classeId: classeVI.id,
        isCombustivel: false,
        isCriavelUsuario: true,
      },
      {
        nome: "Equipamento Individual",
        classeId: classeVI.id,
        isCombustivel: false,
        isCriavelUsuario: true,
      },
      {
        nome: "Material de Campanha",
        classeId: classeVI.id,
        isCombustivel: false,
        isCriavelUsuario: true,
      },
    ],
  });

  // Classe VII - Equipamento Principal
  await prisma.tipo.createMany({
    data: [
      {
        nome: "Aquisição de Equipamento",
        classeId: classeVII.id,
        isCombustivel: false,
        isCriavelUsuario: true,
      },
      {
        nome: "Manutenção de Equipamento",
        classeId: classeVII.id,
        isCombustivel: false,
        isCriavelUsuario: true,
      },
    ],
  });

  // Classe VIII - Material de Saúde
  await prisma.tipo.createMany({
    data: [
      {
        nome: "Medicamentos",
        classeId: classeVIII.id,
        isCombustivel: false,
        isCriavelUsuario: true,
      },
      {
        nome: "Material Médico-Hospitalar",
        classeId: classeVIII.id,
        isCombustivel: false,
        isCriavelUsuario: true,
      },
      {
        nome: "Equipamento Médico",
        classeId: classeVIII.id,
        isCombustivel: false,
        isCriavelUsuario: true,
      },
    ],
  });

  // Classe IX - Manutenção de Viaturas
  await prisma.tipo.createMany({
    data: [
      {
        nome: "Manutenção GP1",
        classeId: classeIX.id,
        isCombustivel: false,
        isCriavelUsuario: true,
      },
      {
        nome: "Manutenção GP2",
        classeId: classeIX.id,
        isCombustivel: false,
        isCriavelUsuario: true,
      },
      {
        nome: "Manutenção GP3",
        classeId: classeIX.id,
        isCombustivel: false,
        isCriavelUsuario: true,
      },
    ],
  });

  console.log("  ✓ Tipos de despesa criados para todas as classes");

  // Criar operação de exemplo
  console.log("\n🎯 Criando operação de exemplo...");

  const operacao = await prisma.operacao.create({
    data: {
      nome: "Operação CATRIMANI II 2025",
      efetivoMil: 500,
      dataInicio: new Date("2025-01-01"),
      dataFinal: new Date("2025-12-31"),
      prioridade: "ALTA",
      status: "RASCUNHO",
      finalidade:
        "Custear as necessidades de recursos financeiros nas ações logísticas e operacionais referentes à montagem, aperfeiçoamento e operação das Bases Interagências KAYANAÚ e PALIKAPI, DEF de WAIKÁS e 4º PEF, no contexto da Operação CATRIMANI II.",
      motivacao:
        "A aplicação dos recursos solicitados é basilar para que as organizações militares empregadas tenham condições de atuar nas suas Z Aç no contexto da Operação CATRIMANI II.",
      consequenciaNaoAtendimento:
        "A capacidade de realização das ações no contexto da Operação CATRIMANI II será comprometida, implicando em significativa redução de militares, materiais e equipamentos necessários ao eficaz cumprimento da missão coordenada pelo Comando Operacional Conjunto CATRIMANI.",
      observacoes:
        'As memórias de cálculo detalhadas e parametrizadas das despesas custeadas serão mantidas em arquivos próprios. O bem e/ou serviço requisitado está de acordo com a "Descrição" da AO e com a "Caracterização" do PO do Cadastro de Ações do SIOP.',
      omId: cma.id,
      valorLimiteTotal: 1000000.0, // R$ 1.000.000,00 total para a operação
    },
  });
  console.log("  ✓ Operação CATRIMANI II criada");

  // Criar OMs participantes da operação com seus limites de valor
  console.log("\n🏢 Criando OMs participantes da operação...");

  await prisma.operacaoOM.createMany({
    data: [
      {
        operacaoId: operacao.id,
        omId: bec.id,
        valorLimite: 400000.0, // R$ 400.000,00 para o 6º BEC
      },
      {
        operacaoId: operacao.id,
        omId: bis.id,
        valorLimite: 350000.0, // R$ 350.000,00 para o 7º BIS
      },
      {
        operacaoId: operacao.id,
        omId: rm12.id,
        valorLimite: 250000.0, // R$ 250.000,00 para a 12ª RM
      },
    ],
  });
  console.log("  ✓ 6º BEC participando com limite R$ 400.000,00");
  console.log("  ✓ 7º BIS participando com limite R$ 350.000,00");
  console.log("  ✓ 12ª RM participando com limite R$ 250.000,00");

  // Log de auditoria
  await prisma.auditoriaLog.create({
    data: {
      tipoEvento: "CRIACAO",
      descricao: `Operação "${operacao.nome}" criada via seed`,
      usuarioId: admin.id,
      operacaoId: operacao.id,
      metadados: { seed: true },
    },
  });

  console.log("\n✅ Seed concluído com sucesso!\n");
  console.log("═══════════════════════════════════════════════");
  console.log("📧 CREDENCIAIS DE ACESSO");
  console.log("═══════════════════════════════════════════════");
  console.log("");
  console.log("Super Admin:");
  console.log("  Email: admin@eb.mil.br");
  console.log("  Senha: admin123");
  console.log("");
  console.log("Comandante 6º BEC:");
  console.log("  Email: cmt.bec@eb.mil.br");
  console.log("  Senha: senha123");
  console.log("  Role: COMANDANTE");
  console.log("");
  console.log("S4 6º BEC (pode aprovar planos):");
  console.log("  Email: s4.bec@eb.mil.br");
  console.log("  Senha: senha123");
  console.log("  Role: S4");
  console.log("");
  console.log("Integrante OM:");
  console.log("  Email: integrante@eb.mil.br");
  console.log("  Senha: senha123");
  console.log("  Role: INTEGRANTE");
  console.log("");
  console.log("S4 7º BIS:");
  console.log("  Email: s4.bis@eb.mil.br");
  console.log("  Senha: senha123");
  console.log("  Role: S4");
  console.log("");
  console.log("═══════════════════════════════════════════════");
}

main()
  .catch((e) => {
    console.error("❌ Erro durante seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
