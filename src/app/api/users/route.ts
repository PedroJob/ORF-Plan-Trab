import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hashPassword } from '@/lib/auth';
import { z } from 'zod';
import { Role, TipoEvento } from '@prisma/client';

const createUserSchema = z.object({
  email: z.string().email('Email inválido'),
  nomeCompleto: z.string().min(1, 'Nome completo é obrigatório'),
  nomeGuerra: z.string().optional(),
  postoGraduacao: z.string().min(1, 'Posto/graduação é obrigatório'),
  telefone: z.string().optional(),
  role: z.nativeEnum(Role),
  omId: z.string().cuid('ID de OM inválido'),
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Apenas SUPER_ADMIN pode listar usuários
    if (currentUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Sem permissão para listar usuários' },
        { status: 403 }
      );
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        nomeCompleto: true,
        nomeGuerra: true,
        postoGraduacao: true,
        telefone: true,
        role: true,
        isActive: true,
        om: {
          select: {
            id: true,
            nome: true,
            sigla: true,
            tipo: true,
          },
        },
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Apenas SUPER_ADMIN pode criar usuários
    if (currentUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Sem permissão para criar usuários' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = createUserSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Verificar se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email já cadastrado' },
        { status: 400 }
      );
    }

    // Verificar se OM existe
    const om = await prisma.organizacaoMilitar.findUnique({
      where: { id: data.omId },
    });

    if (!om) {
      return NextResponse.json(
        { error: 'Organização militar não encontrada' },
        { status: 404 }
      );
    }

    // Hash da senha
    const passwordHash = await hashPassword(data.senha);

    // Criar usuário
    const newUser = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        nomeCompleto: data.nomeCompleto,
        nomeGuerra: data.nomeGuerra,
        postoGraduacao: data.postoGraduacao,
        telefone: data.telefone,
        role: data.role,
        omId: data.omId,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        nomeCompleto: true,
        nomeGuerra: true,
        postoGraduacao: true,
        telefone: true,
        role: true,
        isActive: true,
        om: {
          select: {
            id: true,
            nome: true,
            sigla: true,
            tipo: true,
          },
        },
        createdAt: true,
      },
    });

    // Log de auditoria
    await prisma.auditoriaLog.create({
      data: {
        tipoEvento: TipoEvento.CRIACAO,
        descricao: `Usuário "${newUser.nomeCompleto}" (${newUser.email}) criado`,
        usuarioId: currentUser.userId,
        metadados: {
          newUser: {
            id: newUser.id,
            email: newUser.email,
            role: newUser.role,
            om: newUser.om.sigla,
          },
        },
      },
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
