import { Card, CardContent } from "./ui/card";
import { Play, Dumbbell, ChevronRight } from "lucide-react";

export const ExerciseCard = ({ exercise, index, onClick }) => {
  const defaultImage = "https://images.unsplash.com/photo-1700784795176-7ff886439d79?crop=entropy&cs=srgb&fm=jpg&q=85&w=400";

  return (
    <Card
      className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer card-hover overflow-hidden animate-slide-up"
      style={{ animationDelay: `${index * 50}ms` }}
      onClick={onClick}
      data-testid={`exercise-card-${index}`}
    >
      <CardContent className="p-0">
        <div className="flex items-stretch">
          {/* Image Section */}
          <div className="relative w-24 sm:w-32 flex-shrink-0">
            <img
              src={exercise.image_url || defaultImage}
              alt={exercise.name}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card" />
            {exercise.video_url && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="p-2 rounded-full bg-primary/80 backdrop-blur-sm">
                  <Play className="w-4 h-4 text-white fill-white" />
                </div>
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className="flex-1 p-4 flex flex-col justify-center min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-bold text-lg truncate">{exercise.name}</h3>
                {exercise.muscle_group && (
                  <p className="text-sm text-primary font-medium">{exercise.muscle_group}</p>
                )}
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            </div>

            {/* Sets & Reps */}
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/50">
                <Dumbbell className="w-3 h-3 text-cyan-400" />
                <span className="text-sm font-semibold">{exercise.sets}x {exercise.reps}</span>
              </div>
              {exercise.weight && (
                <span className="text-sm text-muted-foreground">{exercise.weight}</span>
              )}
            </div>

            {/* Notes */}
            {exercise.notes && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
                {exercise.notes}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
