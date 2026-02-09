import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { MainLayout } from "../components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Camera, Trash2 } from "lucide-react";
import api from "../lib/api";
import { toast } from "sonner";

export default function EvolutionPhotosPage() {
  const { user } = useAuth();
  const isPersonal = user?.role === "personal";
  const backendUrl = process.env.REACT_APP_BACKEND_URL || "";

  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isPersonal) {
      loadStudents();
    } else if (user?.id) {
      setSelectedStudent(user.id);
    }
  }, [isPersonal, user]);

  useEffect(() => {
    if (selectedStudent) {
      loadPhotos();
    }
  }, [selectedStudent]);

  const loadStudents = async () => {
    try {
      const response = await api.get("/students");
      setStudents(response.data);
      if (response.data.length > 0) {
        setSelectedStudent(response.data[0].id);
      }
    } catch (error) {
      toast.error("Erro ao carregar alunos");
    }
  };

  const loadPhotos = async () => {
    try {
      const response = await api.get(`/evolution-photos/${selectedStudent}`);
      setPhotos(response.data);
    } catch (error) {
      toast.error("Erro ao carregar fotos");
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast.error("Selecione uma imagem");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("student_id", selectedStudent);
      formData.append("date", date);
      formData.append("notes", notes || "");
      formData.append("file", file);

      await api.post("/evolution-photos", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success("Foto enviada com sucesso!");
      setNotes("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      loadPhotos();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao enviar foto");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (photoId) => {
    if (!confirm("Deseja remover esta foto?")) return;
    try {
      await api.delete(`/evolution-photos/${photoId}`);
      toast.success("Foto removida");
      loadPhotos();
    } catch (error) {
      toast.error("Erro ao remover foto");
    }
  };

  const resolvePhotoUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `${backendUrl}${url}`;
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase">
              Fotos de Evolução
            </h1>
            <p className="text-muted-foreground mt-1">
              Acompanhe a evolução visual dos alunos
            </p>
          </div>

          {isPersonal && (
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger className="w-[220px] bg-secondary/50 border-white/10">
                <SelectValue placeholder="Selecione o aluno" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Upload */}
        {isPersonal && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-xl font-bold uppercase flex items-center gap-2">
                <Camera className="w-5 h-5 text-primary" />
                Enviar Foto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpload} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="bg-secondary/50 border-white/10"
                  />
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="bg-secondary/50 border-white/10"
                  />
                  <Button type="submit" disabled={uploading} className="gap-2">
                    {uploading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      "Enviar"
                    )}
                  </Button>
                </div>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observações (opcional)"
                  className="bg-secondary/50 border-white/10"
                />
              </form>
            </CardContent>
          </Card>
        )}

        {/* Photos */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-xl font-bold uppercase">Histórico</CardTitle>
          </CardHeader>
          <CardContent>
            {photos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma foto registrada.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {photos.map((photo) => (
                  <div key={photo.id} className="rounded-lg overflow-hidden bg-secondary/30 border border-border">
                    <img
                      src={resolvePhotoUrl(photo.photo_url)}
                      alt="Evolução"
                      className="w-full h-56 object-cover"
                    />
                    <div className="p-3 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">
                          {new Date(photo.date).toLocaleDateString("pt-BR")}
                        </p>
                        {photo.notes && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{photo.notes}</p>
                        )}
                      </div>
                      {isPersonal && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(photo.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </Button>
                      )}
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
