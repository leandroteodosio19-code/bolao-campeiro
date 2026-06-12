import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { poolService } from "@/services/poolService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const JoinPool = () => {
  const { user } = useAuth();
  const nav = useNavigate();
  const [code, setCode] = useState("");
  const m = useMutation({
    mutationFn: () => poolService.joinByCode(code, user!.id),
    onSuccess: (p) => { toast.success(`Entrou no bolão "${p.name}"!`); nav(`/pools/${p.id}`); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <AppLayout>
      <h1 className="font-display text-4xl tracking-wide">ENTRAR EM UM BOLÃO</h1>
      <p className="text-sm text-muted-foreground mb-6">Informe o código de 6 caracteres que o organizador te passou</p>
      <form onSubmit={(e) => { e.preventDefault(); m.mutate(); }} className="glass-card p-6 space-y-4 max-w-sm">
        <div>
          <Label htmlFor="code">Código de convite</Label>
          <Input id="code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={6} required className="font-display text-2xl tracking-[0.4em] text-center uppercase" placeholder="XXXXXX" />
        </div>
        <Button type="submit" disabled={m.isPending || code.length < 4} className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold">
          {m.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Entrar
        </Button>
      </form>
    </AppLayout>
  );
};

export default JoinPool;
