import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, parseISO } from "date-fns";

interface DateNavProps {
  dates: string[];
  selectedDate: string | null;
  onDateChange: (date: string | null) => void;
}

export function DateNav({ dates, selectedDate, onDateChange }: DateNavProps) {
  if (dates.length === 0) {
    return (
      <div className="text-sm text-muted-foreground font-mono py-2">
        No snapshots yet. Generate your first batch below.
      </div>
    );
  }

  const currentIndex = selectedDate ? dates.indexOf(selectedDate) : -1;
  const canGoNewer = currentIndex > 0;
  const canGoOlder = currentIndex < dates.length - 1 && currentIndex !== -1;

  return (
    <div className="flex items-center gap-2">
      <button
        className="date-nav-btn px-2"
        disabled={!canGoNewer}
        onClick={() => canGoNewer && onDateChange(dates[currentIndex - 1])}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
        <button
          className={`date-nav-btn ${!selectedDate ? "active" : ""}`}
          onClick={() => onDateChange(null)}
        >
          All
        </button>
        {dates.slice(0, 14).map((date) => (
          <button
            key={date}
            className={`date-nav-btn whitespace-nowrap ${selectedDate === date ? "active" : ""}`}
            onClick={() => onDateChange(date)}
          >
            {format(parseISO(date), "MMM d")}
          </button>
        ))}
      </div>

      <button
        className="date-nav-btn px-2"
        disabled={!canGoOlder}
        onClick={() => canGoOlder && onDateChange(dates[currentIndex + 1])}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
