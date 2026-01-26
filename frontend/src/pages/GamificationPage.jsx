import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { MainLayout } from "../components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { 
  Trophy, 
  Medal, 
  Crown, 
  Flame, 
  TrendingUp, 
  Award, 
  Zap, 
  Grid3X3,
  Star,
  Target
} from "lucide-react";
import api from "../lib/api";
import { toast } from "sonner";

const BADGE_ICONS = {
  trophy: Trophy,
  flame: Flame,
  fire: Flame,
  zap: Zap,
  "trending-up": TrendingUp,
  award: Award,
  grid: Grid3X3,
  medal: Medal,
  crown: Crown,
};

const BADGE_COLORS = {
  yellow: "from-yellow-500 to-amber-600",
  orange: "from-orange-500 to-red-500",
  red: "from-red-500 to-rose-600",
  purple: "from-purple-500 to-violet-600",
  green: "from-green-500 to-emerald-600",
  blue: "from-blue-500 to-indigo-600",
  cyan: "from-cyan-500 to-teal-600",
  gold: "from-yellow-400 to-amber-500",
  platinum: "from-slate-300 to-slate-500",
};

export default function GamificationPage() {
  const { user } = useAuth();
  const isPersonal = user?.role === "personal";
  
  const [badges, setBadges] = useState({ earned: [], total_available: 0 });
  const [records, setRecords] = useState({});
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      if (isPersonal) {
        const response = await api.get("/gamification/ranking");
        setRanking(response.data);
      } else {
        const [badgesRes, recordsRes] = await Promise.all([
          api.get("/gamification/badges"),
          api.get("/gamification/records")
        ]);
        setBadges(badgesRes.data);
        setRecords(recordsRes.data);
      }
    } catch (error) {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const BadgeCard = ({ badge, earned = true }) => {
    const IconComponent = BADGE_ICONS[badge.icon] || Trophy;
    const colorClass = BADGE_COLORS[badge.color] || BADGE_COLORS.blue;
    
    return (
      <div 
        className={`relative p-4 rounded-xl border transition-all ${
          earned 
            ? "bg-gradient-to-br " + colorClass + " border-white/20 shadow-lg" 
            : "bg-secondary/30 border-border opacity-50"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-lg ${earned ? "bg-white/20" : "bg-secondary"}`}>
            <IconComponent className={`w-6 h-6 ${earned ? "text-white" : "text-muted-foreground"}`} />
          </div>
          <div>
            <h3 className={`font-bold ${earned ? "text-white" : "text-muted-foreground"}`}>
              {badge.name}
            </h3>
            <p className={`text-xs ${earned ? "text-white/80" : "text-muted-foreground"}`}>
              {badge.description}
            </p>
          </div>
        </div>
        {earned && (
          <div className="absolute top-2 right-2">
            <Star className="w-4 h-4 text-white fill-white" />
          </div>
        )}
      </div>
    );
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

  // Personal Trainer View - Ranking
  if (isPersonal) {
    return (
      <MainLayout>
        <div className="space-y-6 animate-fade-in" data-testid="ranking-page">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase">
              Ranking dos Alunos
            </h1>
            <p className="text-muted-foreground mt-1">
              Acompanhe o desempenho e engajamento
            </p>
          </div>

          {ranking.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Trophy className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum aluno com progresso registrado</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {ranking.map((student, index) => (
                <Card 
                  key={student.student_id}
                  className={`bg-card border-border overflow-hidden animate-slide-up ${
                    index < 3 ? "border-l-4" : ""
                  } ${
                    index === 0 ? "border-l-yellow-500" :
                    index === 1 ? "border-l-slate-400" :
                    index === 2 ? "border-l-amber-700" : ""
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                  data-testid={`ranking-item-${student.student_id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Rank Badge */}
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg ${
                        index === 0 ? "bg-gradient-to-br from-yellow-400 to-amber-500 text-white" :
                        index === 1 ? "bg-gradient-to-br from-slate-300 to-slate-400 text-slate-800" :
                        index === 2 ? "bg-gradient-to-br from-amber-600 to-amber-700 text-white" :
                        "bg-secondary text-muted-foreground"
                      }`}>
                        {index === 0 ? <Crown className="w-6 h-6" /> :
                         index === 1 ? <Medal className="w-6 h-6" /> :
                         index === 2 ? <Award className="w-6 h-6" /> :
                         student.rank}
                      </div>
                      
                      {/* Student Info */}
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">{student.student_name}</h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Target className="w-4 h-4" />
                            {student.progress_count} treinos
                          </span>
                          <span className="flex items-center gap-1">
                            <Flame className="w-4 h-4 text-orange-500" />
                            {student.streak} dias
                          </span>
                          <span className="flex items-center gap-1">
                            <Trophy className="w-4 h-4 text-yellow-500" />
                            {student.badges_count} badges
                          </span>
                        </div>
                      </div>
                      
                      {/* Score */}
                      <div className="text-right">
                        <p className="text-2xl font-black text-primary">{student.score}</p>
                        <p className="text-xs text-muted-foreground">pontos</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </MainLayout>
    );
  }

  // Student View - Badges & Records
  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in" data-testid="gamification-page">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase">
            Conquistas
          </h1>
          <p className="text-muted-foreground mt-1">
            {badges.earned_count} de {badges.total_available} badges conquistados
          </p>
        </div>

        {/* Progress */}
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Progresso</span>
              <span className="text-sm text-muted-foreground">
                {Math.round((badges.earned_count / badges.total_available) * 100)}%
              </span>
            </div>
            <Progress 
              value={(badges.earned_count / badges.total_available) * 100} 
              className="h-3"
            />
          </CardContent>
        </Card>

        <Tabs defaultValue="badges">
          <TabsList className="w-full bg-secondary/30">
            <TabsTrigger value="badges" className="flex-1 gap-2">
              <Trophy className="w-4 h-4" />
              Badges
            </TabsTrigger>
            <TabsTrigger value="records" className="flex-1 gap-2">
              <TrendingUp className="w-4 h-4" />
              Recordes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="badges" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {badges.earned.map((badge, index) => (
                <div 
                  key={badge.id} 
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <BadgeCard badge={badge} earned={true} />
                </div>
              ))}
            </div>
            
            {badges.earned.length === 0 && (
              <Card className="bg-card border-border">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Trophy className="w-16 h-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Complete treinos para ganhar badges!</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="records" className="mt-6">
            {Object.keys(records).length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <TrendingUp className="w-16 h-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Registre seus treinos para ver seus recordes!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {Object.entries(records).map(([exerciseName, record], index) => (
                  <Card 
                    key={exerciseName}
                    className="bg-card border-border animate-slide-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold">{exerciseName}</h3>
                          <p className="text-xs text-muted-foreground">
                            Alcançado em {new Date(record.date).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black text-primary">{record.weight}kg</p>
                          <p className="text-xs text-muted-foreground">{record.reps} reps</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
