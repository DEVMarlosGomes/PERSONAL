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
  Check,
  CheckCircle2,
  Clock,
  Target,
  Bell,
  BellOff,
  Settings,
} from "lucide-react";
import api from "../lib/api";
import { toast } from "sonner";

export const SetTracker = ({ exercise, workoutId, dayName, onClose, onProgressLogged }) => {
  const [sets, setSets] = useState([]);
  const [saving, setSaving] = useState(false);
  const [previousData, setPreviousData] = useState(null);
  const [resolvedVideoUrl, setResolvedVideoUrl] = useState("");
  const [loadingVideo, setLoadingVideo] = useState(false);

  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerDuration, setTimerDuration] = useState(exercise.rest_time || 90);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const timerRef = useRef(null);

  const difficulty = 3;
  const defaultImage =
    "https://images.unsplash.com/photo-1700784795176-7ff886439d79?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200";

  useEffect(() => {
    const numSets = exercise.sets || 4;
    const initialSets = Array.from({ length: numSets }, (_, i) => ({
      set: i + 1,
      weight: "",
      reps: "",
      completed: false,
    }));

    setSets(initialSets);
    setTimerDuration(exercise.rest_time || 90);
    setTimerSeconds(0);

    loadPreviousProgress();
    resolveVideoUrl();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [exercise]);

  useEffect(() => {
    if (timerActive && timerSeconds > 0) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setTimerActive(false);
            if (soundEnabled) {
              playTimerEndSound();
            }
            toast.success("Tempo de descanso finalizado");
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
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 880;
      oscillator.type = "sine";
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.log("Audio not supported");
    }
  };

  const loadPreviousProgress = async () => {
    try {
      const response = await api.get(`/progress?exercise_name=${encodeURIComponent(exercise.name)}`);
      if (response.data.length > 0) {
        setPreviousData(response.data[0]);
      } else {
        setPreviousData(null);
      }
    } catch (error) {
      console.error("Error loading previous progress:", error);
      setPreviousData(null);
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
    } catch (error) {
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
    setSets((prev) => prev.map((set, i) => (i === index ? { ...set, [field]: value } : set)));
  };

  const toggleSetComplete = (index) => {
    const set = sets[index];
    const newCompleted = !set.completed;

    setSets((prev) => prev.map((s, i) => (i === index ? { ...s, completed: newCompleted } : s)));

    if (newCompleted && index < sets.length - 1) {
      startTimer();
    }
  };

  const formatPreviousWeight = (value) => {
    if (value === null || value === undefined || value === "") return "-";
    const num = Number(value);
    if (Number.isNaN(num)) return "-";
    return `${num.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} kg`;
  };

  const formatPreviousReps = (value) => {
    if (value === null || value === undefined || value === "") return "-";
    const num = Number(value);
    if (Number.isNaN(num)) return "-";
    return `${num.toLocaleString("pt-BR")} rep`;
  };

  const getPreviousSetData = (setNumber, index) => {
    if (!previousData?.sets_completed?.length) return null;
    return (
      previousData.sets_completed.find((s) => Number(s?.set) === Number(setNumber)) ||
      previousData.sets_completed[index] ||
      null
    );
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
    setTimerSeconds(0);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSave = async () => {
    const completedSets = sets.filter((s) => s.completed && (s.weight || s.reps));

    if (completedSets.length === 0) {
      toast.error("Complete pelo menos uma serie");
      return;
    }

    setSaving(true);
    try {
      await api.post("/progress", {
        workout_id: workoutId,
        exercise_name: exercise.name,
        day_name: dayName || null,
        sets_completed: completedSets.map((s) => ({
          set: s.set,
          weight: parseFloat(s.weight) || 0,
          reps: parseInt(s.reps) || 0,
        })),
        difficulty,
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
  const completedSets = sets.filter((s) => s.completed).length;
  const completionPercent = sets.length ? Math.round((completedSets / sets.length) * 100) : 0;
  const workoutHeadline = dayName
    ? `Treino ${dayName} - ${exercise.muscle_group || exercise.name}`
    : exercise.name;
  const instructionText =
    exercise.description ||
    exercise.notes ||
    "Mantenha a tecnica controlada e finalize todas as series com boa execucao.";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.24),_transparent_40%),radial-gradient(circle_at_bottom,_rgba(56,189,248,0.14),_transparent_45%)] bg-[#030610]/95 backdrop-blur-md">
      <div className="min-h-full flex items-start justify-center p-2 sm:p-6">
        <Card
          className="w-full max-w-3xl bg-gradient-to-b from-[#0b1228] via-[#070d1e] to-[#040814] border border-blue-500/25 rounded-[28px] shadow-[0_0_65px_rgba(37,99,235,0.22)] overflow-hidden"
          data-testid="set-tracker-modal"
        >
          <div className="px-4 sm:px-6 pt-5 pb-4 border-b border-blue-500/20">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-zinc-400 text-sm">Treino em andamento</p>
                <h2 className="text-xl sm:text-3xl font-black tracking-tight truncate text-white">{workoutHeadline}</h2>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-200"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  data-testid="toggle-sound"
                >
                  {soundEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-200"
                  onClick={resetTimer}
                  data-testid="reset-timer"
                >
                  <Settings className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-200"
                  onClick={onClose}
                  data-testid="close-set-tracker"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-zinc-300">
                <Clock className="w-4 h-4 text-zinc-400" />
                {completedSets}/{sets.length}
              </div>
              <div className="flex items-center gap-2 text-zinc-300">
                <RotateCcw className="w-4 h-4 text-zinc-400" />
                {formatTime(timerSeconds)}
              </div>
              <div className="font-semibold text-blue-400">{completionPercent}%</div>
            </div>
            <Progress value={completionPercent} className="mt-2 h-2 bg-white/10 [&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:to-cyan-400" />

            <div className="mt-3 flex items-center gap-2">
              {!timerActive ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 border-blue-500/50 text-blue-300 hover:bg-blue-500/10"
                  onClick={startTimer}
                  data-testid="start-timer"
                >
                  <Play className="w-3 h-3 mr-1 fill-current" />
                  Iniciar descanso
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 border-orange-500/50 text-orange-300 hover:bg-orange-500/10"
                  onClick={pauseTimer}
                  data-testid="pause-timer"
                >
                  <Pause className="w-3 h-3 mr-1" />
                  Pausar
                </Button>
              )}
              <select
                value={timerDuration}
                onChange={(e) => setTimerDuration(parseInt(e.target.value))}
                className="h-8 bg-[#0b132d] border border-blue-500/30 rounded-lg px-2 text-xs text-zinc-200"
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

          <div className="max-h-[74vh] overflow-y-auto p-4 sm:p-6">
            <div className="rounded-2xl border border-blue-500/25 bg-gradient-to-b from-[#0b1228]/95 to-[#050a18]/95 p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 rounded-full bg-white/8 border border-blue-500/20 flex items-center justify-center text-zinc-200 font-black">
                  {completedSets}/{sets.length}
                </div>
                <div className="min-w-0">
                  <h3 className="text-2xl font-extrabold tracking-tight text-white">{exercise.name}</h3>
                  <p className="text-zinc-400 text-sm">{exercise.muscle_group || "Exercicio"}</p>
                  <div className="inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-lg bg-blue-500/20 text-blue-300 text-sm font-bold">
                    <Target className="w-3 h-3" />
                    {exercise.sets}x {exercise.reps}
                  </div>
                  {loadingVideo && <p className="text-xs text-zinc-500 mt-2">Carregando video...</p>}
                </div>
              </div>

              <div className="mt-4 rounded-2xl overflow-hidden border border-blue-500/20 bg-black/30">
                <div className={`relative ${embedUrl ? "aspect-video" : "h-52 sm:h-72"}`}>
                  {embedUrl ? (
                    <iframe
                      title={`video-${exercise.name}`}
                      src={embedUrl}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <img src={exercise.image_url || defaultImage} alt={exercise.name} className="w-full h-full object-cover" />
                  )}

                  {!embedUrl && videoUrl && (
                    <a
                      href={videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/35 transition-colors"
                    >
                      <div className="h-20 w-20 rounded-full border border-blue-300/70 bg-blue-500/40 backdrop-blur-sm flex items-center justify-center">
                        <Play className="w-9 h-9 text-white fill-white ml-1" />
                      </div>
                    </a>
                  )}
                </div>
              </div>

              <p className="mt-4 text-zinc-300 text-lg leading-relaxed">{instructionText}</p>

              <div className="mt-4 rounded-2xl border border-blue-500/20 bg-black/25 p-3 sm:p-4">
                <div className="grid grid-cols-12 gap-2 text-xs tracking-wide uppercase text-zinc-400 px-1 pb-2 border-b border-white/10">
                  <div className="col-span-2">Serie</div>
                  <div className="col-span-4 text-center">Carga</div>
                  <div className="col-span-4 text-center">Repeticoes</div>
                  <div className="col-span-2 text-center">OK</div>
                </div>

                <div className="space-y-2 pt-2">
                  {sets.map((set, index) => {
                    const previousSetData = getPreviousSetData(set.set, index);
                    return (
                      <div
                        key={set.set}
                        className={`grid grid-cols-12 gap-2 items-center p-2 rounded-xl border transition-all ${
                          set.completed
                            ? "bg-blue-500/12 border-blue-400/45 shadow-[0_0_18px_rgba(59,130,246,0.2)]"
                            : "bg-[#070e23]/70 border-white/10"
                        }`}
                        data-testid={`set-row-${index}`}
                      >
                        <div className="col-span-2">
                          <div className="h-10 rounded-lg bg-white/8 border border-white/10 flex items-center justify-center text-xl font-black text-zinc-200">
                            {set.set}
                          </div>
                        </div>

                        <div className="col-span-4">
                          <Input
                            type="number"
                            value={set.weight}
                            onChange={(e) => updateSet(index, "weight", e.target.value)}
                            placeholder="0"
                            className="h-10 text-center rounded-xl bg-[#0a122c] border-blue-500/25 text-blue-300 text-lg font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            data-testid={`weight-input-${index}`}
                          />
                          <p className="text-[11px] text-zinc-500 mt-1 text-center">
                            ant: {formatPreviousWeight(previousSetData?.weight)}
                          </p>
                        </div>

                        <div className="col-span-4">
                          <Input
                            type="number"
                            value={set.reps}
                            onChange={(e) => updateSet(index, "reps", e.target.value)}
                            placeholder="0"
                            className="h-10 text-center rounded-xl bg-[#0a122c] border-blue-500/25 text-zinc-100 text-lg font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            data-testid={`reps-input-${index}`}
                          />
                          <p className="text-[11px] text-zinc-500 mt-1 text-center">
                            ant: {formatPreviousReps(previousSetData?.reps)}
                          </p>
                        </div>

                        <div className="col-span-2 flex justify-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-10 w-10 rounded-xl border ${
                              set.completed
                                ? "bg-blue-500 text-white border-blue-200 shadow-[0_0_20px_rgba(59,130,246,0.55)]"
                                : "bg-blue-500/20 text-blue-300 border-blue-500/40 hover:bg-blue-500/30"
                            }`}
                            onClick={() => toggleSetComplete(index)}
                            data-testid={`complete-set-${index}`}
                          >
                            <Check className="w-5 h-5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 text-center text-[11px] tracking-[0.32em] text-blue-300/70">FITMASTER</div>
            </div>
          </div>

          <div className="p-4 border-t border-blue-500/20 bg-[#040916]">
            <Button
              className="w-full h-12 font-bold uppercase tracking-wider gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white"
              onClick={handleSave}
              disabled={saving}
              data-testid="save-progress-btn"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Salvar progresso
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
