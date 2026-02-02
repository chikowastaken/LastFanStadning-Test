import { useEffect, useState } from "react";

interface CountdownTimerProps {
  targetDate: Date;
  onComplete?: () => void;
  label?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function CountdownTimer({ targetDate, onComplete, label }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = targetDate.getTime() - new Date().getTime();

      if (difference <= 0) {
        setIsComplete(true);
        onComplete?.();
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onComplete]);

  if (isComplete) {
    return (
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-1">{label || "დრო ამოიწურა!"}</p>
        <div className="text-2xl font-display font-bold text-destructive">დასრულდა</div>
      </div>
    );
  }

  const TimeBlock = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg bg-secondary flex items-center justify-center border border-border">
        <span className="font-display text-xl sm:text-2xl font-bold text-foreground">
          {value.toString().padStart(2, "0")}
        </span>
      </div>
      <span className="text-xs text-muted-foreground mt-1">{label}</span>
    </div>
  );

  return (
    <div className="text-center">
      {label && <p className="text-sm text-muted-foreground mb-3">{label}</p>}
      <div className="flex items-center justify-center gap-2 sm:gap-3">
        <TimeBlock value={timeLeft.days} label="დღე" />
        <span className="text-2xl font-display text-muted-foreground">:</span>
        <TimeBlock value={timeLeft.hours} label="საათი" />
        <span className="text-2xl font-display text-muted-foreground">:</span>
        <TimeBlock value={timeLeft.minutes} label="წუთი" />
        <span className="text-2xl font-display text-muted-foreground">:</span>
        <TimeBlock value={timeLeft.seconds} label="წამი" />
      </div>
    </div>
  );
}
