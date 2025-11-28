import { PrismaClient, TipoOM } from "@prisma/client";
import bcrypt from "bcryptjs";
import omsData from "./oms.json";

const prisma = new PrismaClient();

// Função para determinar o tipo de OM baseado no nome
function determinarTipoOM(nome: string, tipoRamo?: string): TipoOM {
  const nomeLower = nome.toLowerCase();

  // Se temos o tipo do ramo, usar ele
  if (tipoRamo) {
    const tipoLower = tipoRamo.toLowerCase();
    if (tipoLower.includes("região militar")) {
      return "BRIGADA";
    }
    if (tipoLower.includes("brigada")) {
      return "BRIGADA";
    }
    if (tipoLower.includes("grupamento")) {
      return "GRUPAMENTO";
    }
  }

  if (nomeLower.includes("comando militar") || nome === "CMA") {
    return "CMA";
  }
  if (nomeLower.includes("bda") || nomeLower.includes("brigada")) {
    return "BRIGADA";
  }
  if (nomeLower.includes("gpt") || nomeLower.includes("grupamento")) {
    return "GRUPAMENTO";
  }
  // Região Militar - só se não for outra coisa antes (como Cia C 12ª RM)
  if (nomeLower.match(/^\d+ª?\s*rm$/) || nomeLower.startsWith("cmdo")) {
    return "BRIGADA";
  }
  // Batalhões e equivalentes
  if (
    nomeLower.match(/\bbis\b/) ||
    nomeLower.match(/\bbec\b/) ||
    nomeLower.match(/\bbpe\b/) ||
    nomeLower.includes("b log") ||
    nomeLower.includes("ba log") ||
    nomeLower.includes("b sup") ||
    nomeLower.includes("b com") ||
    nomeLower.match(/\bbim\b/) ||
    nomeLower.includes("bavex") ||
    nomeLower.match(/\bgac\b/) ||
    nomeLower.includes("r c mec") ||
    nomeLower.includes("gaaae") ||
    nomeLower.includes("cgeo") ||
    nomeLower.includes("cta") ||
    nomeLower.includes("cgcfex")
  ) {
    return "BATALHAO";
  }
  // Default para companhia/unidade menor
  return "COMPANHIA";
}

// Mapa para rastrear emails já usados e evitar duplicatas
const emailsUsados = new Set<string>();
function gerarEmailUnico(prefixo: string, base: string): string {
  let email = `${prefixo}.${base}@eb.mil.br`;
  let contador = 1;
  while (emailsUsados.has(email)) {
    email = `${prefixo}.${base}${contador}@eb.mil.br`;
    contador++;
  }
  emailsUsados.add(email);
  return email;
}

// Função para gerar um código UG único
const ugsUsados = new Set<string>(["160548", "160016"]); // COTER e CMA já usados
let ugCounter = 160100;
function gerarCodUG(): string {
  while (ugsUsados.has(ugCounter.toString())) {
    ugCounter++;
  }
  const ug = ugCounter.toString();
  ugsUsados.add(ug);
  ugCounter++;
  return ug;
}

// Função para normalizar string para uso em email
function normalizarParaEmail(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/[^a-z0-9]/g, "") // remove caracteres especiais
    .substring(0, 20); // limita tamanho
}

// Função para gerar nome de guerra baseado na sigla/nome
function gerarNomeGuerra(nome: string): string {
  const palavras = nome.split(" ");
  if (palavras.length > 1) {
    return palavras[palavras.length - 1];
  }
  return nome.substring(0, 10);
}

interface Ramo {
  tipo?: string;
  nome?: string;
  sigla?: string;
  sede?: string;
  unidades?: string[];
}

interface OmsJson {
  comando: {
    nome: string;
    ramos: Ramo[];
  };
}

