import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { MainLayout } from "../components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Calendar, CheckCircle2, ClipboardList } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import api from "../lib/api";
import { toast } from "sonner";

export default function CheckinsPage() {
  const { user } = useAuth();
  const isPersonal = user?.role === "personal";

  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [checkins, setCheckins] = useState([]);
  const [frequency, setFrequency] = useState(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isPersonal) {
      loadStudents();
    } else if (user?.id) {
      setSelectedStudent(user.id);
    }
  }, [isPersonal, user]);

  useEffect(() => {
    if (selectedStudent) {
      loadCheckins();
      loadFrequency();
    }
  }, [selectedStudent]);

  const loadStudents = async () => {
    try {
      const response = await api.get("/students");
      setStudents(response.data);
      if (response.data.length > 0) {
        setSelectedStudent(response.data[0].id);
      }
    } catch (error) {
      toast.error("Erro ao carregar alunos");
    }
  };

  const loadCheckins = async () => {
    setLoading(true);
    try {
      const url = isPersonal
        ? `/checkins?student_id=${selectedStudent}`
        : "/checkins";
      const response = await api.get(url);
      setCheckins(response.data);
    } catch (error) {
      toast.error("Erro ao carregar check-ins");
    } finally {
      setLoading(false);
    }
  };

  const loadFrequency = async () => {
    try {
      const response = await api.get(`/checkins/frequency/${selectedStudent}`);
      setFrequency(response.data);
    } catch (error) {
      setFrequency(null);
    }
  };

  const handleCheckin = async () => {
    setSubmitting(true);
    try {
      await api.post("/checkins", { notes: notes || null });
      toast.success("Check-in realizado!");
      setNotes("");
      loadCheckins();
      loadFrequency();
    } catch (error) {
      toast.error("Erro ao realizar check-in");
    } finally {
      setSubmitting(false);
    }
  };

  const frequencyData = frequency?.frequency_by_date
    ? Object.entries(frequency.frequency_by_date)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date))
    : [];

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase">
              {isPersonal ? "Frequência" : "Check-in"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isPersonal ? "Acompanhe a presença dos alunos" : "Registre sua presença na academia"}
            </p>
          </div>

          {isPersonal && (
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger className="w-[220px] bg-secondary/50 border-white/10">
                <SelectValue placeholder="Selecione o aluno" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {!isPersonal && (
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="space-y-3">
                <Textarea
                  placeholder="Observações (opcional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-secondary/50 border-white/10"
                />
                <Button onClick={handleCheckin} disabled={submitting} className="gap-2">
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Fazer Check-in
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary */}
        {frequency && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Total de check-ins (30 dias)</p>
                <p className="text-2xl font-black">{frequency.total_checkins}</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Dias presentes</p>
                <p className="text-2xl font-black">{frequency.unique_days}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Frequency Chart */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-xl font-bold uppercase flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Frequência (30 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {frequencyData.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                Nenhum dado de frequência disponível
              </div>
            ) : (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={frequencyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="date" stroke="#71717a" tick={{ fill: "#a1a1aa", fontSize: 12 }} />
                    <YAxis stroke="#71717a" tick={{ fill: "#a1a1aa", fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Check-in History */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-xl font-bold uppercase flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-cyan-400" />
              Histórico de Check-ins
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : checkins.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum check-in registrado.</p>
            ) : (
              <div className="space-y-3">
                {checkins.slice(0, 10).map((c) => (
                  <div key={c.id} className="p-3 rounded-lg bg-secondary/30">
                    <p className="text-sm font-semibold">
                      {new Date(c.check_in_time).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </p>
                    {c.notes && <p className="text-xs text-muted-foreground mt-1">{c.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
