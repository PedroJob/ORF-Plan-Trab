"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var bcryptjs_1 = require("bcryptjs");
var prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var coter, cma, brigada, bec, bis, rm12, adminPassword, admin, cmtBecPassword, cmtBec, s4BecPassword, s4Bec, integrantePassword, integrante, s4BisPassword, s4Bis, naturezas, _i, naturezas_1, nat, classeI, classeII, classeIII, classeIV, classeV, classeVI, classeVII, classeVIII, classeIX, classeX, operacao;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("🌱 Iniciando seed do banco de dados...\n");
                    // Limpar dados existentes (opcional - cuidado em produção!)
                    console.log("🗑️  Limpando dados existentes...");
                    return [4 /*yield*/, prisma.auditoriaLog.deleteMany()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, prisma.aprovacaoHistorico.deleteMany()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, prisma.anotacao.deleteMany()];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, prisma.documentoReferencia.deleteMany()];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, prisma.despesaOM.deleteMany()];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, prisma.despesaNatureza.deleteMany()];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, prisma.despesa.deleteMany()];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, prisma.tipo.deleteMany()];
                case 8:
                    _a.sent();
                    return [4 /*yield*/, prisma.classe.deleteMany()];
                case 9:
                    _a.sent();
                    return [4 /*yield*/, prisma.naturezaDespesa.deleteMany()];
                case 10:
                    _a.sent();
                    return [4 /*yield*/, prisma.planoTrabalho.deleteMany()];
                case 11:
                    _a.sent();
                    return [4 /*yield*/, prisma.operacaoOM.deleteMany()];
                case 12:
                    _a.sent();
                    return [4 /*yield*/, prisma.operacao.deleteMany()];
                case 13:
                    _a.sent();
                    return [4 /*yield*/, prisma.user.deleteMany()];
                case 14:
                    _a.sent();
                    return [4 /*yield*/, prisma.organizacaoMilitar.deleteMany()];
                case 15:
                    _a.sent();
                    // Criar estrutura de OMs (hierarquia)
                    console.log("🏢 Criando estrutura organizacional...");
                    return [4 /*yield*/, prisma.organizacaoMilitar.create({
                            data: {
                                nome: "Comando de Operações Terrestres",
                                sigla: "COTER",
                                tipo: "COTER",
                                codUG: "160548",
                            },
                        })];
                case 16:
                    coter = _a.sent();
                    console.log("  ✓ COTER criado");
                    return [4 /*yield*/, prisma.organizacaoMilitar.create({
                            data: {
                                nome: "Comando Militar da Amazônia",
                                sigla: "CMA",
                                tipo: "CMA",
                                codUG: "160016",
                                omPaiId: coter.id,
                            },
                        })];
                case 17:
                    cma = _a.sent();
                    console.log("  ✓ CMA criado");
                    return [4 /*yield*/, prisma.organizacaoMilitar.create({
                            data: {
                                nome: "1ª Brigada de Infantaria de Selva",
                                sigla: "1ª Bda Inf Sl",
                                tipo: "BRIGADA",
                                codUG: "160482",
                                omPaiId: cma.id,
                            },
                        })];
                case 18:
                    brigada = _a.sent();
                    console.log("  ✓ 1ª Brigada criada");
                    return [4 /*yield*/, prisma.organizacaoMilitar.create({
                            data: {
                                nome: "6º Batalhão de Engenharia de Construção",
                                sigla: "6º BEC",
                                tipo: "BATALHAO",
                                codUG: "160353",
                                omPaiId: brigada.id,
                            },
                        })];
                case 19:
                    bec = _a.sent();
                    console.log("  ✓ 6º BEC criado");
                    return [4 /*yield*/, prisma.organizacaoMilitar.create({
                            data: {
                                nome: "7º Batalhão de Infantaria de Selva",
                                sigla: "7º BIS",
                                tipo: "BATALHAO",
                                codUG: "160352",
                                omPaiId: brigada.id,
                            },
                        })];
                case 20:
                    bis = _a.sent();
                    console.log("  ✓ 7º BIS criado");
                    return [4 /*yield*/, prisma.organizacaoMilitar.create({
                            data: {
                                nome: "Comando da 12ª Região Militar",
                                sigla: "Cmdo 12ª RM",
                                tipo: "BRIGADA",
                                codUG: "160014",
                                omPaiId: cma.id,
                            },
                        })];
                case 21:
                    rm12 = _a.sent();
                    console.log("  ✓ 12ª RM criada");
                    // Criar usuários
                    console.log("\n👥 Criando usuários...");
                    return [4 /*yield*/, bcryptjs_1.default.hash("admin123", 10)];
                case 22:
                    adminPassword = _a.sent();
                    return [4 /*yield*/, prisma.user.create({
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
                        })];
                case 23:
                    admin = _a.sent();
                    console.log("  ✓ Super Admin criado (admin@eb.mil.br / admin123)");
                    return [4 /*yield*/, bcryptjs_1.default.hash("senha123", 10)];
                case 24:
                    cmtBecPassword = _a.sent();
                    return [4 /*yield*/, prisma.user.create({
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
                        })];
                case 25:
                    cmtBec = _a.sent();
                    console.log("  ✓ Comandante 6º BEC criado (cmt.bec@eb.mil.br / senha123)");
                    return [4 /*yield*/, bcryptjs_1.default.hash("senha123", 10)];
                case 26:
                    s4BecPassword = _a.sent();
                    return [4 /*yield*/, prisma.user.create({
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
                        })];
                case 27:
                    s4Bec = _a.sent();
                    console.log("  ✓ S4 6º BEC criado (s4.bec@eb.mil.br / senha123)");
                    return [4 /*yield*/, bcryptjs_1.default.hash("senha123", 10)];
                case 28:
                    integrantePassword = _a.sent();
                    return [4 /*yield*/, prisma.user.create({
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
                        })];
                case 29:
                    integrante = _a.sent();
                    console.log("  ✓ Integrante OM criado (integrante@eb.mil.br / senha123)");
                    return [4 /*yield*/, bcryptjs_1.default.hash("senha123", 10)];
                case 30:
                    s4BisPassword = _a.sent();
                    return [4 /*yield*/, prisma.user.create({
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
                        })];
                case 31:
                    s4Bis = _a.sent();
                    console.log("  ✓ S4 7º BIS criado (s4.bis@eb.mil.br / senha123)");
                    // Criar naturezas de despesa (apenas as 2 válidas)
                    console.log("\n💰 Criando naturezas de despesa...");
                    naturezas = [
                        {
                            codigo: "33.90.30",
                            nome: "Material de Consumo",
                            descricao: "Despesas com aquisição de materiais de consumo destinados à manutenção de bens imóveis e/ou serviços",
                        },
                        {
                            codigo: "33.90.39",
                            nome: "Outros Serviços de Terceiros - Pessoa Jurídica",
                            descricao: "Despesas com aquisição de serviços eventuais de pessoas jurídicas",
                        },
                    ];
                    _i = 0, naturezas_1 = naturezas;
                    _a.label = 32;
                case 32:
                    if (!(_i < naturezas_1.length)) return [3 /*break*/, 35];
                    nat = naturezas_1[_i];
                    return [4 /*yield*/, prisma.naturezaDespesa.create({ data: nat })];
                case 33:
                    _a.sent();
                    _a.label = 34;
                case 34:
                    _i++;
                    return [3 /*break*/, 32];
                case 35:
                    console.log("  \u2713 ".concat(naturezas.length, " naturezas de despesa criadas"));
                    // Criar Classes (I a X) para Planos LOGISTICO
                    console.log("\n📚 Criando classes de despesa...");
                    return [4 /*yield*/, prisma.classe.create({
                            data: {
                                nome: "CLASSE_I",
                                descricao: "Material de Subsistência",
                                gnd: "GND 3",
                                naturezasPermitidas: ["33.90.30"],
                                possuiCalculoAutomatizado: true,
                            },
                        })];
                case 36:
                    classeI = _a.sent();
                    return [4 /*yield*/, prisma.classe.create({
                            data: {
                                nome: "CLASSE_II",
                                descricao: "Manutenção de Material de Intendência",
                                gnd: "GND 3",
                                naturezasPermitidas: ["33.90.30", "33.90.39"],
                                possuiCalculoAutomatizado: true,
                            },
                        })];
                case 37:
                    classeII = _a.sent();
                    return [4 /*yield*/, prisma.classe.create({
                            data: {
                                nome: "CLASSE_III",
                                descricao: "Combustíveis e Lubrificantes",
                                gnd: "GND 3",
                                naturezasPermitidas: ["33.90.30"],
                                possuiCalculoAutomatizado: true,
                            },
                        })];
                case 38:
                    classeIII = _a.sent();
                    return [4 /*yield*/, prisma.classe.create({
                            data: {
                                nome: "CLASSE_IV",
                                descricao: "Material de Construção",
                                gnd: "GND 3",
                                naturezasPermitidas: ["33.90.30", "33.90.39"],
                                possuiCalculoAutomatizado: true,
                            },
                        })];
                case 39:
                    classeIV = _a.sent();
                    return [4 /*yield*/, prisma.classe.create({
                            data: {
                                nome: "CLASSE_V",
                                descricao: "Munição e Explosivos",
                                gnd: "GND 3",
                                naturezasPermitidas: ["33.90.30"],
                                possuiCalculoAutomatizado: true,
                            },
                        })];
                case 40:
                    classeV = _a.sent();
                    return [4 /*yield*/, prisma.classe.create({
                            data: {
                                nome: "CLASSE_VI",
                                descricao: "Material Individual",
                                gnd: "GND 3",
                                naturezasPermitidas: ["33.90.30"],
                                possuiCalculoAutomatizado: true,
                            },
                        })];
                case 41:
                    classeVI = _a.sent();
                    return [4 /*yield*/, prisma.classe.create({
                            data: {
                                nome: "CLASSE_VII",
                                descricao: "Equipamento Principal",
                                gnd: "GND 3",
                                naturezasPermitidas: ["33.90.30", "33.90.39"],
                                possuiCalculoAutomatizado: true,
                            },
                        })];
                case 42:
                    classeVII = _a.sent();
                    return [4 /*yield*/, prisma.classe.create({
                            data: {
                                nome: "CLASSE_VIII",
                                descricao: "Material de Saúde",
                                gnd: "GND 3",
                                naturezasPermitidas: ["33.90.30", "33.90.39"],
                                possuiCalculoAutomatizado: true,
                            },
                        })];
                case 43:
                    classeVIII = _a.sent();
                    return [4 /*yield*/, prisma.classe.create({
                            data: {
                                nome: "CLASSE_IX",
                                descricao: "Manutenção de Viaturas",
                                gnd: "GND 3",
                                naturezasPermitidas: ["33.90.30", "33.90.39"],
                                possuiCalculoAutomatizado: true,
                            },
                        })];
                case 44:
                    classeIX = _a.sent();
                    return [4 /*yield*/, prisma.classe.create({
                            data: {
                                nome: "CLASSE_X",
                                descricao: "Material Não Classificado",
                                gnd: "GND 3",
                                naturezasPermitidas: ["33.90.30", "33.90.39"],
                                possuiCalculoAutomatizado: true,
                            },
                        })];
                case 45:
                    classeX = _a.sent();
                    console.log("  ✓ 10 classes criadas");
                    // Criar Tipos padrão para cada classe
                    console.log("\n🏷️  Criando tipos de despesa...");
                    // Classe I - Material de Subsistência
                    return [4 /*yield*/, prisma.tipo.createMany({
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
                        })];
                case 46:
                    // Classe I - Material de Subsistência
                    _a.sent();
                    // Classe III - Combustíveis (não criáveis pelo usuário)
                    return [4 /*yield*/, prisma.tipo.createMany({
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
                        })];
                case 47:
                    // Classe III - Combustíveis (não criáveis pelo usuário)
                    _a.sent();
                    // Classe V - Munição e Explosivos
                    return [4 /*yield*/, prisma.tipo.createMany({
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
                        })];
                case 48:
                    // Classe V - Munição e Explosivos
                    _a.sent();
                    // Classe VI - Material Individual
                    return [4 /*yield*/, prisma.tipo.createMany({
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
                        })];
                case 49:
                    // Classe VI - Material Individual
                    _a.sent();
                    // Classe VII - Equipamento Principal
                    return [4 /*yield*/, prisma.tipo.createMany({
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
                            skipDuplicates: false,
                        })];
                case 50:
                    // Classe VII - Equipamento Principal
                    _a.sent();
                    // Classe VIII - Material de Saúde
                    return [4 /*yield*/, prisma.tipo.createMany({
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
                        })];
                case 51:
                    // Classe VIII - Material de Saúde
                    _a.sent();
                    // Classe IX - Manutenção de Viaturas
                    return [4 /*yield*/, prisma.tipo.createMany({
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
                            skipDuplicates: false,
                        })];
                case 52:
                    // Classe IX - Manutenção de Viaturas
                    _a.sent();
                    console.log("  ✓ Tipos de despesa criados para todas as classes");
                    // Criar operação de exemplo
                    console.log("\n🎯 Criando operação de exemplo...");
                    return [4 /*yield*/, prisma.operacao.create({
                            data: {
                                nome: "Operação CATRIMANI II 2025",
                                efetivoMil: 500,
                                dataInicio: new Date("2025-01-01"),
                                dataFinal: new Date("2025-12-31"),
                                prioridade: "ALTA",
                                status: "RASCUNHO",
                                finalidade: "Custear as necessidades de recursos financeiros nas ações logísticas e operacionais referentes à montagem, aperfeiçoamento e operação das Bases Interagências KAYANAÚ e PALIKAPI, DEF de WAIKÁS e 4º PEF, no contexto da Operação CATRIMANI II.",
                                motivacao: "A aplicação dos recursos solicitados é basilar para que as organizações militares empregadas tenham condições de atuar nas suas Z Aç no contexto da Operação CATRIMANI II.",
                                consequenciaNaoAtendimento: "A capacidade de realização das ações no contexto da Operação CATRIMANI II será comprometida, implicando em significativa redução de militares, materiais e equipamentos necessários ao eficaz cumprimento da missão coordenada pelo Comando Operacional Conjunto CATRIMANI.",
                                observacoes: 'As memórias de cálculo detalhadas e parametrizadas das despesas custeadas serão mantidas em arquivos próprios. O bem e/ou serviço requisitado está de acordo com a "Descrição" da AO e com a "Caracterização" do PO do Cadastro de Ações do SIOP.',
                                omId: cma.id,
                                valorLimiteTotal: 1000000.0, // R$ 1.000.000,00 total para a operação
                            },
                        })];
                case 53:
                    operacao = _a.sent();
                    console.log("  ✓ Operação CATRIMANI II criada");
                    // Criar OMs participantes da operação com seus limites de valor
                    console.log("\n🏢 Criando OMs participantes da operação...");
                    return [4 /*yield*/, prisma.operacaoOM.createMany({
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
                            skipDuplicates: false,
                        })];
                case 54:
                    _a.sent();
                    console.log("  ✓ 6º BEC participando com limite R$ 400.000,00");
                    console.log("  ✓ 7º BIS participando com limite R$ 350.000,00");
                    console.log("  ✓ 12ª RM participando com limite R$ 250.000,00");
                    // Log de auditoria
                    return [4 /*yield*/, prisma.auditoriaLog.create({
                            data: {
                                tipoEvento: "CRIACAO",
                                descricao: "Opera\u00E7\u00E3o \"".concat(operacao.nome, "\" criada via seed"),
                                usuarioId: admin.id,
                                operacaoId: operacao.id,
                                metadados: { seed: true },
                            },
                        })];
                case 55:
                    // Log de auditoria
                    _a.sent();
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
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) {
    console.error("❌ Erro durante seed:", e);
    process.exit(1);
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
