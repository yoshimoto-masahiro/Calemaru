import React from 'react';
import { CalendarDay } from '../types/calendar';
import { CalendarDayCell } from './CalendarDayCell';

interface CalendarGridProps {
  calendarDays: CalendarDay[];
  onDayClick: (date: Date) => void;
  onEventClick: (event: any) => void;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  calendarDays,
  onDayClick,
  onEventClick,
}) => {
  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      {/* Header with day names */}
      <div className="grid grid-cols-7 bg-gray-50 border-b">
        {weekDays.map((day, index) => (
          <div key={day} className={`p-3 text-center text-sm font-medium text-gray-700 ${
            index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : ''
          }`}>
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day, index) => (
          <CalendarDayCell
            key={index}
            day={day}
            onDayClick={onDayClick}
            onEventClick={onEventClick}
          />
        ))}
      </div>
    </div>
  );
};