import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { MainLayout } from "../components/MainLayout";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Progress } from "../components/ui/progress";
import { 
  Dumbbell, 
  Calendar, 
  TrendingUp, 
  CheckCircle2, 
  ChevronRight,
  Play,
  Clock,
  Target
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [workoutsRes, statsRes] = await Promise.all([
        api.get("/workouts"),
        api.get("/stats/student")
      ]);
      
      if (workoutsRes.data.length > 0) {
        setWorkout(workoutsRes.data[0]);
        if (workoutsRes.data[0].days?.length > 0) {
          setSelectedDay(workoutsRes.data[0].days[0]);
        }
      }
      setStats(statsRes.data);
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
      </div>
    </MainLayout>
  );
}
