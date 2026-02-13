import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { MainLayout } from "../components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import {
  Activity,
  Flame,
  Dumbbell,
  Repeat2,
  CalendarRange,
  Target,
  TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Area,
  AreaChart,
} from "recharts";
import api from "../lib/api";
import { toast } from "sonner";

const toNumber = (value) => Number(value || 0);
const formatVolume = (value) =>
  Number(value || 0).toLocaleString("pt-BR", { maximumFractionDigits: 1 });

const getWeekStart = (dateString) => {
  const date = new Date(dateString);
  const dayIndex = (date.getDay() + 6) % 7;
  const monday = new Date(date);
  monday.setDate(date.getDate() - dayIndex);
  monday.setHours(0, 0, 0, 0);
  return monday;
};

export default function PeriodizationPage() {
  const { user } = useAuth();
  const isPersonal = user?.role === "personal";

  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [workout, setWorkout] = useState(null);
  const [routine, setRoutine] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isPersonal) {
      loadStudents();
    } else {
      loadPeriodizationData();
    }
  }, [isPersonal]);

  useEffect(() => {
    if (isPersonal && selectedStudent) {
      loadPeriodizationData(selectedStudent);
    }
  }, [isPersonal, selectedStudent]);

  const loadStudents = async () => {
    try {
      const response = await api.get("/students");
      setStudents(response.data);
      if (response.data.length > 0) {
        setSelectedStudent(response.data[0].id);
      } else {
        setLoading(false);
      }
    } catch (error) {
      toast.error("Erro ao carregar alunos");
      setLoading(false);
    }
  };

  const loadPeriodizationData = async (studentId = null) => {
    setLoading(true);
    try {
      const query = isPersonal && studentId ? `?student_id=${studentId}` : "";
      const [workoutsRes, sessionsRes, routinesRes] = await Promise.all([
        api.get(`/workouts${query}`),
        api.get(`/workout-sessions${query}`),
        api.get(`/routines${query}`),
      ]);

      const currentWorkout = workoutsRes.data?.[0] || null;
      setWorkout(currentWorkout);
      setSessions(sessionsRes.data || []);

      const availableRoutines = routinesRes.data || [];
      if (currentWorkout?.routine_id) {
        const foundRoutine = availableRoutines.find((r) => r.id === currentWorkout.routine_id);
        setRoutine(foundRoutine || availableRoutines[0] || null);
      } else {
        setRoutine(availableRoutines[0] || null);
      }
    } catch (error) {
      toast.error("Erro ao carregar periodizacao");
    } finally {
      setLoading(false);
    }
  };

  const weeklyData = useMemo(() => {
    const weekMap = new Map();

    sessions.forEach((session) => {
      if (!session.completed_at) return;
      const weekStart = getWeekStart(session.completed_at);
      const key = weekStart.toISOString().slice(0, 10);
      if (!weekMap.has(key)) {
        weekMap.set(key, {
          week_start: key,
          week_label: weekStart.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
          volume_kg: 0,
          calories: 0,
          reps: 0,
          sessions: 0,
          exercises: 0,
        });
      }
      const current = weekMap.get(key);
      current.volume_kg += toNumber(session.total_volume_kg);
      current.calories += toNumber(session.estimated_calories);
      current.reps += toNumber(session.total_reps);
      current.sessions += 1;
      current.exercises += toNumber(session.exercises_completed);
    });

    return Array.from(weekMap.values())
      .sort((a, b) => a.week_start.localeCompare(b.week_start))
      .map((row) => ({
        ...row,
        volume_kg: Number(row.volume_kg.toFixed(1)),
      }));
  }, [sessions]);

  const summary = useMemo(() => {
    const totalVolume = sessions.reduce((acc, s) => acc + toNumber(s.total_volume_kg), 0);
    const totalCalories = sessions.reduce((acc, s) => acc + toNumber(s.estimated_calories), 0);
    const totalExercises = sessions.reduce((acc, s) => acc + toNumber(s.exercises_completed), 0);
    const totalReps = sessions.reduce((acc, s) => acc + toNumber(s.total_reps), 0);

    return {
      totalSessions: sessions.length,
      totalVolume: Number(totalVolume.toFixed(1)),
      totalCalories,
      totalExercises,
      totalReps,
    };
  }, [sessions]);

  const mesocycleRows = useMemo(() => {
    const rows = weeklyData.slice(-6);
    return rows.map((row, index) => {
      const previous = rows[index - 1];
      const trend =
        previous && previous.volume_kg > 0
          ? Number((((row.volume_kg - previous.volume_kg) / previous.volume_kg) * 100).toFixed(1))
          : null;
      return {
        week: `Semana ${index + 1}`,
        ...row,
        trend,
      };
    });
  }, [weeklyData]);

  const periodLabel = useMemo(() => {
    if (routine?.start_date && routine?.end_date) {
      return `${new Date(routine.start_date).toLocaleDateString("pt-BR")} - ${new Date(
        routine.end_date
      ).toLocaleDateString("pt-BR")}`;
    }

    if (sessions.length > 0) {
      const sorted = [...sessions].sort((a, b) => a.completed_at.localeCompare(b.completed_at));
      return `${new Date(sorted[0].completed_at).toLocaleDateString("pt-BR")} - ${new Date(
        sorted[sorted.length - 1].completed_at
      ).toLocaleDateString("pt-BR")}`;
    }

    return "Sem periodo definido";
  }, [routine, sessions]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in" data-testid="periodization-page">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase">Periodizacao</h1>
            <p className="text-muted-foreground mt-1">Volume total e historico semanal de carga.</p>
          </div>

          {isPersonal && (
            <div className="w-full md:w-[280px]">
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger className="bg-secondary/50 border-white/10" data-testid="select-student-periodization">
                  <SelectValue placeholder="Selecione um aluno" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <Card className="bg-gradient-to-br from-primary/15 via-card to-cyan-500/10 border-primary/30">
          <CardContent className="p-5">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant="secondary" className="bg-primary/20 text-primary">
                {routine?.objective || "Objetivo geral"}
              </Badge>
              <Badge variant="outline">{workout?.name || "Treino ativo"}</Badge>
            </div>
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <CalendarRange className="w-4 h-4 text-cyan-400" />
              Periodo: {periodLabel}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <Activity className="w-5 h-5 text-primary mx-auto mb-2" />
              <p className="text-2xl font-black">{summary.totalSessions}</p>
              <p className="text-xs text-muted-foreground uppercase">Sessoes</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <Target className="w-5 h-5 text-cyan-400 mx-auto mb-2" />
              <p className="text-2xl font-black">{formatVolume(summary.totalVolume)} kg</p>
              <p className="text-xs text-muted-foreground uppercase">Volume total</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <Dumbbell className="w-5 h-5 text-green-400 mx-auto mb-2" />
              <p className="text-2xl font-black">{summary.totalExercises}</p>
              <p className="text-xs text-muted-foreground uppercase">Exercicios</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <Repeat2 className="w-5 h-5 text-orange-400 mx-auto mb-2" />
              <p className="text-2xl font-black">{summary.totalReps}</p>
              <p className="text-xs text-muted-foreground uppercase">Repeticoes</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-xl font-bold uppercase flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Evolucao semanal de volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weeklyData.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem sessoes registradas para montar a periodizacao.</p>
            ) : (
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyData}>
                    <defs>
                      <linearGradient id="volumeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="week_label" stroke="#71717a" tick={{ fill: "#a1a1aa", fontSize: 12 }} />
                    <YAxis stroke="#71717a" tick={{ fill: "#a1a1aa", fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", borderRadius: 10 }}
                      formatter={(value, name) => {
                        if (name === "volume_kg") return [`${formatVolume(value)} kg`, "Volume"];
                        if (name === "calories") return [`${Number(value || 0)} kcal`, "Calorias"];
                        return [value, name];
                      }}
                    />
                    <Area type="monotone" dataKey="volume_kg" stroke="#2563eb" fill="url(#volumeGrad)" strokeWidth={2} />
                    <Line type="monotone" dataKey="calories" stroke="#f97316" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-xl font-bold uppercase flex items-center gap-2">
              <CalendarRange className="w-5 h-5 text-cyan-400" />
              Historico do mesociclo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mesocycleRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem dados para o mesociclo atual.</p>
            ) : (
              <div className="space-y-2">
                {mesocycleRows.map((row) => (
                  <div
                    key={row.week_start}
                    className="grid grid-cols-12 gap-2 items-center p-3 rounded-lg bg-secondary/30 border border-border/50"
                  >
                    <div className="col-span-4 md:col-span-2">
                      <p className="font-semibold">{row.week}</p>
                      <p className="text-xs text-muted-foreground">{row.week_label}</p>
                    </div>
                    <div className="col-span-8 md:col-span-4 text-sm">
                      <p>
                        Volume: <span className="font-semibold">{formatVolume(row.volume_kg)} kg</span>
                      </p>
                      <p className="text-muted-foreground">Reps: {row.reps} | Sessoes: {row.sessions}</p>
                    </div>
                    <div className="col-span-6 md:col-span-3 text-sm text-muted-foreground">
                      <p className="flex items-center gap-1">
                        <Flame className="w-3 h-3 text-orange-400" /> {row.calories} kcal
                      </p>
                    </div>
                    <div className="col-span-6 md:col-span-3 text-right">
                      {row.trend === null ? (
                        <span className="text-xs text-muted-foreground">Sem base</span>
                      ) : (
                        <span className={`text-sm font-semibold ${row.trend >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {row.trend > 0 ? "+" : ""}
                          {row.trend}%
                        </span>
                      )}
                    </div>
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
