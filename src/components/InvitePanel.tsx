import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { poolService } from "@/services/poolService";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Copy, Share2, UserCheck, UserX, Link2, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function InvitePanel({ poolId, poolName, inviteCode }: { poolId: string; poolName: string; inviteCode: string }) {
  const qc = useQueryClient();

  const inviteUrl = useMemo(() => {
    return `${window.location.origin}/pools/join?code=${inviteCode}`;
  }, [inviteCode]);

  const whatsappMessage = useMemo(() => {
    return `Você foi convidado para o bolão "${poolName}" da Copa do Mundo 2026! Entre por aqui: ${inviteUrl} (código: ${inviteCode})`;
  }, [poolName, inviteUrl, inviteCode]);

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

  const { data: requests, isLoading } = useQuery({
    queryKey: ["join-requests", poolId],
    queryFn: () => poolService.listJoinRequests(poolId),
    refetchInterval: 15000,
  });

  const decide = useMutation({
    mutationFn: ({ id, approve }: { id: string; approve: boolean }) => poolService.decideJoinRequest(id, approve),
    onSuccess: (_d, vars) => {
      toast.success(vars.approve ? "Membro aprovado!" : "Solicitação recusada.");
      qc.invalidateQueries({ queryKey: ["join-requests", poolId] });
      qc.invalidateQueries({ queryKey: ["members", poolId] });
    },
    onError: (e: any) => toast.error(e.message ?? "Falha ao decidir"),
  });

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      toast.success("Link copiado!");
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `Bolão ${poolName}`, text: whatsappMessage, url: inviteUrl });
      } catch {
        // user cancelled
      }
    } else {
      copyLink();
    }
  };

  return (
    <div className="space-y-4">
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Link2 className="h-5 w-5 text-secondary" />
          <h2 className="font-display text-xl tracking-wide">CONVIDAR AMIGOS</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Compartilhe o link abaixo. Quem entrar pelo link precisa da sua aprovação para virar membro.
        </p>

        <div className="flex items-center gap-2 rounded-md border border-border/40 bg-card/60 p-2">
          <code className="flex-1 truncate text-xs text-foreground/90">{inviteUrl}</code>
          <Button size="sm" variant="outline" onClick={copyLink}>
            <Copy className="mr-1.5 h-3.5 w-3.5" /> Copiar
          </Button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            asChild
            size="sm"
            className="bg-[#25D366] text-white hover:bg-[#1ebe57]"
          >
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="mr-1.5 h-4 w-4" /> Compartilhar no WhatsApp
            </a>
          </Button>
          <Button size="sm" variant="outline" onClick={nativeShare}>
            <Share2 className="mr-1.5 h-4 w-4" /> Compartilhar
          </Button>
        </div>

        <p className="mt-3 text-[11px] text-muted-foreground">
          Código manual: <strong className="text-foreground tracking-widest">{inviteCode}</strong>
        </p>
      </div>

      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-xl tracking-wide">SOLICITAÇÕES PENDENTES</h2>
          {requests && requests.length > 0 && (
            <span className="gold-chip rounded-md px-2 py-1 text-[10px] font-bold">{requests.length}</span>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-secondary" /></div>
        ) : !requests || requests.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma solicitação no momento.</p>
        ) : (
          <ul className="divide-y divide-border/30">
            {requests.map((r: any) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div className="min-w-0">
                  <p className="font-medium truncate">{r.profile?.display_name ?? "Usuário"}</p>
                  <p className="text-[11px] text-muted-foreground">
                    Solicitou {formatDistanceToNow(new Date(r.requested_at), { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => decide.mutate({ id: r.id, approve: true })}
                    disabled={decide.isPending}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <UserCheck className="mr-1 h-3.5 w-3.5" /> Aprovar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => decide.mutate({ id: r.id, approve: false })}
                    disabled={decide.isPending}
                  >
                    <UserX className="mr-1 h-3.5 w-3.5" /> Recusar
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
