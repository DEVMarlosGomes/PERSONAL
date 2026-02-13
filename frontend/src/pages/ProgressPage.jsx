import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { MainLayout } from "../components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { TrendingUp, Dumbbell, Calendar, Weight } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from "recharts";
import api from "../lib/api";
import { toast } from "sonner";

export default function ProgressPage() {
  const { user } = useAuth();
  const isPersonal = user?.role === "personal";
  
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [workouts, setWorkouts] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState("");
  const [evolutionData, setEvolutionData] = useState([]);
  const [progressHistory, setProgressHistory] = useState([]);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState("weight");

  useEffect(() => {
    if (isPersonal) {
      loadStudents();
    } else {
      loadStudentData();
    }
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      loadWorkouts(selectedStudent);
    }
  }, [selectedStudent]);

  useEffect(() => {
    if (selectedExercise) {
      loadEvolution();
    }
  }, [selectedExercise]);

  const loadStudents = async () => {
    try {
      const response = await api.get("/students");
      setStudents(response.data);
      if (response.data.length > 0) {
        setSelectedStudent(response.data[0].id);
      }
    } catch (error) {
      toast.error("Erro ao carregar alunos");
    } finally {
      setLoading(false);
    }
  };

  const loadStudentData = async () => {
    try {
      const [workoutsRes, progressRes, sessionsRes] = await Promise.all([
        api.get("/workouts"),
        api.get("/progress"),
        api.get("/workout-sessions"),
      ]);
      
      setWorkouts(workoutsRes.data);
      setProgressHistory(progressRes.data);
      setSessionHistory(sessionsRes.data);
      
      // Extract unique exercises
      const allExercises = new Set();
      workoutsRes.data.forEach(w => {
        w.days?.forEach(d => {
          d.exercises?.forEach(e => allExercises.add(e.name));
        });
      });
      setExercises([...allExercises]);
      
      if (allExercises.size > 0) {
        setSelectedExercise([...allExercises][0]);
      }
    } catch (error) {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const loadWorkouts = async (studentId) => {
    try {
      const response = await api.get(`/workouts?student_id=${studentId}`);
      setWorkouts(response.data);
      loadSessionHistory(studentId);
      
      const allExercises = new Set();
      response.data.forEach(w => {
        w.days?.forEach(d => {
          d.exercises?.forEach(e => allExercises.add(e.name));
        });
      });
      setExercises([...allExercises]);
      
      if (allExercises.size > 0) {
        setSelectedExercise([...allExercises][0]);
      }
    } catch (error) {
      console.error("Error loading workouts:", error);
    }
  };

  const loadSessionHistory = async (studentId = null) => {
    try {
      if (isPersonal) {
        if (!studentId) {
          setSessionHistory([]);
          return;
        }
        const response = await api.get(`/workout-sessions?student_id=${studentId}`);
        setSessionHistory(response.data);
        return;
      }

      const response = await api.get("/workout-sessions");
      setSessionHistory(response.data);
    } catch (error) {
      console.error("Error loading sessions:", error);
      setSessionHistory([]);
    }
  };

  const loadEvolution = async () => {
    try {
      const params = new URLSearchParams({ exercise_name: selectedExercise });
      if (isPersonal && selectedStudent) {
        params.append("student_id", selectedStudent);
      }
      
      const response = await api.get(`/progress/evolution?${params}`);
      setEvolutionData(response.data);
    } catch (error) {
      console.error("Error loading evolution:", error);
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card p-3 rounded-lg border border-border shadow-lg">
          <p className="text-sm font-semibold mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name === "weight" ? "Carga" : "Reps"}: {entry.value}
              {entry.name === "weight" ? " kg" : ""}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in" data-testid="progress-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase">
              {isPersonal ? "Evolução dos Alunos" : "Minha Evolução"}
            </h1>
            <p className="text-muted-foreground mt-1">
              Acompanhe o progresso ao longo do tempo
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {isPersonal && (
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Aluno</label>
                  <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                    <SelectTrigger className="bg-secondary/50 border-white/10" data-testid="select-student-progress">
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

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Exercício</label>
                <Select value={selectedExercise} onValueChange={setSelectedExercise}>
                  <SelectTrigger className="bg-secondary/50 border-white/10" data-testid="select-exercise-progress">
                    <SelectValue placeholder="Selecione um exercício" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {exercises.map((exercise) => (
                      <SelectItem key={exercise} value={exercise}>
                        {exercise}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Métrica</label>
                <Tabs value={chartType} onValueChange={setChartType} className="w-full">
                  <TabsList className="w-full bg-secondary/30">
                    <TabsTrigger value="weight" className="flex-1 gap-1 text-xs" data-testid="metric-weight">
                      <Weight className="w-3 h-3" />
                      Carga
                    </TabsTrigger>
                    <TabsTrigger value="reps" className="flex-1 gap-1 text-xs" data-testid="metric-reps">
                      <Dumbbell className="w-3 h-3" />
                      Reps
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chart */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-xl font-bold uppercase flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Evolução por Exercício
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : evolutionData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <TrendingUp className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  Nenhum dado de progresso registrado para este exercício
                </p>
                {!isPersonal && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Complete seus treinos para ver sua evolução aqui
                  </p>
                )}
              </div>
            ) : (
              <div className="h-[400px]" data-testid="evolution-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={evolutionData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#71717a"
                      tick={{ fill: '#a1a1aa', fontSize: 12 }}
                    />
                    <YAxis 
                      stroke="#71717a"
                      tick={{ fill: '#a1a1aa', fontSize: 12 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey={chartType}
                      stroke="#2563eb"
                      strokeWidth={2}
                      fill="url(#colorValue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Workout Session History (Student + Personal) */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-xl font-bold uppercase flex items-center gap-2">
              <Calendar className="w-5 h-5 text-cyan-400" />
              {isPersonal ? "Historico do Aluno" : "Historico de Sessoes"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sessionHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma sessao concluida encontrada.</p>
            ) : (
              <div className="space-y-3">
                {sessionHistory.slice(0, 12).map((session) => (
                  <div key={session.id} className="p-4 rounded-lg bg-secondary/30 border border-border/50">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div>
                        <p className="font-semibold">{session.day_name || "Treino"}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(session.completed_at).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div className="text-sm">
                        <p>
                          <span className="text-muted-foreground">Volume:</span>{" "}
                          <span className="font-semibold">
                            {Number(session.total_volume_kg || 0).toLocaleString("pt-BR", {
                              maximumFractionDigits: 1,
                            })}{" "}
                            kg
                          </span>
                        </p>
                        <p className="text-muted-foreground">
                          Exercicios: {session.exercises_completed || 0} | Reps: {session.total_reps || 0}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      PSR {session.recovery_score || "-"} | PSE {session.effort_score || "-"} | Sensacao:{" "}
                      <span className="capitalize">{session.feedback || "-"}</span> | Kcal:{" "}
                      <span className="font-medium">{session.estimated_calories || 0}</span>
                    </div>
                    {session.notes && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        Obs.: {session.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Progress History */}
        {!isPersonal && progressHistory.length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-xl font-bold uppercase flex items-center gap-2">
                <Calendar className="w-5 h-5 text-cyan-400" />
                Histórico de Treinos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {progressHistory.slice(0, 10).map((progress, index) => (
                  <div
                    key={progress.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 animate-slide-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div>
                      <p className="font-semibold">{progress.exercise_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(progress.logged_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      {progress.sets_completed?.map((set, idx) => (
                        <span key={idx} className="text-sm">
                          {set.weight}kg x {set.reps}
                          {idx < progress.sets_completed.length - 1 && " | "}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
