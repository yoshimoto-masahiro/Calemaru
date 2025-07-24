import React from 'react';
import { CalendarDay, CalendarEvent } from '../types/calendar';

interface CalendarDayCellProps {
  day: CalendarDay;
  onDayClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}

export const CalendarDayCell: React.FC<CalendarDayCellProps> = ({
  day,
  onDayClick,
  onEventClick,
}) => {
  const dayNumber = day.date.getDate();
  const maxVisibleEvents = 3;
  const visibleEvents = day.events.slice(0, maxVisibleEvents);
  const hiddenEventsCount = day.events.length - maxVisibleEvents;

  return (
    <div 
      className={`min-h-[120px] p-2 border-r border-b hover:bg-gray-50 cursor-pointer transition-colors ${
        !day.isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''
      }`}
      onClick={() => onDayClick(day.date)}
    >
      <div className={`text-sm font-medium mb-1 ${
        day.isToday 
          ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center' 
          : ''
      }`}>
        {dayNumber}
      </div>
      
      <div className="space-y-1">
        {visibleEvents.map((event) => (
          <div
            key={event.id}
            className="text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 transition-opacity"
            style={{ backgroundColor: `${event.color}20`, color: event.color }}
            onClick={(e) => {
              e.stopPropagation();
              onEventClick(event);
            }}
            title={event.title}
          >
            <div className="font-medium truncate">{event.title}</div>
            <div className="text-xs opacity-75">
              {event.startDate.toLocaleTimeString('ja-JP', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          </div>
        ))}
        
        {hiddenEventsCount > 0 && (
          <div className="text-xs text-gray-500 font-medium">
            +{hiddenEventsCount}件の予定
          </div>
        )}
      </div>
    </div>
  );
};