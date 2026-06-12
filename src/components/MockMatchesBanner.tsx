import { AlertTriangle } from "lucide-react";

export function MockMatchesBanner() {
  return (
    <div className="mb-4 flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
      <div className="text-foreground">
        <strong className="font-semibold">Jogos demonstrativos.</strong>{" "}
        Os confrontos atuais são fictícios para você testar o bolão. Eles serão
        substituídos pelas partidas reais da Copa do Mundo 2026 via integração externa.
      </div>
    </div>
  );
}
