import React, { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { CalendarEvent, CalendarSource } from '../types/calendar';

interface EventModalProps {
  isOpen: boolean;
  event: CalendarEvent | null;
  sources: CalendarSource[];
  isCreating: boolean;
  onClose: () => void;
  onCreate: (event: Omit<CalendarEvent, 'id'>) => void;
  onUpdate: (eventId: string, event: Partial<CalendarEvent>) => void;
  onDelete: (eventId: string) => void;
  selectedDate?: Date;
}

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  event,
  sources,
  isCreating,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
  selectedDate,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    sourceId: sources[0]?.id || '',
    allDay: false,
  });

  useEffect(() => {
    if (isCreating && selectedDate) {
      const dateStr = selectedDate.toISOString().split('T')[0];
      setFormData({
        title: '',
        description: '',
        startDate: dateStr,
        startTime: '09:00',
        endDate: dateStr,
        endTime: '10:00',
        sourceId: sources[0]?.id || '',
        allDay: false,
      });
    } else if (event) {
      const startDate = new Date(event.startDate);
      const endDate = new Date(event.endDate);
      
      setFormData({
        title: event.title,
        description: event.description,
        startDate: startDate.toISOString().split('T')[0],
        startTime: startDate.toTimeString().slice(0, 5),
        endDate: endDate.toISOString().split('T')[0],
        endTime: endDate.toTimeString().slice(0, 5),
        sourceId: event.source.id,
        allDay: event.allDay || false,
      });
    }
  }, [event, isCreating, selectedDate, sources]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const source = sources.find(s => s.id === formData.sourceId)!;
    const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
    const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);
    
    const eventData: Omit<CalendarEvent, 'id'> = {
      title: formData.title,
      description: formData.description,
      startDate: startDateTime,
      endDate: endDateTime,
      source,
      color: source.color,
      allDay: formData.allDay,
    };

    if (isCreating) {
      onCreate(eventData);
    } else if (event) {
      onUpdate(event.id, eventData);
    }
    
    onClose();
  };

  const handleDelete = () => {
    if (event && window.confirm('この予定を削除しますか？')) {
      onDelete(event.id);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {isCreating ? '予定を追加' : '予定を編集'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              タイトル *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              説明
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              カレンダー
            </label>
            <select
              value={formData.sourceId}
              onChange={(e) => setFormData({ ...formData, sourceId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {sources.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                開始日
              </label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                開始時刻
              </label>
              <input
                type="time"
                required
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                終了日
              </label>
              <input
                type="date"
                required
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                終了時刻
              </label>
              <input
                type="time"
                required
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-4">
              {!isCreating && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  削除
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {isCreating ? '作成' : '更新'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};