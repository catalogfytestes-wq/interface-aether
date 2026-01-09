import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface CalendarWidgetProps {
  onDateSelect?: (date: Date) => void;
}

const CalendarWidget = ({ onDateSelect }: CalendarWidgetProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const monthNames = [
    'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
    'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
  ];

  const dayNames = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: (number | null)[] = [];

    // Add empty slots for days before the first of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }

    // Add the days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const days = getDaysInMonth(currentDate);
  const today = new Date();

  const isToday = (day: number) => {
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day: number) => {
    return (
      day === selectedDate.getDate() &&
      currentDate.getMonth() === selectedDate.getMonth() &&
      currentDate.getFullYear() === selectedDate.getFullYear()
    );
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDayClick = (day: number) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(newDate);
    onDateSelect?.(newDate);
  };

  return (
    <div className="hud-glass holo-border p-3 w-56">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-3 h-3 text-primary/60" />
          <span className="text-[9px] uppercase tracking-widest text-primary/60 font-orbitron">
            CALENDÁRIO
          </span>
        </div>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-2">
        <motion.button
          className="p-1 hover:bg-primary/20 rounded transition-colors"
          onClick={handlePrevMonth}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ChevronLeft className="w-4 h-4 text-primary/60" />
        </motion.button>

        <motion.div
          key={`${currentDate.getMonth()}-${currentDate.getFullYear()}`}
          className="text-center"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-xs font-orbitron text-primary text-glow">
            {monthNames[currentDate.getMonth()]}
          </div>
          <div className="text-[9px] text-primary/40 font-mono">
            {currentDate.getFullYear()}
          </div>
        </motion.div>

        <motion.button
          className="p-1 hover:bg-primary/20 rounded transition-colors"
          onClick={handleNextMonth}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ChevronRight className="w-4 h-4 text-primary/60" />
        </motion.button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {dayNames.map((day, i) => (
          <div
            key={i}
            className="text-[8px] text-center text-primary/40 font-mono py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => (
          <motion.button
            key={i}
            className={`
              relative w-6 h-6 text-[10px] font-mono rounded flex items-center justify-center
              transition-all duration-200
              ${day === null ? 'invisible' : ''}
              ${isToday(day!) ? 'ring-1 ring-primary/50' : ''}
              ${isSelected(day!) ? 'bg-primary text-primary-foreground' : 'hover:bg-primary/20 text-primary/70'}
            `}
            onClick={() => day && handleDayClick(day)}
            disabled={day === null}
            whileHover={day ? { scale: 1.1 } : {}}
            whileTap={day ? { scale: 0.9 } : {}}
          >
            {day}
            {isToday(day!) && !isSelected(day!) && (
              <div className="absolute bottom-0.5 w-1 h-1 rounded-full bg-primary" />
            )}
          </motion.button>
        ))}
      </div>

      {/* Selected date display */}
      <div className="mt-3 pt-2 border-t border-primary/10">
        <div className="text-[8px] uppercase tracking-wider text-primary/40">
          SELECIONADO:
        </div>
        <div className="text-[10px] text-primary font-mono">
          {selectedDate.toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
          })}
        </div>
      </div>
    </div>
  );
};

export default CalendarWidget;
