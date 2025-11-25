import { Check, Clock, Circle } from "lucide-react";

interface StatusAprovacaoProps {
  nivelAtual: number | null;
  status: string;
}

const NIVEIS_APROVACAO = [
  { nivel: 1, nome: "Comandante da OM" },
  { nivel: 2, nome: "Comandante da Brigada" },
  { nivel: 3, nome: "Comandante do CMA" },
];

export function StatusAprovacao({ nivelAtual, status }: StatusAprovacaoProps) {
  const getNivelStatus = (nivel: number) => {
    if (status === "APROVADO") {
      return "completed";
    }

    if (status === "REPROVADO") {
      return "pending";
    }

    if (!nivelAtual) {
      return "pending";
    }

    if (nivel < nivelAtual) {
      return "completed";
    }

    if (nivel === nivelAtual) {
      return "current";
    }

    return "pending";
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Esteira de Aprovação
      </h3>

      <div className="space-y-4">
        {NIVEIS_APROVACAO.map((nivel, index) => {
          const nivelStatus = getNivelStatus(nivel.nivel);

          return (
            <div key={nivel.nivel} className="flex items-start">
              {/* Ícone de Status */}
              <div className="flex-shrink-0 mr-4">
                {nivelStatus === "completed" && (
                  <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                    <Check className="w-5 h-5 text-green-600" />
                  </div>
                )}
                {nivelStatus === "current" && (
                  <div className="flex items-center justify-center w-8 h-8 bg-amber-100 rounded-full">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                )}
                {nivelStatus === "pending" && (
                  <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                    <Circle className="w-5 h-5 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Informações do Nível */}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4
                    className={`text-sm font-medium ${
                      nivelStatus === "completed"
                        ? "text-green-700"
                        : nivelStatus === "current"
                        ? "text-amber-700"
                        : "text-gray-500"
                    }`}
                  >
                    Nível {nivel.nivel}: {nivel.nome}
                  </h4>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      nivelStatus === "completed"
                        ? "bg-green-100 text-green-700"
                        : nivelStatus === "current"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {nivelStatus === "completed"
                      ? "Aprovado"
                      : nivelStatus === "current"
                      ? "Aguardando"
                      : "Pendente"}
                  </span>
                </div>
              </div>

              {/* Linha conectora */}
              {index < NIVEIS_APROVACAO.length - 1 && (
                <div className="absolute left-4 w-0.5 h-4 bg-gray-200 ml-3 mt-8" />
              )}
            </div>
          );
        })}
      </div>

      {status === "APROVADO" && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-800 font-medium">
            ✓ Todas as aprovações foram concluídas com sucesso!
          </p>
        </div>
      )}

      {status === "REPROVADO" && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800 font-medium">
            ✗ Este plano foi reprovado. Verifique o histórico para mais detalhes.
          </p>
        </div>
      )}
    </div>
  );
}
