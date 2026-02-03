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
import { Dumbbell, Plus, Search, Trash2, Play, X } from "lucide-react";
import api from "../lib/api";
import { toast } from "sonner";

export default function ExerciseLibraryPage() {
  const [exercises, setExercises] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    instructions: "",
    video_url: "",
    image_url: ""
  });

  useEffect(() => {
    loadCategories();
    loadExercises();
  }, []);

  useEffect(() => {
    loadExercises();
  }, [selectedCategory, searchTerm]);

  const loadCategories = async () => {
    try {
      const response = await api.get("/exercise-library/categories");
      setCategories(response.data.categories);
    } catch (error) {
      console.error("Erro ao carregar categorias");
    }
  };

  const loadExercises = async () => {
    setLoading(true);
    try {
      let url = "/exercise-library";
      const params = [];
      if (selectedCategory) params.push(`category=${selectedCategory}`);
      if (searchTerm) params.push(`search=${searchTerm}`);
      if (params.length > 0) url += `?${params.join("&")}`;

      const response = await api.get(url);
      setExercises(response.data);
    } catch (error) {
      toast.error("Erro ao carregar exercícios");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.category) {
      toast.error("Nome e categoria são obrigatórios");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/exercise-library", formData);
      toast.success("Exercício adicionado com sucesso!");
      setIsAddDialogOpen(false);
      setFormData({
        name: "",
        category: "",
        description: "",
        instructions: "",
        video_url: "",
        image_url: ""
      });
      loadExercises();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao adicionar exercício");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Tem certeza que deseja excluir este exercício?")) return;
    try {
      await api.delete(`/exercise-library/${id}`);
      toast.success("Exercício removido");
      loadExercises();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao remover exercício");
    }
  };

  const clearFilters = () => {
    setSelectedCategory("");
    setSearchTerm("");
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase">
              Biblioteca de Exercícios
            </h1>
            <p className="text-muted-foreground mt-1">
              {exercises.length} exercício{exercises.length !== 1 ? 's' : ''} disponíve{exercises.length !== 1 ? 'is' : 'l'}
            </p>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                + Criar Exercício
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold uppercase">Novo Exercício</DialogTitle>
                <DialogDescription>
                  Adicione um exercício personalizado à biblioteca
                </DialogDescription>
              </DialogHeader>
              <DialogBody>
              <form id="exercise-form" onSubmit={handleSubmit} className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="bg-secondary/50 border-white/10"
                    placeholder="Ex: Supino Inclinado com Halteres"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Categoria *</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                    <SelectTrigger className="bg-secondary/50 border-white/10">
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="bg-secondary/50 border-white/10"
                    placeholder="Breve descrição do exercício"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Instruções</Label>
                  <Textarea
                    value={formData.instructions}
                    onChange={(e) => setFormData({...formData, instructions: e.target.value})}
                    className="bg-secondary/50 border-white/10"
                    placeholder="Passo a passo de execução"
                  />
                </div>
                <div className="space-y-2">
                  <Label>URL do Vídeo (YouTube)</Label>
                  <Input
                    value={formData.video_url}
                    onChange={(e) => setFormData({...formData, video_url: e.target.value})}
                    className="bg-secondary/50 border-white/10"
                    placeholder="https://www.youtube.com/embed/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>URL da Imagem</Label>
                  <Input
                    value={formData.image_url}
                    onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                    className="bg-secondary/50 border-white/10"
                    placeholder="https://..."
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      "Adicionar Exercício"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Badge
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/80 transition-colors"
                onClick={() => setSelectedCategory(selectedCategory === cat ? "" : cat)}
              >
                {cat}
              </Badge>
            ))}
          </div>

          <div className="flex gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar exercício..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-secondary/50 border-white/10"
              />
            </div>
            {(selectedCategory || searchTerm) && (
              <Button variant="outline" onClick={clearFilters} className="gap-2">
                <X className="w-4 h-4" />
                Limpar filtros
              </Button>
            )}
          </div>
        </div>

        {/* Exercises Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : exercises.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Dumbbell className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-lg font-semibold mb-2">Nenhum exercício encontrado</p>
              <p className="text-muted-foreground text-center">Tente ajustar os filtros ou adicione um novo exercício</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {exercises.map((exercise, index) => (
              <Card 
                key={exercise.id} 
                className="bg-card border-border hover:border-primary/50 transition-colors animate-slide-up overflow-hidden"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                {exercise.image_url && (
                  <div className="aspect-video bg-secondary/30 relative">
                    <img 
                      src={exercise.image_url} 
                      alt={exercise.name}
                      className="w-full h-full object-cover"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                    {exercise.video_url && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
                        <Play className="w-12 h-12 text-white" />
                      </div>
                    )}
                  </div>
                )}
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-sm line-clamp-2">{exercise.name}</h3>
                      <Badge variant="outline" className="mt-2 text-xs">{exercise.category}</Badge>
                    </div>
                    {exercise.personal_id && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(exercise.id)}>
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    )}
                  </div>
                  {exercise.description && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{exercise.description}</p>
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
