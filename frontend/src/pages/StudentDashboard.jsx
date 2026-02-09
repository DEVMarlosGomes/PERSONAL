import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { MainLayout } from "../components/MainLayout";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Progress } from "../components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogBody,
} from "../components/ui/dialog";
import { Textarea } from "../components/ui/textarea";
import { 
  Dumbbell, 
  Calendar, 
  TrendingUp, 
  CheckCircle2, 
  ChevronRight,
  Play,
  Clock,
  Target,
  Trophy
} from "lucide-react";
import api from "../lib/api";
import { toast } from "sonner";
import { ExerciseCard } from "../components/ExerciseCard";
import { SetTracker } from "../components/SetTracker";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [workout, setWorkout] = useState(null);
  const [stats, setStats] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [weeklySessions, setWeeklySessions] = useState([]);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [sessionNotes, setSessionNotes] = useState("");
  const [sessionDifficulty, setSessionDifficulty] = useState(3);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 6);
      const startStr = startDate.toISOString().split("T")[0];

      const [workoutsRes, statsRes, sessionsRes, weeklyRes] = await Promise.all([
        api.get("/workouts"),
        api.get("/stats/student"),
        api.get("/workout-sessions"),
        api.get(`/workout-sessions?start_date=${startStr}`)
      ]);
      
      if (workoutsRes.data.length > 0) {
        setWorkout(workoutsRes.data[0]);
        if (workoutsRes.data[0].days?.length > 0) {
          setSelectedDay(workoutsRes.data[0].days[0]);
        }
      }
      setStats(statsRes.data);
      setSessions(sessionsRes.data);
      setWeeklySessions(weeklyRes.data);
    } catch (error) {
      toast.error("Erro ao carregar treino");
    } finally {
      setLoading(false);
    }
  };

  const handleExerciseClick = (exercise) => {
    setSelectedExercise(exercise);
  };

  const handleCloseExercise = () => {
    setSelectedExercise(null);
  };

  const handleProgressLogged = () => {
    toast.success("Progresso registrado!");
  };

  const handleCompleteWorkout = async () => {
    if (!workout) return;
    setCompleting(true);
    try {
      await api.post("/workout-sessions", {
        workout_id: workout.id,
        day_name: selectedDay?.day_name,
        notes: sessionNotes || null,
        difficulty: sessionDifficulty
      });
      toast.success("Treino concluído!");
      setIsCompleteDialogOpen(false);
      setSessionNotes("");
      setSessionDifficulty(3);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 6);
      const startStr = startDate.toISOString().split("T")[0];
      const [sessionsRes, weeklyRes] = await Promise.all([
        api.get("/workout-sessions"),
        api.get(`/workout-sessions?start_date=${startStr}`)
      ]);
      setSessions(sessionsRes.data);
      setWeeklySessions(weeklyRes.data);
    } catch (error) {
      toast.error("Erro ao concluir treino");
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </MainLayout>
    );
  }

  if (!workout) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="p-6 rounded-full bg-secondary/50 mb-6">
            <Dumbbell className="w-16 h-16 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Nenhum treino disponível</h2>
          <p className="text-muted-foreground max-w-md">
            Seu personal trainer ainda não enviou seu treino. Aguarde ou entre em contato.
          </p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in" data-testid="student-dashboard">
        {/* Header Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <Target className="w-5 h-5 text-primary mx-auto mb-2" />
              <p className="text-2xl font-black">{stats?.total_exercises || 0}</p>
              <p className="text-xs text-muted-foreground uppercase">Exercícios</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <CheckCircle2 className="w-5 h-5 text-green-400 mx-auto mb-2" />
              <p className="text-2xl font-black">{stats?.progress_logged || 0}</p>
              <p className="text-xs text-muted-foreground uppercase">Registros</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <Calendar className="w-5 h-5 text-cyan-400 mx-auto mb-2" />
              <p className="text-2xl font-black">{workout.days?.length || 0}</p>
              <p className="text-xs text-muted-foreground uppercase">Dias</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-5 h-5 text-orange-400 mx-auto mb-2" />
              <p className="text-2xl font-black">{stats?.workout_streak || 0}</p>
              <p className="text-xs text-muted-foreground uppercase">Sequência</p>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Challenge */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <p className="font-semibold">Desafio semanal</p>
              </div>
              <span className="text-sm text-muted-foreground">
                {weeklySessions.length}/3 treinos
              </span>
            </div>
            <Progress value={Math.min((weeklySessions.length / 3) * 100, 100)} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">Meta: 3 treinos na semana</p>
          </CardContent>
        </Card>

        {/* Workout Name */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tighter uppercase">
              {workout.name}
            </h1>
            <p className="text-muted-foreground text-sm">
              Versão {workout.version} • Atualizado em {new Date(workout.updated_at).toLocaleDateString('pt-BR')}
            </p>
          </div>
          <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" data-testid="complete-workout-btn">
                <CheckCircle2 className="w-4 h-4" />
                Concluir Treino
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold uppercase">Concluir Treino</DialogTitle>
                <DialogDescription>
                  Registre a conclusão do treino do dia
                </DialogDescription>
              </DialogHeader>
              <DialogBody>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Dificuldade geral</p>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <Button
                          key={level}
                          type="button"
                          variant={sessionDifficulty === level ? "default" : "outline"}
                          size="sm"
                          className="flex-1"
                          onClick={() => setSessionDifficulty(level)}
                        >
                          {level}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Observações do treino (opcional)"
                      value={sessionNotes}
                      onChange={(e) => setSessionNotes(e.target.value)}
                      className="bg-secondary/50 border-white/10"
                    />
                  </div>
                </div>
              </DialogBody>
              <DialogFooter>
                <Button onClick={handleCompleteWorkout} disabled={completing}>
                  {completing ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "Concluir"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Day Tabs */}
        {workout.days && workout.days.length > 0 && (
          <Tabs 
            defaultValue={workout.days[0]?.day_name} 
            className="w-full"
            onValueChange={(value) => {
              const day = workout.days.find(d => d.day_name === value);
              setSelectedDay(day);
              setSelectedExercise(null);
            }}
          >
            <TabsList className="w-full flex overflow-x-auto gap-1 bg-secondary/30 p-1 rounded-lg">
              {workout.days.map((day) => (
                <TabsTrigger
                  key={day.day_name}
                  value={day.day_name}
                  className="flex-1 min-w-[100px] data-[state=active]:bg-primary data-[state=active]:text-white font-semibold uppercase text-xs tracking-wide"
                  data-testid={`day-tab-${day.day_name}`}
                >
                  {day.day_name}
                </TabsTrigger>
              ))}
            </TabsList>

            {workout.days.map((day) => (
              <TabsContent key={day.day_name} value={day.day_name} className="mt-6">
                {/* Exercise List */}
                <div className="space-y-4">
                  {day.exercises?.map((exercise, index) => (
                    <ExerciseCard
                      key={`${day.day_name}-${index}`}
                      exercise={exercise}
                      index={index}
                      onClick={() => handleExerciseClick(exercise)}
                      data-testid={`exercise-card-${index}`}
                    />
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}

        {/* Exercise Detail Modal */}
        {selectedExercise && (
          <SetTracker
            exercise={selectedExercise}
            workoutId={workout.id}
            onClose={handleCloseExercise}
            onProgressLogged={handleProgressLogged}
          />
        )}

        {/* Workout Sessions History */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <h3 className="font-bold mb-3 uppercase text-sm text-muted-foreground">Treinos Concluídos</h3>
            {sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Ainda não há treinos concluídos.</p>
            ) : (
              <div className="space-y-2">
                {sessions.slice(0, 6).map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                    <div>
                      <p className="font-semibold">{s.day_name || "Treino"}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(s.completed_at).toLocaleDateString('pt-BR', {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Dificuldade: {s.difficulty || "-"}
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
