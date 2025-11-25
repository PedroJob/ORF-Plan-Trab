import { Prisma } from '@prisma/client';

// ============================================
// PRISMA-DERIVED TYPES (Single source of truth)
// ============================================

/**
 * Classe with only the fields needed in components
 */
export type ClasseSelect = Prisma.ClasseGetPayload<{
  select: {
    id: true;
    nome: true;
    descricao: true;
    naturezasPermitidas: true;
    possuiCalculoAutomatizado: true;
  };
}>;

/**
 * OrganizacaoMilitar (OM) with essential fields
 */
export type OMSelect = Prisma.OrganizacaoMilitarGetPayload<{
  select: {
    id: true;
    nome: true;
    sigla: true;
    codUG: true;
  };
}>;

/**
 * NaturezaDespesa with all fields
 */
export type NaturezaSelect = Prisma.NaturezaDespesaGetPayload<{
  select: {
    id: true;
    codigo: true;
    nome: true;
    descricao: true;
  };
}>;

/**
 * Operacao with essential fields for components
 */
export type OperacaoSelect = Prisma.OperacaoGetPayload<{
  select: {
    id: true;
    nome: true;
    efetivoMil: true;
    efetivoExt: true;
    dataInicio: true;
    dataFinal: true;
  };
}>;

/**
 * Despesa with all relations loaded (matches API response)
 */
export type DespesaWithRelations = Prisma.DespesaGetPayload<{
  include: {
    classe: {
      select: {
        nome: true;
        descricao: true;
      };
    };
    tipo: {
      select: {
        nome: true;
        isCombustivel: true;
      };
    };
    oms: {
      include: {
        om: {
          select: {
            id: true;
            nome: true;
            sigla: true;
            codUG: true;
          };
        };
      };
    };
    despesasNaturezas: {
      include: {
        natureza: {
          select: {
            id: true;
            codigo: true;
            nome: true;
            descricao: true;
          };
        };
      };
    };
  };
}>;

// ============================================
// COMPONENT-SPECIFIC TYPES (Not in database)
// ============================================

/**
 * Rateio (distribution) of expense across OMs
 */
export interface RateioOM {
  omId: string;
  percentual: number;
}

/**
 * Rateio (distribution) of expense across Naturezas
 */
export interface RateioNatureza {
  naturezaId: string;
  percentual: number;
}

/**
 * Generic handler for parameter changes in formula components
 * @template T - Type of the parameters object
 */
export interface HandleParametrosChange<T = unknown> {
  params: T;
  valor: number;
  valorCombustivel?: number;
  descricao?: string;
}

/**
 * Details of calculation for formula components
 */
export interface DetalheCalculo {
  descricao?: string;
  valores?: Record<string, number>;
  observacoes?: string[];
  [key: string]: unknown; // Allow flexibility for different calculation types
}

/**
 * Operacao type with efetivo field for backward compatibility
 * Maps efetivoMil to efetivo for components that expect it
 */
export type OperacaoWithEfetivo = Omit<OperacaoSelect, 'efetivoMil' | 'efetivoExt' | 'dataInicio' | 'dataFinal'> & {
  efetivo: number;
  dataInicio: string;
  dataFinal: string;
};

// ============================================
// PRISMA VALIDATORS (for type-safe queries)
// ============================================

/**
 * Validator for Classe select
 */
export const classeSelectValidator = Prisma.validator<Prisma.ClasseSelect>()({
  id: true,
  nome: true,
  descricao: true,
  naturezasPermitidas: true,
  possuiCalculoAutomatizado: true,
});

/**
 * Validator for OM select
 */
export const omSelectValidator = Prisma.validator<Prisma.OrganizacaoMilitarSelect>()({
  id: true,
  nome: true,
  sigla: true,
  codUG: true,
});

/**
 * Validator for Natureza select
 */
export const naturezaSelectValidator = Prisma.validator<Prisma.NaturezaDespesaSelect>()({
  id: true,
  codigo: true,
  nome: true,
  descricao: true,
});

/**
 * Type-safe include for despesa queries with all relations
 */
export const despesaWithRelationsInclude = Prisma.validator<Prisma.DespesaInclude>()({
  classe: {
    select: {
      nome: true,
      descricao: true,
    },
  },
  tipo: {
    select: {
      nome: true,
      isCombustivel: true,
    },
  },
  oms: {
    include: {
      om: {
        select: {
          id: true,
          nome: true,
          sigla: true,
          codUG: true,
        },
      },
    },
  },
  despesasNaturezas: {
    include: {
      natureza: {
        select: {
          id: true,
          codigo: true,
          nome: true,
          descricao: true,
        },
      },
    },
  },
});

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Transform OperacaoSelect to OperacaoWithEfetivo for backward compatibility
 * Maps database field efetivoMil to component field efetivo
 */
export function transformOperacaoForComponent(op: OperacaoSelect): OperacaoWithEfetivo {
  return {
    id: op.id,
    nome: op.nome,
    efetivo: op.efetivoMil,
    dataInicio: op.dataInicio.toISOString(),
    dataFinal: op.dataFinal.toISOString(),
  };
}

/**
 * Convert Decimal to number for component usage
 */
export function decimalToNumber(value: Prisma.Decimal | number | null): number {
  if (value === null) return 0;
  if (typeof value === 'number') return value;
  return Number(value.toString());
}
