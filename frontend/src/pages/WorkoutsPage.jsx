import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { MainLayout } from "../components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Dumbbell,
  Calendar,
  Trash2,
  Eye,
  Image as ImageIcon,
  Camera
} from "lucide-react";
import api from "../lib/api";
import { toast } from "sonner";
import { ExerciseImageUpload } from "../components/ExerciseImageUpload";

export default function WorkoutsPage() {
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef(null);
  const [students, setStudents] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(searchParams.get("student") || "none");
  const [uploadedWorkout, setUploadedWorkout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [imageUploadDialog, setImageUploadDialog] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedStudent && selectedStudent !== "none") {
      loadWorkouts(selectedStudent);
    } else {
      loadWorkouts();
    }
  }, [selectedStudent]);

  const loadData = async () => {
    try {
      const [studentsRes, workoutsRes] = await Promise.all([
        api.get("/students"),
        api.get("/workouts")
      ]);
      setStudents(studentsRes.data);
      setWorkouts(workoutsRes.data);
    } catch (error) {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const loadWorkouts = async (studentId = null) => {
    try {
      const url = studentId ? `/workouts?student_id=${studentId}` : "/workouts";
      const response = await api.get(url);
      setWorkouts(response.data);
    } catch (error) {
      console.error("Error loading workouts:", error);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xls') && !file.name.endsWith('.xlsx')) {
      toast.error("Apenas arquivos .xls ou .xlsx são aceitos");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    if (selectedStudent && selectedStudent !== "none") {
      formData.append("student_id", selectedStudent);
    }

    try {
      const response = await api.post("/workouts/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setUploadedWorkout(response.data);
      toast.success(`Treino "${response.data.name}" processado com sucesso!`);
      loadWorkouts(selectedStudent !== "none" ? selectedStudent : null);
    } catch (error) {
      const message = error.response?.data?.detail || "Erro ao processar arquivo";
      toast.error(message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteWorkout = async (workoutId) => {
    try {
      await api.delete(`/workouts/${workoutId}`);
      toast.success("Treino removido");
      loadWorkouts(selectedStudent !== "none" ? selectedStudent : null);
      if (selectedWorkout?.id === workoutId) {
        setSelectedWorkout(null);
      }
    } catch (error) {
      toast.error("Erro ao remover treino");
    }
  };

  const getStudentName = (studentId) => {
    const student = students.find(s => s.id === studentId);
    return student?.name || "Sem aluno";
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in" data-testid="workouts-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase">
              Treinos
            </h1>
            <p className="text-muted-foreground mt-1">
              Faça upload de planilhas e gerencie treinos
            </p>
          </div>
        </div>

        {/* Upload Section */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-xl font-bold uppercase flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              Upload de Planilha
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Selecionar Aluno</Label>
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger className="bg-secondary/50 border-white/10" data-testid="select-student">
                    <SelectValue placeholder="Escolha um aluno (opcional)" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="none">Nenhum (apenas preview)</SelectItem>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Arquivo (.xls / .xlsx)</Label>
                <div className="flex gap-2">
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".xls,.xlsx"
                    onChange={handleFileUpload}
                    className="bg-secondary/50 border-white/10"
                    disabled={uploading}
                    data-testid="file-upload-input"
                  />
                </div>
              </div>
            </div>

            {uploading && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/10 border border-primary/30">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span>Processando arquivo...</span>
              </div>
            )}

            {/* Upload Preview */}
            {uploadedWorkout && (
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 animate-slide-up">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <span className="font-semibold">Treino processado com sucesso!</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Nome:</span>
                    <p className="font-semibold">{uploadedWorkout.name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Dias:</span>
                    <p className="font-semibold">{uploadedWorkout.days_count}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Exercícios:</span>
                    <p className="font-semibold">{uploadedWorkout.exercises_count}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Format Instructions */}
            <div className="p-4 rounded-lg bg-secondary/30 border border-border">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
                Formato da Planilha
              </h4>
              <p className="text-sm text-muted-foreground mb-2">
                A planilha deve conter as seguintes colunas:
              </p>
              <div className="flex flex-wrap gap-2">
                {["Dia", "Grupo Muscular", "Exercício", "Séries", "Repetições", "Carga", "Observações"].map((col) => (
                  <span key={col} className="px-2 py-1 rounded bg-secondary text-xs font-mono">
                    {col}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Workouts List */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-xl font-bold uppercase flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-primary" />
              Treinos Cadastrados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : workouts.length === 0 ? (
              <div className="text-center py-8">
                <Dumbbell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum treino cadastrado</p>
              </div>
            ) : (
              <div className="space-y-4">
                {workouts.map((workout, index) => (
                  <div
                    key={workout.id}
                    className="p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors animate-slide-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                    data-testid={`workout-item-${workout.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-primary/20">
                          <Dumbbell className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-bold">{workout.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {getStudentName(workout.student_id)} • {workout.days?.length || 0} dias • v{workout.version}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedWorkout(selectedWorkout?.id === workout.id ? null : workout)}
                          data-testid={`view-workout-${workout.id}`}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          {selectedWorkout?.id === workout.id ? "Fechar" : "Ver"}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteWorkout(workout.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          data-testid={`delete-workout-${workout.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Workout Details */}
                    {selectedWorkout?.id === workout.id && (
                      <div className="mt-4 pt-4 border-t border-border animate-slide-up">
                        <Tabs defaultValue={workout.days?.[0]?.day_name}>
                          <TabsList className="flex overflow-x-auto gap-1 bg-secondary/30 p-1 rounded-lg mb-4">
                            {workout.days?.map((day) => (
                              <TabsTrigger
                                key={day.day_name}
                                value={day.day_name}
                                className="flex-1 min-w-[80px] text-xs"
                              >
                                {day.day_name}
                              </TabsTrigger>
                            ))}
                          </TabsList>
                          {workout.days?.map((day, dayIdx) => (
                            <TabsContent key={day.day_name} value={day.day_name}>
                              <div className="space-y-2">
                                {day.exercises?.map((exercise, idx) => (
                                  <div 
                                    key={idx}
                                    className="flex items-center justify-between p-3 rounded bg-background/50 group"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="relative">
                                        {exercise.image_url ? (
                                          <img 
                                            src={exercise.image_url} 
                                            alt={exercise.name}
                                            className="w-10 h-10 rounded object-cover"
                                          />
                                        ) : (
                                          <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center">
                                            <ImageIcon className="w-4 h-4 text-muted-foreground" />
                                          </div>
                                        )}
                                        <button
                                          onClick={() => setImageUploadDialog({
                                            workoutId: workout.id,
                                            dayIndex: dayIdx,
                                            exerciseIndex: idx,
                                            exerciseName: exercise.name,
                                            currentImage: exercise.image_url
                                          })}
                                          className="absolute -bottom-1 -right-1 p-1 rounded-full bg-primary hover:bg-primary/80 opacity-0 group-hover:opacity-100 transition-opacity"
                                          data-testid={`edit-image-${dayIdx}-${idx}`}
                                        >
                                          <Camera className="w-3 h-3 text-white" />
                                        </button>
                                      </div>
                                      <div>
                                        <p className="font-medium">{exercise.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {exercise.muscle_group}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="text-right text-sm">
                                      <p className="font-semibold">
                                        {exercise.sets}x {exercise.reps}
                                      </p>
                                      {exercise.weight && (
                                        <p className="text-muted-foreground">{exercise.weight}</p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </TabsContent>
                          ))}
                        </Tabs>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Image Upload Dialog */}
        {imageUploadDialog && (
          <ExerciseImageUpload
            isOpen={!!imageUploadDialog}
            onClose={() => setImageUploadDialog(null)}
            workoutId={imageUploadDialog.workoutId}
            dayIndex={imageUploadDialog.dayIndex}
            exerciseIndex={imageUploadDialog.exerciseIndex}
            exerciseName={imageUploadDialog.exerciseName}
            currentImage={imageUploadDialog.currentImage}
            onImageUpdated={(newUrl) => {
              // Refresh workouts to show new image
              loadWorkouts(selectedStudent !== "none" ? selectedStudent : null);
            }}
          />
        )}
      </div>
    </MainLayout>
  );
}
