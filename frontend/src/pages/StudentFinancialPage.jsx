import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { MainLayout } from "../components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { DollarSign, Check, Clock, AlertTriangle, Calendar } from "lucide-react";
import api from "../lib/api";
import { toast } from "sonner";

export default function StudentFinancialPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadFinancial();
    }
  }, [user]);

  const loadFinancial = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/financial/student/${user.id}`);
      setPayments(response.data.payments || []);
      setSummary({
        total_received: response.data.total_received,
        total_pending: response.data.total_pending
      });
    } catch (error) {
      toast.error("Erro ao carregar cobranças");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><Check className="w-3 h-3 mr-1" />Pago</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      case "overdue":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><AlertTriangle className="w-3 h-3 mr-1" />Atrasado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase">
            Minha Mensalidade
          </h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe suas cobranças e pagamentos
          </p>
        </div>

        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">TOTAL PAGO</p>
                    <p className="text-2xl font-black text-green-400">{formatCurrency(summary.total_received)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">EM ABERTO</p>
                    <p className="text-2xl font-black text-yellow-400">{formatCurrency(summary.total_pending)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">Todas ({payments.length})</TabsTrigger>
            <TabsTrigger value="pending">Pendentes ({payments.filter(p => p.status === "pending").length})</TabsTrigger>
            <TabsTrigger value="paid">Pagas ({payments.filter(p => p.status === "paid").length})</TabsTrigger>
            <TabsTrigger value="overdue">Atrasadas ({payments.filter(p => p.status === "overdue").length})</TabsTrigger>
          </TabsList>

          {["all", "pending", "paid", "overdue"].map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-4">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="space-y-3">
                  {(tab === "all" ? payments : payments.filter(p => p.status === tab)).map((payment, index) => (
                    <Card
                      key={payment.id}
                      className="bg-card border-border hover:border-primary/50 transition-colors animate-slide-up"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold">{formatCurrency(payment.amount)}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                              <Calendar className="w-3 h-3" />
                              Vencimento: {new Date(payment.due_date).toLocaleDateString("pt-BR")}
                              {payment.notes && ` • ${payment.notes}`}
                            </p>
                          </div>
                          <div className="text-right">
                            {getStatusBadge(payment.status)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {(tab === "all" ? payments : payments.filter(p => p.status === tab)).length === 0 && (
                    <Card className="bg-card border-border">
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <DollarSign className="w-16 h-16 text-muted-foreground mb-4" />
                        <p className="text-lg font-semibold mb-2">Nenhuma cobrança encontrada</p>
                        <p className="text-muted-foreground text-center">Aguarde seu personal registrar as cobranças</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </MainLayout>
  );
}
