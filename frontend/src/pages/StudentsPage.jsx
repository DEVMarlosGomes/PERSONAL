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
} from "../components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { Users, Plus, Search, Mail, Phone, Edit, Trash2, Dumbbell, MoreVertical, FileText } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import api from "../lib/api";
import { toast } from "sonner";
import { generateStudentReport } from "../utils/pdfGenerator";

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteStudent, setDeleteStudent] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    notes: ""
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const response = await api.get("/students");
      setStudents(response.data);
    } catch (error) {
      toast.error("Erro ao carregar alunos");
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/students", formData);
      toast.success("Aluno cadastrado com sucesso!");
      setIsAddDialogOpen(false);
      setFormData({ name: "", email: "", password: "", phone: "", notes: "" });
      loadStudents();
    } catch (error) {
      const message = error.response?.data?.detail || "Erro ao cadastrar aluno";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditStudent = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;

    setSubmitting(true);
    try {
      await api.put(`/students/${selectedStudent.id}`, {
        name: formData.name,
        phone: formData.phone,
        notes: formData.notes
      });
      toast.success("Aluno atualizado com sucesso!");
      setIsEditDialogOpen(false);
      setSelectedStudent(null);
      loadStudents();
    } catch (error) {
      toast.error("Erro ao atualizar aluno");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (!deleteStudent) return;

    try {
      await api.delete(`/students/${deleteStudent.id}`);
      toast.success("Aluno removido com sucesso");
      setDeleteStudent(null);
      loadStudents();
    } catch (error) {
      toast.error("Erro ao remover aluno");
    }
  };

  const openEditDialog = (student) => {
    setSelectedStudent(student);
    setFormData({
      name: student.name,
      email: student.email,
      password: "",
      phone: student.phone || "",
      notes: student.notes || ""
    });
    setIsEditDialogOpen(true);
  };

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in" data-testid="students-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase">
              Meus Alunos
            </h1>
            <p className="text-muted-foreground mt-1">
              {students.length} aluno{students.length !== 1 ? 's' : ''} cadastrado{students.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" data-testid="add-student-btn">
                <Plus className="w-4 h-4" />
                Novo Aluno
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold uppercase">Cadastrar Aluno</DialogTitle>
                <DialogDescription>
                  Preencha os dados do novo aluno
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddStudent} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="add-name">Nome *</Label>
                  <Input
                    id="add-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nome completo"
                    className="bg-secondary/50 border-white/10"
                    data-testid="add-student-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-email">Email *</Label>
                  <Input
                    id="add-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@exemplo.com"
                    className="bg-secondary/50 border-white/10"
                    data-testid="add-student-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-password">Senha *</Label>
                  <Input
                    id="add-password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Senha de acesso"
                    className="bg-secondary/50 border-white/10"
                    data-testid="add-student-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-phone">Telefone</Label>
                  <Input
                    id="add-phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(00) 00000-0000"
                    className="bg-secondary/50 border-white/10"
                    data-testid="add-student-phone"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-notes">Observações</Label>
                  <Textarea
                    id="add-notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Informações adicionais sobre o aluno"
                    className="bg-secondary/50 border-white/10"
                    data-testid="add-student-notes"
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={submitting} data-testid="submit-add-student">
                    {submitting ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      "Cadastrar"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar aluno..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-secondary/50 border-white/10"
            data-testid="search-students"
          />
        </div>

        {/* Students List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredStudents.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-lg font-semibold mb-2">
                {searchTerm ? "Nenhum aluno encontrado" : "Nenhum aluno cadastrado"}
              </p>
              <p className="text-muted-foreground text-center max-w-md">
                {searchTerm 
                  ? "Tente buscar por outro nome ou email"
                  : "Comece cadastrando seu primeiro aluno para gerenciar treinos"
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudents.map((student, index) => (
              <Card 
                key={student.id} 
                className="bg-card border-border hover:border-primary/50 transition-colors card-hover animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
                data-testid={`student-card-${student.id}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-primary font-bold text-lg">
                          {student.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{student.name}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {student.email}
                        </p>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-card border-border">
                        <DropdownMenuItem onClick={() => openEditDialog(student)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setDeleteStudent(student)}
                          className="text-red-400 focus:text-red-400"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remover
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {student.phone && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
                      <Phone className="w-4 h-4" />
                      {student.phone}
                    </p>
                  )}

                  {student.notes && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {student.notes}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <span className="text-xs text-muted-foreground">
                      Desde {new Date(student.created_at).toLocaleDateString('pt-BR')}
                    </span>
                    <Button variant="outline" size="sm" className="gap-1" asChild>
                      <a href={`/treinos?student=${student.id}`}>
                        <Dumbbell className="w-4 h-4" />
                        Treino
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold uppercase">Editar Aluno</DialogTitle>
              <DialogDescription>
                Atualize os dados do aluno
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditStudent} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-secondary/50 border-white/10"
                  data-testid="edit-student-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Telefone</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="bg-secondary/50 border-white/10"
                  data-testid="edit-student-phone"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-notes">Observações</Label>
                <Textarea
                  id="edit-notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="bg-secondary/50 border-white/10"
                  data-testid="edit-student-notes"
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={submitting} data-testid="submit-edit-student">
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "Salvar"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteStudent} onOpenChange={() => setDeleteStudent(null)}>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle>Remover Aluno</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja remover <strong>{deleteStudent?.name}</strong>? 
                Esta ação não pode ser desfeita e todos os treinos e progressos serão apagados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteStudent}
                className="bg-red-600 hover:bg-red-700"
                data-testid="confirm-delete-student"
              >
                Remover
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
