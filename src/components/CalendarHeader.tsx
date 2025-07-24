import React from 'react';
import { ChevronLeft, ChevronRight, Plus, Filter, Upload } from 'lucide-react';

interface CalendarHeaderProps {
  currentDate: Date;
  onNavigate: (direction: 'prev' | 'next') => void;
  onCreateEvent: () => void;
  onToggleFilters: () => void;
  onImportFiles: () => void;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentDate,
  onNavigate,
  onCreateEvent,
  onToggleFilters,
  onImportFiles,
}) => {
  const monthYear = currentDate.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
  });

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">統合カレンダー</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('prev')}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-semibold text-gray-800 min-w-[140px] text-center">
            {monthYear}
          </h2>
          <button
            onClick={() => onNavigate('next')}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={onImportFiles}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Upload className="w-4 h-4" />
          インポート
        </button>
        <button
          onClick={onToggleFilters}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Filter className="w-4 h-4" />
          フィルター
        </button>
        <button
          onClick={onCreateEvent}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          予定を追加
        </button>
      </div>
    </div>
  );
};