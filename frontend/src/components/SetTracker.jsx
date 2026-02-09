import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { Progress } from "./ui/progress";
import { 
  X, 
  Play, 
  Pause,
  RotateCcw,
  CheckCircle2, 
  Plus, 
  Minus,
  Clock,
  Target,
  Volume2,
  VolumeX
} from "lucide-react";
import api from "../lib/api";
import { toast } from "sonner";

export const SetTracker = ({ exercise, workoutId, onClose, onProgressLogged }) => {
  const [sets, setSets] = useState([]);
  const [saving, setSaving] = useState(false);
  const [previousData, setPreviousData] = useState(null);
  const [difficulty, setDifficulty] = useState(3);
  const [suggestion, setSuggestion] = useState(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [resolvedVideoUrl, setResolvedVideoUrl] = useState("");
  const [loadingVideo, setLoadingVideo] = useState(false);
  
  // Timer state
  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerDuration, setTimerDuration] = useState(exercise.rest_time || 90);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const timerRef = useRef(null);
  const audioRef = useRef(null);

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
    setTimerDuration(exercise.rest_time || 90);
    setDifficulty(3);

    // Load previous progress
    loadPreviousProgress();
    loadSuggestion();
    resolveVideoUrl();

    // Cleanup timer on unmount
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [exercise]);

  // Timer effect
  useEffect(() => {
    if (timerActive && timerSeconds > 0) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setTimerActive(false);
            // Play sound when timer ends
            if (soundEnabled) {
              playTimerEndSound();
            }
            toast.success("Tempo de descanso finalizado! 💪");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerActive, soundEnabled]);

  const playTimerEndSound = () => {
    try {
      // Create a simple beep using Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 880; // A5 note
      oscillator.type = "sine";
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
      console.log("Audio not supported");
    }
  };

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

  const loadSuggestion = async () => {
    if (!exercise?.name || !workoutId) return;
    setLoadingSuggestion(true);
    try {
      const response = await api.get(`/progress/suggestion?exercise_name=${encodeURIComponent(exercise.name)}&workout_id=${workoutId}`);
      setSuggestion(response.data);
    } catch (error) {
      setSuggestion(null);
    } finally {
      setLoadingSuggestion(false);
    }
  };

  const getEmbedUrl = (url) => {
    if (!url) return null;
    try {
      if (url.includes("youtube.com")) {
        const videoId = new URL(url).searchParams.get("v");
        return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
      }
      if (url.includes("youtu.be")) {
        const videoId = url.split("/").pop();
        return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
      }
      if (url.includes("/embed/")) return url;
      const match = url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]+)/);
      if (match) return `https://www.youtube.com/embed/${match[1]}`;
    } catch (e) {
      const match = url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]+)/);
      if (match) return `https://www.youtube.com/embed/${match[1]}`;
      return null;
    }
    return null;
  };

  const resolveVideoUrl = async () => {
    const directUrl = exercise?.video_url || "";
    if (directUrl && getEmbedUrl(directUrl)) {
      setResolvedVideoUrl(directUrl);
      return;
    }
    if (!exercise?.name) return;
    setLoadingVideo(true);
    try {
      const response = await api.get(`/exercises/video/${encodeURIComponent(exercise.name)}`);
      setResolvedVideoUrl(response.data?.video_url || "");
    } catch (error) {
      setResolvedVideoUrl("");
    } finally {
      setLoadingVideo(false);
    }
  };

  const updateSet = (index, field, value) => {
    setSets(prev => prev.map((set, i) => 
      i === index ? { ...set, [field]: value } : set
    ));
  };

  const toggleSetComplete = (index) => {
    const set = sets[index];
    const newCompleted = !set.completed;
    
    setSets(prev => prev.map((s, i) => 
      i === index ? { ...s, completed: newCompleted } : s
    ));

    // Start rest timer automatically when completing a set
    if (newCompleted && index < sets.length - 1) {
      startTimer();
    }
  };

  const incrementValue = (index, field, amount) => {
    setSets(prev => prev.map((set, i) => {
      if (i !== index) return set;
      const currentValue = parseFloat(set[field]) || 0;
      const newValue = Math.max(0, currentValue + amount);
      return { ...set, [field]: newValue.toString() };
    }));
  };

  const startTimer = useCallback(() => {
    setTimerSeconds(timerDuration);
    setTimerActive(true);
  }, [timerDuration]);

  const pauseTimer = () => {
    setTimerActive(false);
  };

  const resetTimer = () => {
    setTimerActive(false);
    setTimerSeconds(timerDuration);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const timerProgress = timerDuration > 0 ? ((timerDuration - timerSeconds) / timerDuration) * 100 : 0;

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
        })),
        difficulty
      });
      
      onProgressLogged();
      onClose();
    } catch (error) {
      toast.error("Erro ao salvar progresso");
    } finally {
      setSaving(false);
    }
  };

  const videoUrl = resolvedVideoUrl || exercise.video_url || "";
  const embedUrl = getEmbedUrl(videoUrl);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fade-in p-3 sm:p-6 pointer-events-none">
      <Card className="w-full max-w-lg bg-card border-border sm:rounded-2xl rounded-t-3xl max-h-[85vh] flex flex-col animate-slide-up overflow-hidden pointer-events-auto" data-testid="set-tracker-modal">
        {/* Header with Video or Image */}
        <div className="relative overflow-hidden rounded-t-3xl sm:rounded-t-2xl">
          <div className={`relative ${embedUrl ? "aspect-video" : "h-40 sm:h-48"}`}>
            {embedUrl ? (
              <iframe
                title={`video-${exercise.name}`}
                src={embedUrl}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <img
                src={exercise.image_url || defaultImage}
                alt={exercise.name}
                className="w-full h-full object-cover"
              />
            )}
            {!embedUrl && videoUrl && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className="p-3 rounded-full bg-primary/90">
                  <Play className="w-6 h-6 text-white fill-white" />
                </div>
              </div>
            )}
          </div>

          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 rounded-full z-20"
            onClick={onClose}
            data-testid="close-set-tracker"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Exercise Info */}
        <div className="px-4 py-3 border-b border-border bg-secondary/20">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-xl font-black uppercase tracking-tight truncate">{exercise.name}</h2>
              {exercise.muscle_group && (
                <p className="text-primary font-semibold text-sm">{exercise.muscle_group}</p>
              )}
              <div className="flex flex-wrap items-center gap-3 mt-1">
                <span className="flex items-center gap-1 text-xs">
                  <Target className="w-3 h-3 text-cyan-400" />
                  {exercise.sets}x {exercise.reps}
                </span>
                {exercise.weight && (
                  <span className="text-xs text-muted-foreground">{exercise.weight}</span>
                )}
                {loadingVideo && (
                  <span className="text-xs text-muted-foreground">Carregando vídeo...</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
        {/* Video link fallback */}
        {videoUrl && !embedUrl && (
          <div className="px-4 pt-4">
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary underline"
            >
              Abrir vídeo do exercício
            </a>
          </div>
        )}

        {/* Rest Timer */}
        <div className="px-4 py-3 border-b border-border bg-secondary/30">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-semibold">Descanso</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setSoundEnabled(!soundEnabled)}
                data-testid="toggle-sound"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-muted-foreground" />}
              </Button>
              <select 
                value={timerDuration}
                onChange={(e) => setTimerDuration(parseInt(e.target.value))}
                className="bg-secondary border border-white/10 rounded px-2 py-1 text-xs"
                data-testid="timer-duration-select"
              >
                <option value={30}>30s</option>
                <option value={45}>45s</option>
                <option value={60}>1min</option>
                <option value={90}>1:30</option>
                <option value={120}>2min</option>
                <option value={180}>3min</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Progress 
                value={timerProgress} 
                className="h-2 bg-secondary"
              />
            </div>
            <span className={`text-xl font-bold tabular-nums min-w-[60px] text-center ${timerActive ? 'text-cyan-400 animate-pulse' : ''}`}>
              {formatTime(timerSeconds)}
            </span>
            <div className="flex gap-1">
              {!timerActive ? (
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 border-cyan-500/50 hover:bg-cyan-500/10"
                  onClick={startTimer}
                  data-testid="start-timer"
                >
                  <Play className="w-4 h-4 text-cyan-400 fill-cyan-400" />
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 border-orange-500/50 hover:bg-orange-500/10"
                  onClick={pauseTimer}
                  data-testid="pause-timer"
                >
                  <Pause className="w-4 h-4 text-orange-400" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={resetTimer}
                data-testid="reset-timer"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Difficulty + Suggestion */}
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold">Dificuldade</span>
            <span className="text-xs text-muted-foreground">1 = leve • 5 = muito difícil</span>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((level) => (
              <Button
                key={level}
                type="button"
                variant={difficulty === level ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setDifficulty(level)}
                data-testid={`difficulty-${level}`}
              >
                {level}
              </Button>
            ))}
          </div>

          <div className="mt-3 p-3 rounded-lg bg-secondary/30 text-sm">
            {loadingSuggestion ? (
              <div className="text-muted-foreground">Calculando sugestão de carga...</div>
            ) : suggestion?.eligible ? (
              <div>
                <p className="font-semibold text-green-400">Sugestão de aumento</p>
                <p className="text-muted-foreground">
                  Atual: {suggestion.current_max_weight}kg • Sugestão: {suggestion.suggested_weight}kg (+{suggestion.increase}kg)
                </p>
              </div>
            ) : (
              <div className="text-muted-foreground">
                {suggestion?.reason || "Sem sugestão de aumento no momento"}
              </div>
            )}
          </div>
        </div>

        {/* Sets Table */}
        <div className="p-4 space-y-3">
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
                className={`grid grid-cols-12 gap-2 items-center p-2 rounded-lg transition-all ${
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
        </div>

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
