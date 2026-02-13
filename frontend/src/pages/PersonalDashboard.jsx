import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { MainLayout } from "../components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Users, Dumbbell, TrendingUp, Plus, Upload, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../lib/api";
import { toast } from "sonner";

export default function PersonalDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ students_count: 0, workouts_count: 0, recent_progress: 0 });
  const [recentStudents, setRecentStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [statsRes, studentsRes] = await Promise.all([
        api.get("/stats/personal"),
        api.get("/students")
      ]);
      setStats(statsRes.data);
      setRecentStudents(studentsRes.data.slice(0, 5));
    } catch (error) {
      toast.error("Erro ao carregar dashboard");
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Alunos",
      value: stats.students_count,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
      link: "/alunos"
    },
    {
      title: "Treinos Ativos",
      value: stats.workouts_count,
      icon: Dumbbell,
      color: "text-cyan-400",
      bgColor: "bg-cyan-400/10",
      link: "/treinos"
    },
    {
      title: "Progresso (7 dias)",
      value: stats.recent_progress,
      icon: TrendingUp,
      color: "text-green-400",
      bgColor: "bg-green-400/10",
      link: "/evolucao"
    }
  ];

  return (
    <MainLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase">
              Olá, <span className="gradient-text">{user?.name?.split(' ')[0]}</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie seus alunos e treinos
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/alunos">
              <Button variant="outline" className="gap-2" data-testid="add-student-btn">
                <Plus className="w-4 h-4" />
                Novo Aluno
              </Button>
            </Link>
            <Link to="/treinos">
              <Button className="gap-2" data-testid="upload-workout-btn">
                <Upload className="w-4 h-4" />
                Upload Treino
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {statCards.map((stat, index) => (
            <Link to={stat.link} key={stat.title}>
              <Card 
                className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer card-hover"
                style={{ animationDelay: `${index * 100}ms` }}
                data-testid={`stat-card-${stat.title.toLowerCase()}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground uppercase tracking-wide">
                        {stat.title}
                      </p>
                      <p className="text-4xl font-black mt-2">{stat.value}</p>
                    </div>
                    <div className={`p-4 rounded-lg ${stat.bgColor}`}>
                      <stat.icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Recent Students */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-bold uppercase tracking-tight">
              Alunos Recentes
            </CardTitle>
            <Link to="/alunos">
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground">
                Ver todos
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : recentStudents.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum aluno cadastrado</p>
                <Link to="/alunos">
                  <Button variant="outline" className="mt-4 gap-2">
                    <Plus className="w-4 h-4" />
                    Adicionar primeiro aluno
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentStudents.map((student, index) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors animate-slide-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                    data-testid={`student-item-${student.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-primary font-bold">
                          {student.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold">{student.name}</p>
                        <p className="text-sm text-muted-foreground">{student.email}</p>
                      </div>
                    </div>
                    <Link to={`/treinos?student=${student.id}`}>
                      <Button variant="ghost" size="sm">
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold mb-2">Upload de Planilha</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Envie um arquivo .csv, .xls ou .xlsx com o treino completo do aluno
              </p>
              <Link to="/treinos">
                <Button className="gap-2" data-testid="quick-upload-btn">
                  <Upload className="w-4 h-4" />
                  Fazer Upload
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 border-cyan-500/30">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold mb-2">Ver Evolução</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Acompanhe o progresso dos seus alunos
              </p>
              <Link to="/evolucao">
                <Button variant="outline" className="gap-2 border-cyan-500/50 hover:bg-cyan-500/10" data-testid="quick-progress-btn">
                  <TrendingUp className="w-4 h-4" />
                  Ver Gráficos
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
