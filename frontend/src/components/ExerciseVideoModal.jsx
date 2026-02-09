import { useState } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from "./ui/dialog";
import { Play, X, ExternalLink } from "lucide-react";

export const ExerciseVideoModal = ({ isOpen, onClose, exerciseName, videoUrl }) => {
  // Convert YouTube URL to embed format
  const getEmbedUrl = (url) => {
    if (!url) return null;
    
    // Already an embed URL
    if (url.includes("/embed/")) return url;
    
    // Standard YouTube URL
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
    
    return url;
  };

  const embedUrl = getEmbedUrl(videoUrl);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-3xl p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="text-lg font-bold uppercase flex items-center justify-between">
            <span>{exerciseName}</span>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        <DialogBody className="p-0">
          <div className="aspect-video w-full">
            {embedUrl ? (
              <iframe
                src={embedUrl}
                title={exerciseName}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-secondary/50 text-muted-foreground">
                <Play className="w-16 h-16 mb-4" />
                <p>Vídeo não disponível</p>
              </div>
            )}
          </div>

          {videoUrl && !embedUrl?.includes("youtube") && (
            <div className="p-4 pt-0">
              <a 
                href={videoUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-primary flex items-center gap-1 hover:underline"
              >
                <ExternalLink className="w-4 h-4" />
                Abrir em nova aba
              </a>
            </div>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
};
