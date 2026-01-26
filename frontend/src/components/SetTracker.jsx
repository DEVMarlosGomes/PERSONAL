import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { 
  X, 
  Play, 
  CheckCircle2, 
  Plus, 
  Minus,
  Dumbbell,
  Clock,
  Target
} from "lucide-react";
import api from "../lib/api";
import { toast } from "sonner";

export const SetTracker = ({ exercise, workoutId, onClose, onProgressLogged }) => {
  const [sets, setSets] = useState([]);
  const [saving, setSaving] = useState(false);
  const [previousData, setPreviousData] = useState(null);

  const defaultImage = "https://images.unsplash.com/photo-1700784795176-7ff886439d79?crop=entropy&cs=srgb&fm=jpg&q=85&w=600";

  useEffect(() => {
    // Initialize sets based on exercise configuration
    const numSets = exercise.sets || 4;
    const initialSets = Array.from({ length: numSets }, (_, i) => ({
      set: i + 1,
      weight: "",
      reps: "",
      completed: false
    }));
    setSets(initialSets);

    // Load previous progress
    loadPreviousProgress();
  }, [exercise]);

  const loadPreviousProgress = async () => {
    try {
      const response = await api.get(`/progress?exercise_name=${encodeURIComponent(exercise.name)}`);
      if (response.data.length > 0) {
        setPreviousData(response.data[0]);
      }
    } catch (error) {
      console.error("Error loading previous progress:", error);
    }
  };

  const updateSet = (index, field, value) => {
    setSets(prev => prev.map((set, i) => 
      i === index ? { ...set, [field]: value } : set
    ));
  };

  const toggleSetComplete = (index) => {
    setSets(prev => prev.map((set, i) => 
      i === index ? { ...set, completed: !set.completed } : set
    ));
  };

  const incrementValue = (index, field, amount) => {
    setSets(prev => prev.map((set, i) => {
      if (i !== index) return set;
      const currentValue = parseInt(set[field]) || 0;
      const newValue = Math.max(0, currentValue + amount);
      return { ...set, [field]: newValue.toString() };
    }));
  };

  const handleSave = async () => {
    const completedSets = sets.filter(s => s.completed && (s.weight || s.reps));
    
    if (completedSets.length === 0) {
      toast.error("Complete pelo menos uma série");
      return;
    }

    setSaving(true);
    try {
      await api.post("/progress", {
        workout_id: workoutId,
        exercise_name: exercise.name,
        sets_completed: completedSets.map(s => ({
          set: s.set,
          weight: parseFloat(s.weight) || 0,
          reps: parseInt(s.reps) || 0
        }))
      });
      
      onProgressLogged();
      onClose();
    } catch (error) {
      toast.error("Erro ao salvar progresso");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fade-in">
      <Card className="w-full max-w-lg bg-card border-border sm:rounded-lg rounded-t-3xl max-h-[90vh] flex flex-col animate-slide-up" data-testid="set-tracker-modal">
        {/* Header with Image */}
        <div className="relative h-48 overflow-hidden rounded-t-3xl sm:rounded-t-lg">
          <img
            src={exercise.image_url || defaultImage}
            alt={exercise.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 exercise-overlay" />
          
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 rounded-full"
            onClick={onClose}
            data-testid="close-set-tracker"
          >
            <X className="w-5 h-5" />
          </Button>

          {/* Exercise Info Overlay */}
          <div className="absolute bottom-4 left-4 right-4">
            <h2 className="text-2xl font-black uppercase tracking-tight">{exercise.name}</h2>
            {exercise.muscle_group && (
              <p className="text-primary font-semibold">{exercise.muscle_group}</p>
            )}
            <div className="flex items-center gap-3 mt-2">
              <span className="flex items-center gap-1 text-sm">
                <Target className="w-4 h-4 text-cyan-400" />
                {exercise.sets}x {exercise.reps}
              </span>
              {exercise.weight && (
                <span className="text-sm text-muted-foreground">{exercise.weight}</span>
              )}
            </div>
          </div>

          {/* Play Button for Video */}
          {exercise.video_url && (
            <a 
              href={exercise.video_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-4 rounded-full bg-primary/80 hover:bg-primary transition-colors"
            >
              <Play className="w-8 h-8 text-white fill-white" />
            </a>
          )}
        </div>

        {/* Description */}
        {exercise.description && (
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm text-muted-foreground">{exercise.description}</p>
          </div>
        )}

        {/* Sets Table */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-3">
            {/* Previous Data Hint */}
            {previousData && (
              <div className="p-3 rounded-lg bg-secondary/30 text-sm">
                <p className="text-muted-foreground mb-1">Último treino:</p>
                <p className="font-semibold">
                  {previousData.sets_completed?.map((s, i) => 
                    `${s.weight}kg x ${s.reps}${i < previousData.sets_completed.length - 1 ? " | " : ""}`
                  )}
                </p>
              </div>
            )}

            {/* Header Row */}
            <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground uppercase tracking-wide px-2">
              <div className="col-span-2">Série</div>
              <div className="col-span-4 text-center">Carga (kg)</div>
              <div className="col-span-4 text-center">Reps</div>
              <div className="col-span-2 text-center">OK</div>
            </div>

            {/* Set Rows */}
            {sets.map((set, index) => (
              <div 
                key={set.set}
                className={`grid grid-cols-12 gap-2 items-center p-2 rounded-lg transition-colors ${
                  set.completed ? "bg-green-500/10 border border-green-500/30" : "bg-secondary/30"
                }`}
                data-testid={`set-row-${index}`}
              >
                <div className="col-span-2 font-bold text-lg text-center">{set.set}</div>
                
                {/* Weight Input */}
                <div className="col-span-4 flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => incrementValue(index, "weight", -2.5)}
                    data-testid={`weight-minus-${index}`}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <Input
                    type="number"
                    value={set.weight}
                    onChange={(e) => updateSet(index, "weight", e.target.value)}
                    placeholder="0"
                    className="h-10 text-center bg-background/50 border-white/10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    data-testid={`weight-input-${index}`}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => incrementValue(index, "weight", 2.5)}
                    data-testid={`weight-plus-${index}`}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>

                {/* Reps Input */}
                <div className="col-span-4 flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => incrementValue(index, "reps", -1)}
                    data-testid={`reps-minus-${index}`}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <Input
                    type="number"
                    value={set.reps}
                    onChange={(e) => updateSet(index, "reps", e.target.value)}
                    placeholder="0"
                    className="h-10 text-center bg-background/50 border-white/10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    data-testid={`reps-input-${index}`}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => incrementValue(index, "reps", 1)}
                    data-testid={`reps-plus-${index}`}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>

                {/* Complete Toggle */}
                <div className="col-span-2 flex justify-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-10 w-10 rounded-full transition-all ${
                      set.completed 
                        ? "bg-green-500 hover:bg-green-600 text-white" 
                        : "bg-secondary hover:bg-secondary/80"
                    }`}
                    onClick={() => toggleSetComplete(index)}
                    data-testid={`complete-set-${index}`}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <Button 
            className="w-full h-12 font-bold uppercase tracking-wider gap-2"
            onClick={handleSave}
            disabled={saving}
            data-testid="save-progress-btn"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Salvar Progresso
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
};
