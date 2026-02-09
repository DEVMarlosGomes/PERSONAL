import { useState, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogBody,
} from "./ui/dialog";
import { Upload, Image as ImageIcon, X, Check } from "lucide-react";
import api from "../lib/api";
import { toast } from "sonner";

export const ExerciseImageUpload = ({ 
  isOpen, 
  onClose, 
  workoutId, 
  dayIndex, 
  exerciseIndex, 
  exerciseName,
  currentImage,
  onImageUpdated 
}) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentImage || "");
  const [urlInput, setUrlInput] = useState("");
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Apenas imagens são aceitas");
      return;
    }

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("day_index", dayIndex.toString());
    formData.append("exercise_index", exerciseIndex.toString());

    try {
      const response = await api.post(`/workouts/${workoutId}/upload-image`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success("Imagem enviada com sucesso!");
      onImageUpdated(response.data.image_url);
      onClose();
    } catch (error) {
      toast.error("Erro ao enviar imagem");
      setPreviewUrl(currentImage || "");
    } finally {
      setUploading(false);
    }
  };

  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) {
      toast.error("Digite uma URL válida");
      return;
    }

    setUploading(true);
    try {
      await api.put(`/workouts/${workoutId}/exercise-image`, {
        workout_id: workoutId,
        day_index: dayIndex,
        exercise_index: exerciseIndex,
        image_url: urlInput.trim()
      });
      toast.success("Imagem atualizada!");
      onImageUpdated(urlInput.trim());
      onClose();
    } catch (error) {
      toast.error("Erro ao atualizar imagem");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold uppercase">
            Imagem do Exercício
          </DialogTitle>
          <DialogDescription>
            Adicione uma imagem para: <strong>{exerciseName}</strong>
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
        <div className="space-y-4">
          {/* Preview */}
          <div className="relative aspect-video rounded-lg overflow-hidden bg-secondary/50 border border-border">
            {previewUrl ? (
              <img 
                src={previewUrl} 
                alt={exerciseName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                <ImageIcon className="w-12 h-12 mb-2" />
                <span className="text-sm">Nenhuma imagem</span>
              </div>
            )}
          </div>

          {/* Upload Button */}
          <div className="space-y-2">
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              data-testid="upload-image-btn"
            >
              <Upload className="w-4 h-4" />
              {uploading ? "Enviando..." : "Fazer Upload"}
            </Button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">ou</span>
            </div>
          </div>

          {/* URL Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Cole a URL da imagem"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="bg-secondary/50 border-white/10"
              data-testid="image-url-input"
            />
            <Button
              size="icon"
              onClick={handleUrlSubmit}
              disabled={uploading || !urlInput.trim()}
              data-testid="submit-url-btn"
            >
              <Check className="w-4 h-4" />
            </Button>
          </div>
        </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
