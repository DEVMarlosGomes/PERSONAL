import { useState, useEffect } from "react";
import { MainLayout } from "../components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { ClipboardList, Plus, Trash2, Scale, Ruler, Activity, TrendingUp, TrendingDown, Minus } from "lucide-react";
import api from "../lib/api";
import { toast } from "sonner";

export default function AssessmentsPage() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [assessments, setAssessments] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    assessment_type: "manual",
    date: new Date().toISOString().split("T")[0],
    weight: "",
    height: "",
    body_fat_percentage: "",
    muscle_mass: "",
    chest: "",
    waist: "",
    hip: "",
    arm_right: "",
    arm_left: "",
    thigh_right: "",
    thigh_left: "",
    calf_right: "",
    calf_left: "",
    fold_chest: "",
    fold_abdominal: "",
    fold_thigh: "",
    fold_triceps: "",
    fold_subscapular: "",
    fold_suprailiac: "",
    fold_midaxillary: "",
    notes: ""
  });

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      loadAssessments();
      loadComparison();
    }
  }, [selectedStudent]);

  const loadStudents = async () => {
    try {
      const response = await api.get("/students");
      setStudents(response.data);
    } catch (error) {
      toast.error("Erro ao carregar alunos");
    }
  };

  const loadAssessments = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/assessments?student_id=${selectedStudent}`);
      setAssessments(response.data);
    } catch (error) {
      toast.error("Erro ao carregar avaliações");
    } finally {
      setLoading(false);
    }
  };

  const loadComparison = async () => {
    try {
      const response = await api.get(`/assessments/compare/${selectedStudent}`);
      setComparison(response.data);
    } catch (error) {
      console.error("Erro ao carregar comparação");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent) {
      toast.error("Selecione um aluno");
      return;
    }

    setSubmitting(true);
    try {
      const data = {
        student_id: selectedStudent,
        ...formData,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        height: formData.height ? parseFloat(formData.height) : null,
        body_fat_percentage: formData.body_fat_percentage ? parseFloat(formData.body_fat_percentage) : null,
        muscle_mass: formData.muscle_mass ? parseFloat(formData.muscle_mass) : null,
        chest: formData.chest ? parseFloat(formData.chest) : null,
        waist: formData.waist ? parseFloat(formData.waist) : null,
        hip: formData.hip ? parseFloat(formData.hip) : null,
        arm_right: formData.arm_right ? parseFloat(formData.arm_right) : null,
        arm_left: formData.arm_left ? parseFloat(formData.arm_left) : null,
        thigh_right: formData.thigh_right ? parseFloat(formData.thigh_right) : null,
        thigh_left: formData.thigh_left ? parseFloat(formData.thigh_left) : null,
        calf_right: formData.calf_right ? parseFloat(formData.calf_right) : null,
        calf_left: formData.calf_left ? parseFloat(formData.calf_left) : null,
        fold_chest: formData.fold_chest ? parseFloat(formData.fold_chest) : null,
        fold_abdominal: formData.fold_abdominal ? parseFloat(formData.fold_abdominal) : null,
        fold_thigh: formData.fold_thigh ? parseFloat(formData.fold_thigh) : null,
        fold_triceps: formData.fold_triceps ? parseFloat(formData.fold_triceps) : null,
        fold_subscapular: formData.fold_subscapular ? parseFloat(formData.fold_subscapular) : null,
        fold_suprailiac: formData.fold_suprailiac ? parseFloat(formData.fold_suprailiac) : null,
        fold_midaxillary: formData.fold_midaxillary ? parseFloat(formData.fold_midaxillary) : null,
      };

      await api.post("/assessments", data);
      toast.success("Avaliação registrada com sucesso!");
      setIsAddDialogOpen(false);
      resetForm();
      loadAssessments();
      loadComparison();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao registrar avaliação");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Tem certeza que deseja excluir esta avaliação?")) return;
    try {
      await api.delete(`/assessments/${id}`);
      toast.success("Avaliação removida");
      loadAssessments();
      loadComparison();
    } catch (error) {
      toast.error("Erro ao remover avaliação");
    }
  };

  const resetForm = () => {
    setFormData({
      assessment_type: "manual",
      date: new Date().toISOString().split("T")[0],
      weight: "",
      height: "",
      body_fat_percentage: "",
      muscle_mass: "",
      chest: "",
      waist: "",
      hip: "",
      arm_right: "",
      arm_left: "",
      thigh_right: "",
      thigh_left: "",
      calf_right: "",
      calf_left: "",
      fold_chest: "",
      fold_abdominal: "",
      fold_thigh: "",
      fold_triceps: "",
      fold_subscapular: "",
      fold_suprailiac: "",
      fold_midaxillary: "",
      notes: ""
    });
  };

  const renderChangeIcon = (change) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase">
              Avaliações Físicas
            </h1>
            <p className="text-muted-foreground mt-1">
              Registre e acompanhe a evolução dos seus alunos
            </p>
          </div>

          <div className="flex gap-3">
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger className="w-[200px] bg-secondary/50 border-white/10">
                <SelectValue placeholder="Selecione o aluno" />
              </SelectTrigger>
              <SelectContent>
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2" disabled={!selectedStudent}>
                  <Plus className="w-4 h-4" />
                  + Avaliação
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border max-w-3xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold uppercase">Nova Avaliação</DialogTitle>
                  <DialogDescription>
                    Registre os dados da avaliação física
                  </DialogDescription>
                </DialogHeader>
                <DialogBody>
                <form id="assessment-form" onSubmit={handleSubmit} className="space-y-6 py-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo de Avaliação</Label>
                      <Select value={formData.assessment_type} onValueChange={(v) => setFormData({...formData, assessment_type: v})}>
                        <SelectTrigger className="bg-secondary/50 border-white/10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manual">Inserção Manual</SelectItem>
                          <SelectItem value="bioimpedance">Bioimpedância</SelectItem>
                          <SelectItem value="pollock_7">Pollock 7 Dobras</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Data</Label>
                      <Input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                        className="bg-secondary/50 border-white/10"
                      />
                    </div>
                  </div>

                  <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="basic">Básico</TabsTrigger>
                      <TabsTrigger value="measures">Medidas</TabsTrigger>
                      <TabsTrigger value="folds">Dobras Cutâneas</TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic" className="space-y-4 mt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Peso (kg)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={formData.weight}
                            onChange={(e) => setFormData({...formData, weight: e.target.value})}
                            className="bg-secondary/50 border-white/10"
                            placeholder="Ex: 75.5"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Altura (cm)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={formData.height}
                            onChange={(e) => setFormData({...formData, height: e.target.value})}
                            className="bg-secondary/50 border-white/10"
                            placeholder="Ex: 175"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>% Gordura</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={formData.body_fat_percentage}
                            onChange={(e) => setFormData({...formData, body_fat_percentage: e.target.value})}
                            className="bg-secondary/50 border-white/10"
                            placeholder="Ex: 18.5"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Massa Muscular (kg)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={formData.muscle_mass}
                            onChange={(e) => setFormData({...formData, muscle_mass: e.target.value})}
                            className="bg-secondary/50 border-white/10"
                            placeholder="Ex: 35.2"
                          />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="measures" className="space-y-4 mt-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Peito (cm)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={formData.chest}
                            onChange={(e) => setFormData({...formData, chest: e.target.value})}
                            className="bg-secondary/50 border-white/10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Cintura (cm)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={formData.waist}
                            onChange={(e) => setFormData({...formData, waist: e.target.value})}
                            className="bg-secondary/50 border-white/10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Quadril (cm)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={formData.hip}
                            onChange={(e) => setFormData({...formData, hip: e.target.value})}
                            className="bg-secondary/50 border-white/10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Braço Direito (cm)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={formData.arm_right}
                            onChange={(e) => setFormData({...formData, arm_right: e.target.value})}
                            className="bg-secondary/50 border-white/10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Braço Esquerdo (cm)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={formData.arm_left}
                            onChange={(e) => setFormData({...formData, arm_left: e.target.value})}
                            className="bg-secondary/50 border-white/10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Coxa Direita (cm)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={formData.thigh_right}
                            onChange={(e) => setFormData({...formData, thigh_right: e.target.value})}
                            className="bg-secondary/50 border-white/10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Coxa Esquerda (cm)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={formData.thigh_left}
                            onChange={(e) => setFormData({...formData, thigh_left: e.target.value})}
                            className="bg-secondary/50 border-white/10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Panturrilha Dir. (cm)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={formData.calf_right}
                            onChange={(e) => setFormData({...formData, calf_right: e.target.value})}
                            className="bg-secondary/50 border-white/10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Panturrilha Esq. (cm)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={formData.calf_left}
                            onChange={(e) => setFormData({...formData, calf_left: e.target.value})}
                            className="bg-secondary/50 border-white/10"
                          />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="folds" className="space-y-4 mt-4">
                      <p className="text-sm text-muted-foreground">Protocolo Pollock 7 Dobras (mm)</p>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Peitoral</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={formData.fold_chest}
                            onChange={(e) => setFormData({...formData, fold_chest: e.target.value})}
                            className="bg-secondary/50 border-white/10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Abdominal</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={formData.fold_abdominal}
                            onChange={(e) => setFormData({...formData, fold_abdominal: e.target.value})}
                            className="bg-secondary/50 border-white/10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Coxa</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={formData.fold_thigh}
                            onChange={(e) => setFormData({...formData, fold_thigh: e.target.value})}
                            className="bg-secondary/50 border-white/10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Tríceps</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={formData.fold_triceps}
                            onChange={(e) => setFormData({...formData, fold_triceps: e.target.value})}
                            className="bg-secondary/50 border-white/10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Subescapular</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={formData.fold_subscapular}
                            onChange={(e) => setFormData({...formData, fold_subscapular: e.target.value})}
                            className="bg-secondary/50 border-white/10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Suprailíaca</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={formData.fold_suprailiac}
                            onChange={(e) => setFormData({...formData, fold_suprailiac: e.target.value})}
                            className="bg-secondary/50 border-white/10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Axilar Média</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={formData.fold_midaxillary}
                            onChange={(e) => setFormData({...formData, fold_midaxillary: e.target.value})}
                            className="bg-secondary/50 border-white/10"
                          />
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>

                  <div className="space-y-2">
                    <Label>Observações</Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      className="bg-secondary/50 border-white/10"
                      placeholder="Anotações sobre a avaliação..."
                    />
                  </div>
                </form>
                </DialogBody>
                <DialogFooter>
                  <Button type="submit" form="assessment-form" disabled={submitting}>
                    {submitting ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      "Salvar Avaliação"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Comparison Card */}
        {comparison && comparison.changes && Object.keys(comparison.changes).length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Comparar Avaliações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(comparison.changes).map(([key, value]) => (
                  <div key={key} className="p-4 rounded-lg bg-secondary/30">
                    <p className="text-sm text-muted-foreground capitalize">{key.replace(/_/g, " ")}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xl font-bold">{value.current}</span>
                      {renderChangeIcon(value.change)}
                      <span className={`text-sm ${value.change > 0 ? 'text-green-500' : value.change < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                        {value.change > 0 ? '+' : ''}{value.change}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Assessments List */}
        {!selectedStudent ? (
          <Card className="bg-card border-border">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ClipboardList className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-lg font-semibold mb-2">Selecione um aluno</p>
              <p className="text-muted-foreground text-center">Escolha um aluno para ver suas avaliações físicas</p>
            </CardContent>
          </Card>
        ) : loading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : assessments.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ClipboardList className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-lg font-semibold mb-2">Nenhuma avaliação registrada</p>
              <p className="text-muted-foreground text-center">Clique em "+ Avaliação" para registrar a primeira avaliação</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assessments.map((assessment, index) => (
              <Card 
                key={assessment.id} 
                className="bg-card border-border hover:border-primary/50 transition-colors animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {new Date(assessment.date).toLocaleDateString('pt-BR')}
                    </CardTitle>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(assessment.id)}>
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground capitalize">
                    {assessment.assessment_type.replace("_", " ")}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {assessment.weight && (
                      <div className="flex items-center gap-2">
                        <Scale className="w-4 h-4 text-primary" />
                        <span className="text-sm">{assessment.weight} kg</span>
                      </div>
                    )}
                    {assessment.height && (
                      <div className="flex items-center gap-2">
                        <Ruler className="w-4 h-4 text-primary" />
                        <span className="text-sm">{assessment.height} cm</span>
                      </div>
                    )}
                    {assessment.body_fat_percentage && (
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-primary" />
                        <span className="text-sm">{assessment.body_fat_percentage}% gordura</span>
                      </div>
                    )}
                    {assessment.bmi && (
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-primary" />
                        <span className="text-sm">IMC: {assessment.bmi}</span>
                      </div>
                    )}
                  </div>
                  {assessment.notes && (
                    <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{assessment.notes}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
