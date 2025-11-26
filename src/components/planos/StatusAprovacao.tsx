import { Check, Clock, Circle } from "lucide-react";

interface StatusAprovacaoProps {
  nivelAtual: number | null;
  status: string;
  omNome?: string;
}

export function StatusAprovacao({ nivelAtual, status, omNome }: StatusAprovacaoProps) {
  const getNivelStatus = () => {
    if (status === "APROVADO") {
      return "completed";
    }

    if (status === "REPROVADO" || status === "RASCUNHO") {
      return "pending";
    }

    if (nivelAtual === 1) {
      return "current";
    }

    return "pending";
  };

  const nivelStatus = getNivelStatus();

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Esteira de Aprovação
      </h3>

      <div className="space-y-4">
        <div className="flex items-start">
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
                S4 da OM
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
            <p className="text-xs text-gray-500 mt-1">
              O S4 da Organização Militar é responsável pela aprovação do plano
            </p>
          </div>
        </div>
      </div>

      {status === "RASCUNHO" && (
        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
          <p className="text-sm text-gray-700">
            Este plano ainda não foi enviado para aprovação.
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Após o envio, o S4 da OM poderá aprovar ou reprovar o plano.
          </p>
        </div>
      )}

      {status === "EM_ANALISE" && (
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-md">
          <p className="text-sm text-amber-800 font-medium">
            ⏳ Aguardando aprovação do S4 da OM
          </p>
          <p className="text-xs text-amber-700 mt-1">
            O plano está bloqueado para edições até a conclusão da análise.
          </p>
        </div>
      )}

      {status === "APROVADO" && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-800 font-medium">
            ✓ Plano aprovado pelo S4 da OM!
          </p>
        </div>
      )}

      {status === "REPROVADO" && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800 font-medium">
            ✗ Este plano foi reprovado pelo S4.
          </p>
          <p className="text-xs text-red-700 mt-1">
            Verifique o histórico para mais detalhes e faça as correções necessárias.
          </p>
        </div>
      )}
    </div>
  );
}
