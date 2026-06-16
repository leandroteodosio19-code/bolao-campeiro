import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { poolService } from "@/services/poolService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Clock, CheckCircle2 } from "lucide-react";

const JoinPool = () => {
  const { user } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [code, setCode] = useState("");
  const [result, setResult] = useState<{ status: string; name: string; id: string } | null>(null);

  useEffect(() => {
    const c = params.get("code");
    if (c) setCode(c.toUpperCase().slice(0, 6));
  }, [params]);

  const m = useMutation({
    mutationFn: () => poolService.joinByCode(code, user!.id),
    onSuccess: (p) => {
      setResult(p);
      if (p.status === "already_member") {
        toast.success(`Você já é membro de "${p.name}"`);
        nav(`/pools/${p.id}`);
      } else {
        toast.success("Solicitação enviada! Aguarde a aprovação do admin.");
      }
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <AppLayout>
      <h1 className="font-display text-4xl tracking-wide">ENTRAR EM UM BOLÃO</h1>
      <p className="text-sm text-muted-foreground mb-6">Informe o código de 6 caracteres que o organizador te passou</p>

      {result?.status === "pending" ? (
        <div className="glass-card p-6 max-w-sm">
          <div className="flex items-start gap-3">
            <Clock className="h-6 w-6 text-secondary mt-0.5" />
            <div>
              <h2 className="font-display text-xl">Solicitação enviada</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Seu pedido para entrar em <strong className="text-foreground">{result.name}</strong> está aguardando a aprovação do administrador. Você receberá acesso assim que for aprovado.
              </p>
              <Button variant="outline" className="mt-4" onClick={() => nav("/dashboard")}>Voltar ao dashboard</Button>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); m.mutate(); }} className="glass-card p-6 space-y-4 max-w-sm">
          <div>
            <Label htmlFor="code">Código de convite</Label>
            <Input id="code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={6} required className="font-display text-2xl tracking-[0.4em] text-center uppercase" placeholder="XXXXXX" />
          </div>
          <Button type="submit" disabled={m.isPending || code.length < 4} className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold">
            {m.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Solicitar entrada
          </Button>
          <p className="text-xs text-muted-foreground flex items-start gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            O administrador do bolão precisa aprovar sua entrada.
          </p>
        </form>
      )}
    </AppLayout>
  );
};

export default JoinPool;