async function main() {
  console.log("🌱 Iniciando seed do banco de dados...\n");

  // Limpar sets e resetar contadores
  emailsUsados.clear();
  ugsUsados.clear();
  ugsUsados.add("160548"); // COTER
  ugsUsados.add("160016"); // CMA
  ugCounter = 160100;

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

  const senhaHash = await bcrypt.hash("senha123", 10);
  const adminPassword = await bcrypt.hash("admin123", 10);

  // Arrays para armazenar OMs e usuários criados
  const omsCreated: { id: string; nome: string; sigla: string }[] = [];
  const usersCreated: { email: string; role: string; om: string }[] = [];

  // Criar COTER primeiro
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

  // Criar admin do COTER
  const emailAdmin = "admin@eb.mil.br";
  emailsUsados.add(emailAdmin);
  await prisma.user.create({
    data: {
      email: emailAdmin,
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
  usersCreated.push({ email: emailAdmin, role: "SUPER_ADMIN", om: "COTER" });

  // Criar CMA (Comando Militar da Amazônia)
  const data = omsData as OmsJson;
  const cma = await prisma.organizacaoMilitar.create({
    data: {
      nome: data.comando.nome,
      sigla: "CMA",
      tipo: "CMA",
      codUG: "160016",
      omPaiId: coter.id,
    },
  });
  console.log(`  ✓ ${data.comando.nome} criado`);
  omsCreated.push({ id: cma.id, nome: cma.nome, sigla: cma.sigla });

  // Criar usuários para o CMA
  const emailIntegranteCma = gerarEmailUnico("integrante", "cma");
  const emailS4Cma = gerarEmailUnico("s4", "cma");

  await prisma.user.create({
    data: {
      email: emailIntegranteCma,
      passwordHash: senhaHash,
      nomeCompleto: "Integrante CMA",
      nomeGuerra: "IntCMA",
      postoGraduacao: "Cap",
      role: "INTEGRANTE",
      isActive: true,
      omId: cma.id,
    },
  });
  usersCreated.push({ email: emailIntegranteCma, role: "INTEGRANTE", om: "CMA" });

  await prisma.user.create({
    data: {
      email: emailS4Cma,
      passwordHash: senhaHash,
      nomeCompleto: "S4 CMA",
      nomeGuerra: "S4CMA",
      postoGraduacao: "Maj",
      role: "S4",
      isActive: true,
      omId: cma.id,
    },
  });
  usersCreated.push({ email: emailS4Cma, role: "S4", om: "CMA" });

  // Processar ramos do CMA
  for (const ramo of data.comando.ramos) {
    const ramoNome = ramo.nome || ramo.sigla || "";
    const ramoSigla = ramo.sigla || ramo.nome || "";

    // Se o ramo tem tipo (é uma estrutura hierárquica como Brigada, RM, Grupamento)
    if (ramo.tipo && ramo.unidades && ramo.unidades.length > 0) {
      const tipoRamo = determinarTipoOM(ramoNome, ramo.tipo);

      // Criar o ramo (Brigada, RM, Grupamento)
      const omRamo = await prisma.organizacaoMilitar.create({
        data: {
          nome: ramoNome,
          sigla: ramoSigla,
          tipo: tipoRamo,
          codUG: gerarCodUG(),
          omPaiId: cma.id,
        },
      });
      console.log(`  ✓ ${ramoNome} criado (${tipoRamo})`);
      omsCreated.push({ id: omRamo.id, nome: omRamo.nome, sigla: omRamo.sigla });

      // Criar usuários para o ramo
      const ramoEmailBase = normalizarParaEmail(ramoSigla || ramoNome);
      const emailIntegranteRamo = gerarEmailUnico("integrante", ramoEmailBase);
      const emailS4Ramo = gerarEmailUnico("s4", ramoEmailBase);

      await prisma.user.create({
        data: {
          email: emailIntegranteRamo,
          passwordHash: senhaHash,
          nomeCompleto: `Integrante ${ramoSigla || ramoNome}`,
          nomeGuerra: gerarNomeGuerra(ramoSigla || ramoNome),
          postoGraduacao: "Cap",
          role: "INTEGRANTE",
          isActive: true,
          omId: omRamo.id,
        },
      });
      usersCreated.push({
        email: emailIntegranteRamo,
        role: "INTEGRANTE",
        om: ramoSigla || ramoNome
      });

      await prisma.user.create({
        data: {
          email: emailS4Ramo,
          passwordHash: senhaHash,
          nomeCompleto: `S4 ${ramoSigla || ramoNome}`,
          nomeGuerra: `S4${gerarNomeGuerra(ramoSigla || ramoNome).substring(0, 5)}`,
          postoGraduacao: "Maj",
          role: "S4",
          isActive: true,
          omId: omRamo.id,
        },
      });
      usersCreated.push({
        email: emailS4Ramo,
        role: "S4",
        om: ramoSigla || ramoNome
      });

      // Criar as unidades subordinadas ao ramo
      for (const unidade of ramo.unidades) {
        const tipoUnidade = determinarTipoOM(unidade);

        const omUnidade = await prisma.organizacaoMilitar.create({
          data: {
            nome: unidade,
            sigla: unidade,
            tipo: tipoUnidade,
            codUG: gerarCodUG(),
            omPaiId: omRamo.id,
          },
        });
        console.log(`    ✓ ${unidade} criado (${tipoUnidade})`);
        omsCreated.push({ id: omUnidade.id, nome: omUnidade.nome, sigla: omUnidade.sigla });

        // Criar usuários para a unidade
        const unidadeEmailBase = normalizarParaEmail(unidade);
        const emailIntegranteUnidade = gerarEmailUnico("integrante", unidadeEmailBase);
        const emailS4Unidade = gerarEmailUnico("s4", unidadeEmailBase);

        await prisma.user.create({
          data: {
            email: emailIntegranteUnidade,
            passwordHash: senhaHash,
            nomeCompleto: `Integrante ${unidade}`,
            nomeGuerra: gerarNomeGuerra(unidade),
            postoGraduacao: "1º Ten",
            role: "INTEGRANTE",
            isActive: true,
            omId: omUnidade.id,
          },
        });
        usersCreated.push({
          email: emailIntegranteUnidade,
          role: "INTEGRANTE",
          om: unidade
        });

        await prisma.user.create({
          data: {
            email: emailS4Unidade,
            passwordHash: senhaHash,
            nomeCompleto: `S4 ${unidade}`,
            nomeGuerra: `S4${gerarNomeGuerra(unidade).substring(0, 5)}`,
            postoGraduacao: "Cap",
            role: "S4",
            isActive: true,
            omId: omUnidade.id,
          },
        });
        usersCreated.push({
          email: emailS4Unidade,
          role: "S4",
          om: unidade
        });
      }
    } else {
      // É uma unidade diretamente subordinada ao CMA (sem subestrutura)
      const tipoUnidade = determinarTipoOM(ramoNome);

      const omUnidade = await prisma.organizacaoMilitar.create({
        data: {
          nome: ramoNome,
          sigla: ramoSigla,
          tipo: tipoUnidade,
          codUG: gerarCodUG(),
          omPaiId: cma.id,
        },
      });
      console.log(`  ✓ ${ramoNome} criado (${tipoUnidade})`);
      omsCreated.push({ id: omUnidade.id, nome: omUnidade.nome, sigla: omUnidade.sigla });

      // Criar usuários para a unidade direta
      const unidadeEmailBase = normalizarParaEmail(ramoSigla || ramoNome);
      const emailIntegranteDireta = gerarEmailUnico("integrante", unidadeEmailBase);
      const emailS4Direta = gerarEmailUnico("s4", unidadeEmailBase);

      await prisma.user.create({
        data: {
          email: emailIntegranteDireta,
          passwordHash: senhaHash,
          nomeCompleto: `Integrante ${ramoNome}`,
          nomeGuerra: gerarNomeGuerra(ramoNome),
          postoGraduacao: "Cap",
          role: "INTEGRANTE",
          isActive: true,
          omId: omUnidade.id,
        },
      });
      usersCreated.push({
        email: emailIntegranteDireta,
        role: "INTEGRANTE",
        om: ramoNome
      });

      await prisma.user.create({
        data: {
          email: emailS4Direta,
          passwordHash: senhaHash,
          nomeCompleto: `S4 ${ramoNome}`,
          nomeGuerra: `S4${gerarNomeGuerra(ramoNome).substring(0, 5)}`,
          postoGraduacao: "Maj",
          role: "S4",
          isActive: true,
          omId: omUnidade.id,
        },
      });
      usersCreated.push({
        email: emailS4Direta,
        role: "S4",
        om: ramoNome
      });
    }
  }

  // Criar naturezas de despesa
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

  await prisma.classe.create({
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

  await prisma.classe.create({
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

  await prisma.classe.create({
    data: {
      nome: "CLASSE_IX",
      descricao: "Manutenção de Viaturas",
      gnd: "GND 3",
      naturezasPermitidas: ["33.90.30", "33.90.39"],
      possuiCalculoAutomatizado: true,
    },
  });

  await prisma.classe.create({
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
    skipDuplicates: false,
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
    skipDuplicates: false,
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
    skipDuplicates: false,
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
    skipDuplicates: false,
  });

  // Classe VII - Equipamento Principal
  await prisma.tipo.createMany({
    data: [
      {
        nome: "Manutenção de Equipamento",
        classeId: classeVII.id,
        isCombustivel: false,
        isCriavelUsuario: true,
      },
    ],
    skipDuplicates: false,
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
    skipDuplicates: false,
  });

  console.log("  ✓ Tipos de despesa criados para todas as classes");

  console.log("\n✅ Seed concluído com sucesso!\n");
  console.log("═══════════════════════════════════════════════");
  console.log("📊 RESUMO");
  console.log("═══════════════════════════════════════════════");
  console.log(`  Total de OMs criadas: ${omsCreated.length + 2}`); // +2 para COTER e CMA
  console.log(`  Total de usuários criados: ${usersCreated.length + 1}`); // +1 para admin
  console.log("");
  console.log("═══════════════════════════════════════════════");
  console.log("📧 CREDENCIAIS DE ACESSO");
  console.log("═══════════════════════════════════════════════");
  console.log("");
  console.log("Super Admin:");
  console.log("  Email: admin@eb.mil.br");
  console.log("  Senha: admin123");
  console.log("");
  console.log("Demais usuários:");
  console.log("  Padrão de email: integrante.[sigla]@eb.mil.br");
  console.log("  Padrão de email: s4.[sigla]@eb.mil.br");
  console.log("  Senha: senha123");
  console.log("");
  console.log("Exemplos:");
  console.log("  - integrante.cma@eb.mil.br (INTEGRANTE do CMA)");
  console.log("  - s4.cma@eb.mil.br (S4 do CMA)");
  console.log("  - integrante.12arm@eb.mil.br (INTEGRANTE da 12ª RM)");
  console.log("  - s4.1abdainfsl@eb.mil.br (S4 da 1ª Bda Inf Sl)");
  console.log("  - integrante.5obec@eb.mil.br (INTEGRANTE do 5º BEC)");
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
