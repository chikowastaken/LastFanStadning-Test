import { Trophy } from "lucide-react";

interface PointsDisplayProps {
  points: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export default function PointsDisplay({ points, size = "md", showLabel = true }: PointsDisplayProps) {
  const sizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <div className="flex flex-col items-center gap-1">
      {showLabel && <p className="text-xs text-muted-foreground uppercase tracking-wider">სულ ქულები</p>}
      <div className="flex items-center gap-2">
        <Trophy className={`${iconSizes[size]} text-accent`} />
        <span className={`font-display font-bold text-gradient-accent ${sizeClasses[size]}`}>
          {points.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
