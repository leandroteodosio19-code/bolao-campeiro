import { Info } from "lucide-react";

export function MockMatchesBanner() {
  return (
    <div className="mb-4 flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/10 p-3 text-sm">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <div className="text-foreground">
        <strong className="font-semibold">Base carregada com jogos reais da Copa 2026.</strong>{" "}
        Resultados podem ser atualizados manualmente ou via integração futura.
      </div>
    </div>
  );
}
