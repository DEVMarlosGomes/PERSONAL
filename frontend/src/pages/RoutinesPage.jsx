import { useState, useEffect } from "react";
import { MainLayout } from "../components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Switch } from "../components/ui/switch";
import { Calendar, Plus, MoreVertical, Archive, Copy, Trash2, Dumbbell, Edit, FolderOpen, Eye } from "lucide-react";
import api from "../lib/api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function RoutinesPage() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [routines, setRoutines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isCloneDialogOpen, setIsCloneDialogOpen] = useState(false);
  const [selectedRoutine, setSelectedRoutine] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
    objective: "",
    level: "",
    day_type: "Por Dia da Semana",
    auto_archive: true,
    notes: ""
  });
  const [cloneTargetStudent, setCloneTargetStudent] = useState("");

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      loadRoutines();
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

  const loadRoutines = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/routines?student_id=${selectedStudent}`);
      setRoutines(response.data);
    } catch (error) {
      toast.error("Erro ao carregar rotinas");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent || !formData.name || !formData.start_date) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/routines", {
        student_id: selectedStudent,
        ...formData
      });
      toast.success("Rotina criada com sucesso!");
      setIsAddDialogOpen(false);
      resetForm();
      loadRoutines();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao criar rotina");
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchive = async (routineId) => {
    try {
      await api.put(`/routines/${routineId}`, { status: "archived" });
      toast.success("Rotina arquivada");
      loadRoutines();
    } catch (error) {
      toast.error("Erro ao arquivar rotina");
    }
  };

  const handleClone = async () => {
    if (!selectedRoutine || !cloneTargetStudent) {
      toast.error("Selecione o aluno destino");
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/routines/${selectedRoutine.id}/clone?student_id=${cloneTargetStudent}`);
      toast.success("Rotina clonada com sucesso!");
      setIsCloneDialogOpen(false);
      setSelectedRoutine(null);
      setCloneTargetStudent("");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao clonar rotina");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (routineId) => {
    if (!confirm("Tem certeza que deseja excluir esta rotina e todos os treinos associados?")) return;
    try {
      await api.delete(`/routines/${routineId}`);
      toast.success("Rotina removida");
      loadRoutines();
    } catch (error) {
      toast.error("Erro ao remover rotina");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      start_date: new Date().toISOString().split("T")[0],
      end_date: "",
      objective: "",
      level: "",
      day_type: "Por Dia da Semana",
      auto_archive: true,
      notes: ""
    });
  };

  const openCloneDialog = (routine) => {
    setSelectedRoutine(routine);
    setIsCloneDialogOpen(true);
  };

  const getStudentName = (studentId) => {
    const student = students.find(s => s.id === studentId);
    return student?.name || "";
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase">
              Rotinas de Treino
            </h1>
            <p className="text-muted-foreground mt-1">
              Organize treinos por períodos e objetivos
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
                  + Treino
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold uppercase">Nova Rotina de Treino</DialogTitle>
                  <DialogDescription>
                    Crie uma nova rotina para {getStudentName(selectedStudent)}
                  </DialogDescription>
                </DialogHeader>
                <DialogBody>
                <form id="routine-form" onSubmit={handleSubmit} className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>Nome da Rotina *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="bg-secondary/50 border-white/10"
                      placeholder="Ex: Semana 1, Rotina A, Mesociclo 1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Data Início *</Label>
                      <Input
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                        className="bg-secondary/50 border-white/10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Data Fim</Label>
                      <Input
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                        className="bg-secondary/50 border-white/10"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Objetivo</Label>
                      <Select value={formData.objective} onValueChange={(v) => setFormData({...formData, objective: v})}>
                        <SelectTrigger className="bg-secondary/50 border-white/10">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Hipertrofia">Hipertrofia</SelectItem>
                          <SelectItem value="Emagrecimento">Emagrecimento</SelectItem>
                          <SelectItem value="Condicionamento">Condicionamento</SelectItem>
                          <SelectItem value="Força">Força</SelectItem>
                          <SelectItem value="Resistência">Resistência</SelectItem>
                          <SelectItem value="Reabilitação">Reabilitação</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Nível</Label>
                      <Select value={formData.level} onValueChange={(v) => setFormData({...formData, level: v})}>
                        <SelectTrigger className="bg-secondary/50 border-white/10">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Iniciante">Iniciante</SelectItem>
                          <SelectItem value="Intermediário">Intermediário</SelectItem>
                          <SelectItem value="Avançado">Avançado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo do Dia</Label>
                    <Select value={formData.day_type} onValueChange={(v) => setFormData({...formData, day_type: v})}>
                      <SelectTrigger className="bg-secondary/50 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Por Dia da Semana">Por Dia da Semana</SelectItem>
                        <SelectItem value="Por Letra">Por Letra (A, B, C...)</SelectItem>
                        <SelectItem value="Numérico">Numérico (Dia 1, 2, 3...)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Arquivar automaticamente</Label>
                      <p className="text-xs text-muted-foreground">Arquiva ao atingir data final</p>
                    </div>
                    <Switch
                      checked={formData.auto_archive}
                      onCheckedChange={(v) => setFormData({...formData, auto_archive: v})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Observações</Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      className="bg-secondary/50 border-white/10"
                      placeholder="Informações adicionais sobre a rotina..."
                    />
                  </div>
                </form>
                </DialogBody>
                <DialogFooter>
                  <Button type="submit" form="routine-form" disabled={submitting}>
                    {submitting ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      "Criar Rotina"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Routines List */}
        {!selectedStudent ? (
          <Card className="bg-card border-border">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FolderOpen className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-lg font-semibold mb-2">Selecione um aluno</p>
              <p className="text-muted-foreground text-center">Escolha um aluno para ver suas rotinas de treino</p>
            </CardContent>
          </Card>
        ) : loading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : routines.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FolderOpen className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-lg font-semibold mb-2">Nenhuma rotina criada</p>
              <p className="text-muted-foreground text-center">Clique em "+ Treino" para criar a primeira rotina</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Rotinas de Treino Section */}
            <div className="space-y-2">
              <h2 className="text-lg font-bold">Rotinas de Treino</h2>
              <div className="grid grid-cols-1 gap-3">
                {routines.filter(r => r.status === "active").map((routine, index) => (
                  <Card 
                    key={routine.id} 
                    className="bg-card border-border hover:border-primary/50 transition-colors animate-slide-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-black">{routine.name}</h3>
                            {routine.objective && (
                              <Badge variant="outline">{routine.objective}</Badge>
                            )}
                            {routine.level && (
                              <Badge variant="secondary">{routine.level}</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              Duração: {new Date(routine.start_date).toLocaleDateString('pt-BR')}
                              {routine.end_date && ` - ${new Date(routine.end_date).toLocaleDateString('pt-BR')}`}
                            </span>
                            <span>Tipo do dia: {routine.day_type || 'Padrão'}</span>
                            <span>Arquivar automaticamente: {routine.auto_archive ? 'Sim' : 'Não'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => navigate(`/treinos?routine=${routine.id}&student=${selectedStudent}`)}>
                            <Eye className="w-4 h-4 mr-1" />
                            Abrir
                          </Button>
                          <Button variant="outline" size="sm" className="text-primary" onClick={() => navigate(`/treinos?routine=${routine.id}&student=${selectedStudent}`)}>
                            <Dumbbell className="w-4 h-4 mr-1" />
                            Enviar
                          </Button>
                          <Button variant="outline" size="sm" className="text-yellow-400" onClick={() => openCloneDialog(routine)}>
                            <Copy className="w-4 h-4 mr-1" />
                            Clonar
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleArchive(routine.id)}>
                            <Archive className="w-4 h-4 mr-1" />
                            Arquivar
                          </Button>
                          <Button variant="ghost" size="icon" className="text-red-400" onClick={() => handleDelete(routine.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Archived Section */}
            {routines.filter(r => r.status === "archived").length > 0 && (
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-muted-foreground">Arquivadas</h2>
                <div className="grid grid-cols-1 gap-3">
                  {routines.filter(r => r.status === "archived").map((routine) => (
                    <Card key={routine.id} className="bg-card/50 border-border">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-bold text-muted-foreground">{routine.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {new Date(routine.start_date).toLocaleDateString('pt-BR')}
                              {routine.end_date && ` - ${new Date(routine.end_date).toLocaleDateString('pt-BR')}`}
                            </p>
                          </div>
                          <Button variant="ghost" size="icon" className="text-red-400" onClick={() => handleDelete(routine.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Clone Dialog */}
        <Dialog open={isCloneDialogOpen} onOpenChange={setIsCloneDialogOpen}>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold uppercase">Clonar Rotina</DialogTitle>
              <DialogDescription>
                Clone "{selectedRoutine?.name}" para outro aluno
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Aluno Destino</Label>
                <Select value={cloneTargetStudent} onValueChange={setCloneTargetStudent}>
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
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCloneDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleClone} disabled={submitting}>
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Clonar"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
