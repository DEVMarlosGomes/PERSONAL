import { useState, useEffect } from "react";
import { MainLayout } from "../components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { DollarSign, Plus, Check, Clock, AlertTriangle, TrendingUp, Users, Calendar, Trash2 } from "lucide-react";
import api from "../lib/api";
import { toast } from "sonner";

export default function FinancialPage() {
  const [students, setStudents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
    end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split("T")[0]
  });
  const [formData, setFormData] = useState({
    student_id: "",
    amount: "",
    due_date: new Date().toISOString().split("T")[0],
    status: "pending",
    payment_method: "",
    notes: ""
  });

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    loadPayments();
    loadSummary();
  }, [dateRange]);

  const loadStudents = async () => {
    try {
      const response = await api.get("/students");
      setStudents(response.data);
    } catch (error) {
      toast.error("Erro ao carregar alunos");
    }
  };

  const loadPayments = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/financial/payments?start_date=${dateRange.start}&end_date=${dateRange.end}`);
      setPayments(response.data);
    } catch (error) {
      toast.error("Erro ao carregar pagamentos");
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const response = await api.get(`/financial/summary?start_date=${dateRange.start}&end_date=${dateRange.end}`);
      setSummary(response.data);
    } catch (error) {
      console.error("Erro ao carregar resumo");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.student_id || !formData.amount || !formData.due_date) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/financial/payments", {
        ...formData,
        amount: parseFloat(formData.amount)
      });
      toast.success("Pagamento registrado com sucesso!");
      setIsAddDialogOpen(false);
      setFormData({
        student_id: "",
        amount: "",
        due_date: new Date().toISOString().split("T")[0],
        status: "pending",
        payment_method: "",
        notes: ""
      });
      loadPayments();
      loadSummary();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao registrar pagamento");
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkAsPaid = async (paymentId) => {
    try {
      await api.put(`/financial/payments/${paymentId}`, {
        status: "paid",
        payment_date: new Date().toISOString().split("T")[0]
      });
      toast.success("Pagamento confirmado!");
      loadPayments();
      loadSummary();
    } catch (error) {
      toast.error("Erro ao confirmar pagamento");
    }
  };

  const handleDelete = async (paymentId) => {
    if (!confirm("Tem certeza que deseja excluir este pagamento?")) return;
    try {
      await api.delete(`/financial/payments/${paymentId}`);
      toast.success("Pagamento removido");
      loadPayments();
      loadSummary();
    } catch (error) {
      toast.error("Erro ao remover pagamento");
    }
  };

  const getStudentName = (studentId) => {
    const student = students.find(s => s.id === studentId);
    return student?.name || "Aluno não encontrado";
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
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase">
              Financeiro
            </h1>
            <p className="text-muted-foreground mt-1">
              Controle de pagamentos e mensalidades
            </p>
          </div>

          <div className="flex gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                className="bg-secondary/50 border-white/10 w-[140px]"
              />
              <span className="text-muted-foreground">até</span>
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                className="bg-secondary/50 border-white/10 w-[140px]"
              />
            </div>

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  + Pagamento
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold uppercase">Novo Pagamento</DialogTitle>
                  <DialogDescription>
                    Registre um novo pagamento ou cobrança
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Aluno *</Label>
                    <Select value={formData.student_id} onValueChange={(v) => setFormData({...formData, student_id: v})}>
                      <SelectTrigger className="bg-secondary/50 border-white/10">
                        <SelectValue placeholder="Selecione o aluno" />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Valor *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => setFormData({...formData, amount: e.target.value})}
                        className="bg-secondary/50 border-white/10"
                        placeholder="150.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Vencimento *</Label>
                      <Input
                        type="date"
                        value={formData.due_date}
                        onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                        className="bg-secondary/50 border-white/10"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                        <SelectTrigger className="bg-secondary/50 border-white/10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="paid">Pago</SelectItem>
                          <SelectItem value="overdue">Atrasado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Forma de Pagamento</Label>
                      <Select value={formData.payment_method} onValueChange={(v) => setFormData({...formData, payment_method: v})}>
                        <SelectTrigger className="bg-secondary/50 border-white/10">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pix">PIX</SelectItem>
                          <SelectItem value="dinheiro">Dinheiro</SelectItem>
                          <SelectItem value="cartao">Cartão</SelectItem>
                          <SelectItem value="transferencia">Transferência</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Observações</Label>
                    <Input
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      className="bg-secondary/50 border-white/10"
                      placeholder="Referente a..."
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        "Registrar Pagamento"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">RECEBIDO NO PERÍODO</p>
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
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ATRASADO</p>
                    <p className="text-2xl font-black text-red-400">{formatCurrency(summary.total_overdue)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Payments Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">Todos ({payments.length})</TabsTrigger>
            <TabsTrigger value="pending">Pendentes ({payments.filter(p => p.status === "pending").length})</TabsTrigger>
            <TabsTrigger value="paid">Pagos ({payments.filter(p => p.status === "paid").length})</TabsTrigger>
            <TabsTrigger value="overdue">Atrasados ({payments.filter(p => p.status === "overdue").length})</TabsTrigger>
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
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                              <span className="text-primary font-bold">
                                {getStudentName(payment.student_id).charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-bold">{getStudentName(payment.student_id)}</p>
                              <p className="text-sm text-muted-foreground flex items-center gap-2">
                                <Calendar className="w-3 h-3" />
                                Vencimento: {new Date(payment.due_date).toLocaleDateString('pt-BR')}
                                {payment.notes && ` • ${payment.notes}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-xl font-black">{formatCurrency(payment.amount)}</p>
                              {getStatusBadge(payment.status)}
                            </div>
                            <div className="flex gap-2">
                              {payment.status !== "paid" && (
                                <Button size="sm" variant="outline" onClick={() => handleMarkAsPaid(payment.id)}>
                                  <Check className="w-4 h-4" />
                                </Button>
                              )}
                              <Button size="sm" variant="ghost" onClick={() => handleDelete(payment.id)}>
                                <Trash2 className="w-4 h-4 text-red-400" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {(tab === "all" ? payments : payments.filter(p => p.status === tab)).length === 0 && (
                    <Card className="bg-card border-border">
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <DollarSign className="w-16 h-16 text-muted-foreground mb-4" />
                        <p className="text-lg font-semibold mb-2">Nenhum pagamento encontrado</p>
                        <p className="text-muted-foreground text-center">Ajuste o período ou adicione um novo pagamento</p>
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
