import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { poolService } from "@/services/poolService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const NewPool = () => {
  const { user } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [bonusLockAt, setBonusLockAt] = useState("");

  const m = useMutation({
    mutationFn: () => poolService.create({
      name,
      description: desc || undefined,
      ownerId: user!.id,
      bonusLockAt: bonusLockAt ? new Date(bonusLockAt).toISOString() : undefined,
    }),
    onSuccess: (p) => { toast.success(`Bolão criado! Código: ${p.invite_code}`); nav(`/pools/${p.id}`); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <AppLayout>
      <h1 className="font-display text-4xl tracking-wide">CRIAR BOLÃO</h1>
      <p className="text-sm text-muted-foreground mb-6">Defina nome e compartilhe o código com a turma</p>
      <form onSubmit={(e) => { e.preventDefault(); m.mutate(); }} className="glass-card p-6 space-y-4 max-w-xl">
        <div>
          <Label htmlFor="name">Nome do bolão</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ex.: Bolão dos amigos" />
        </div>
        <div>
          <Label htmlFor="desc">Descrição (opcional)</Label>
          <Textarea id="desc" value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} />
        </div>
        <div>
          <Label htmlFor="lock">Prazo para palpites bônus (opcional)</Label>
          <Input id="lock" type="datetime-local" value={bonusLockAt} onChange={(e) => setBonusLockAt(e.target.value)} />
          <p className="mt-1 text-xs text-muted-foreground">Se vazio, será definido automaticamente como o início do primeiro jogo.</p>
        </div>
        <Button type="submit" disabled={m.isPending} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold">
          {m.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Criar bolão
        </Button>
      </form>
    </AppLayout>
  );
};

export default NewPool;
