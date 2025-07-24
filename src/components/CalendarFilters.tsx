import React from 'react';
import { CalendarSource } from '../types/calendar';

interface CalendarFiltersProps {
  sources: CalendarSource[];
  onToggleSource: (sourceId: string) => void;
  isOpen: boolean;
}

export const CalendarFilters: React.FC<CalendarFiltersProps> = ({
  sources,
  onToggleSource,
  isOpen,
}) => {
  if (!isOpen) return null;

  return (
    <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border">
      <h3 className="font-semibold text-gray-900 mb-3">カレンダーソース</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {sources.map((source) => (
          <label
            key={source.id}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={source.enabled}
              onChange={() => onToggleSource(source.id)}
              className="sr-only"
            />
            <div className="flex items-center gap-2">
              <div 
                className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                  source.enabled ? 'border-transparent' : 'border-gray-300'
                }`}
                style={{ backgroundColor: source.enabled ? source.color : 'transparent' }}
              >
                {source.enabled && (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <span className="text-sm font-medium text-gray-700">{source.name}</span>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
};