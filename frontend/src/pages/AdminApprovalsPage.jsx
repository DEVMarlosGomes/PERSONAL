import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { CheckCircle2, RefreshCw, ShieldCheck, UserCheck, LogOut } from "lucide-react";
import api from "../lib/api";
import { toast } from "sonner";

export default function AdminApprovalsPage() {
  const { user, logout } = useAuth();
  const [pendingPersonals, setPendingPersonals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState("");

  const loadPendingPersonals = async () => {
    setLoading(true);
    try {
      const response = await api.get("/admin/personals/pending");
      setPendingPersonals(response.data || []);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao carregar pendencias");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingPersonals();
  }, []);

  const handleApprove = async (personalId) => {
    setApprovingId(personalId);
    try {
      await api.post(`/admin/personals/${personalId}/approve`);
      toast.success("Conta aprovada com sucesso");
      setPendingPersonals((prev) => prev.filter((p) => p.id !== personalId));
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao aprovar conta");
    } finally {
      setApprovingId("");
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-primary" />
                Painel Administrador
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Usuario: {user?.name} ({user?.email})
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={loadPendingPersonals} disabled={loading}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
              <Button variant="destructive" onClick={logout}>
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </CardHeader>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-xl font-bold uppercase flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-cyan-400" />
              Personais pendentes
              <Badge variant="outline">{pendingPersonals.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : pendingPersonals.length === 0 ? (
              <div className="text-center py-10">
                <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
                <p className="font-semibold">Nenhuma aprovacao pendente</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Novos personais aparecerao aqui para aprovacao.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingPersonals.map((personal) => (
                  <div
                    key={personal.id}
                    className="p-4 rounded-lg bg-secondary/30 border border-border flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                  >
                    <div>
                      <p className="font-semibold">{personal.name}</p>
                      <p className="text-sm text-muted-foreground">{personal.email}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Cadastro: {new Date(personal.created_at).toLocaleString("pt-BR")}
                      </p>
                    </div>
                    <Button
                      onClick={() => handleApprove(personal.id)}
                      disabled={approvingId === personal.id}
                      className="min-w-[150px]"
                    >
                      {approvingId === personal.id ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Aprovar conta
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
