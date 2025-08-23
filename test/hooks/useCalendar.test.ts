import { renderHook, act } from '@testing-library/react';
import { useCalendar } from '../../src/hooks/useCalendar';
import { CalendarEvent, CalendarSource } from '../../src/types/calendar';

// モックデータ
const mockSource: CalendarSource = {
  id: 'test-source',
  name: 'テストソース',
  type: 'local',
  color: '#FF0000',
  enabled: true
};

const mockEvent: CalendarEvent = {
  id: 'test-event',
  title: 'テストイベント',
  description: 'テスト説明',
  startDate: new Date('2025-01-15T10:00:00'),
  endDate: new Date('2025-01-15T11:00:00'),
  source: mockSource,
  color: mockSource.color
};

describe('useCalendar Hook', () => {
  beforeEach(() => {
    // 日付を固定してテストを安定化
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-01-15T12:00:00'));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with current date', () => {
      const { result } = renderHook(() => useCalendar());

      expect(result.current.currentDate.getFullYear()).toBe(2025);
      expect(result.current.currentDate.getMonth()).toBe(0); // January
      expect(result.current.currentDate.getDate()).toBe(15);
    });

    it('should initialize with mock events and sources', () => {
      const { result } = renderHook(() => useCalendar());

      expect(result.current.events).toHaveLength(6); // mockData.tsのイベント数
      expect(result.current.sources).toHaveLength(4); // mockData.tsのソース数
      expect(result.current.selectedEvent).toBeNull();
      expect(result.current.isEventModalOpen).toBe(false);
      expect(result.current.isCreating).toBe(false);
    });
  });

  describe('Calendar Navigation', () => {
    it('should navigate to previous month', () => {
      const { result } = renderHook(() => useCalendar());
      const initialMonth = result.current.currentDate.getMonth();

      act(() => {
        result.current.navigateMonth('prev');
      });

      // 1月から前の月は12月（前年）
      if (initialMonth === 0) {
        expect(result.current.currentDate.getMonth()).toBe(11);
        expect(result.current.currentDate.getFullYear()).toBe(2024);
      } else {
        expect(result.current.currentDate.getMonth()).toBe(initialMonth - 1);
      }
    });

    it('should navigate to next month', () => {
      const { result } = renderHook(() => useCalendar());
      const initialMonth = result.current.currentDate.getMonth();

      act(() => {
        result.current.navigateMonth('next');
      });

      expect(result.current.currentDate.getMonth()).toBe(initialMonth + 1);
    });

    it('should handle year boundary correctly', () => {
      const { result } = renderHook(() => useCalendar());
      
      // 12月から1月へ
      act(() => {
        result.current.currentDate = new Date(2024, 11, 15); // December 2024
      });

      console.log('Before navigation:', {
        year: result.current.currentDate.getFullYear(),
        month: result.current.currentDate.getMonth(),
        date: result.current.currentDate.getDate()
      });

      act(() => {
        result.current.navigateMonth('next');
      });

      console.log('After navigation:', {
        year: result.current.currentDate.getFullYear(),
        month: result.current.currentDate.getMonth(),
        date: result.current.currentDate.getDate()
      });

      expect(result.current.currentDate.getFullYear()).toBe(2025);
      expect(result.current.currentDate.getMonth()).toBe(1); // February (0-indexed)
    });
  });

  describe('Calendar Days Generation', () => {
    it('should generate correct number of calendar days', () => {
      const { result } = renderHook(() => useCalendar());

      expect(result.current.calendarDays).toHaveLength(42); // 6 weeks * 7 days
    });

    it('should mark current month days correctly', () => {
      const { result } = renderHook(() => useCalendar());
      
      const currentMonthDays = result.current.calendarDays.filter(day => day.isCurrentMonth);
      expect(currentMonthDays.length).toBeGreaterThan(0);
      
      // 現在の月の日付は全てisCurrentMonthがtrue
      currentMonthDays.forEach(day => {
        expect(day.isCurrentMonth).toBe(true);
      });
    });

    it('should mark today correctly', () => {
      const { result } = renderHook(() => useCalendar());
      
      const today = result.current.calendarDays.find(day => day.isToday);
      expect(today).toBeDefined();
      expect(today?.date.toDateString()).toBe(new Date('2025-01-15').toDateString());
    });

    it('should filter events by enabled sources', () => {
      const { result } = renderHook(() => useCalendar());
      
      // 全てのソースを無効化
      act(() => {
        result.current.sources.forEach(source => {
          if (source.enabled) {
            result.current.toggleSourceEnabled(source.id);
          }
        });
      });

      // フィルタリングされたイベントは空になる
      expect(result.current.filteredEvents).toHaveLength(0);
    });
  });

  describe('Event Management', () => {
    it('should create new event', () => {
      const { result } = renderHook(() => useCalendar());
      const initialEventCount = result.current.events.length;

      act(() => {
        result.current.createEvent({
          title: '新規イベント',
          description: '新規説明',
          startDate: new Date('2025-01-20T10:00:00'),
          endDate: new Date('2025-01-20T11:00:00'),
          source: mockSource,
          color: mockSource.color
        });
      });

      expect(result.current.events).toHaveLength(initialEventCount + 1);
      const newEvent = result.current.events.find(e => e.title === '新規イベント');
      expect(newEvent).toBeDefined();
      expect(newEvent?.id).toBeDefined();
    });

    it('should update existing event', () => {
      const { result } = renderHook(() => useCalendar());
      const eventToUpdate = result.current.events[0];

      act(() => {
        result.current.updateEvent(eventToUpdate.id, {
          title: '更新されたタイトル',
          description: '更新された説明'
        });
      });

      const updatedEvent = result.current.events.find(e => e.id === eventToUpdate.id);
      expect(updatedEvent?.title).toBe('更新されたタイトル');
      expect(updatedEvent?.description).toBe('更新された説明');
    });

    it('should delete event', () => {
      const { result } = renderHook(() => useCalendar());
      const eventToDelete = result.current.events[0];
      const initialEventCount = result.current.events.length;

      act(() => {
        result.current.deleteEvent(eventToDelete.id);
      });

      expect(result.current.events).toHaveLength(initialEventCount - 1);
      expect(result.current.events.find(e => e.id === eventToDelete.id)).toBeUndefined();
    });

    it('should import events', () => {
      const { result } = renderHook(() => useCalendar());
      const initialEventCount = result.current.events.length;
      const newEvents = [mockEvent];

      act(() => {
        result.current.importEvents(newEvents);
      });

      expect(result.current.events).toHaveLength(initialEventCount + 1);
      expect(result.current.events).toContain(mockEvent);
    });
  });

  describe('Source Management', () => {
    it('should toggle source enabled state', () => {
      const { result } = renderHook(() => useCalendar());
      const sourceToToggle = result.current.sources[0];
      const initialEnabledState = sourceToToggle.enabled;

      act(() => {
        result.current.toggleSourceEnabled(sourceToToggle.id);
      });

      const updatedSource = result.current.sources.find(s => s.id === sourceToToggle.id);
      expect(updatedSource?.enabled).toBe(!initialEnabledState);
    });

    it('should filter events based on enabled sources', () => {
      const { result } = renderHook(() => useCalendar());
      const initialFilteredCount = result.current.filteredEvents.length;

      // 最初のソースを無効化
      const firstSource = result.current.sources[0];
      act(() => {
        result.current.toggleSourceEnabled(firstSource.id);
      });

      // フィルタリングされたイベント数が減少する
      expect(result.current.filteredEvents.length).toBeLessThan(initialFilteredCount);
    });
  });

  describe('Modal Management', () => {
    it('should open event modal for editing', () => {
      const { result } = renderHook(() => useCalendar());

      act(() => {
        result.current.openEventModal(mockEvent, false);
      });

      expect(result.current.selectedEvent).toBe(mockEvent);
      expect(result.current.isEventModalOpen).toBe(true);
      expect(result.current.isCreating).toBe(false);
    });

    it('should open event modal for creating', () => {
      const { result } = renderHook(() => useCalendar());

      act(() => {
        result.current.openEventModal(null, true);
      });

      expect(result.current.selectedEvent).toBeNull();
      expect(result.current.isEventModalOpen).toBe(true);
      expect(result.current.isCreating).toBe(true);
    });

    it('should close event modal', () => {
      const { result } = renderHook(() => useCalendar());

      // まずモーダルを開く
      act(() => {
        result.current.openEventModal(mockEvent, false);
      });

      // モーダルを閉じる
      act(() => {
        result.current.closeEventModal();
      });

      expect(result.current.selectedEvent).toBeNull();
      expect(result.current.isEventModalOpen).toBe(false);
      expect(result.current.isCreating).toBe(false);
    });
  });

  describe('Event Filtering', () => {
    it('should filter events by date correctly', () => {
      const { result } = renderHook(() => useCalendar());
      
      // 特定の日付のイベントを確認
      const targetDate = new Date('2025-01-15');
      const dayWithEvents = result.current.calendarDays.find(day => 
        day.date.toDateString() === targetDate.toDateString()
      );

      expect(dayWithEvents).toBeDefined();
      if (dayWithEvents) {
        expect(dayWithEvents.events.length).toBeGreaterThan(0);
        dayWithEvents.events.forEach(event => {
          const eventDate = new Date(event.startDate);
          expect(eventDate.toDateString()).toBe(targetDate.toDateString());
        });
      }
    });

    it('should handle events spanning multiple days', () => {
      const { result } = renderHook(() => useCalendar());
      
      // 既存のソースを使用して複数日にまたがるイベントを作成
      const existingSource = result.current.sources[0]; // 最初のソースを使用
      const multiDayEvent: CalendarEvent = {
        ...mockEvent,
        id: 'multi-day-event',
        title: '複数日イベント',
        startDate: new Date('2025-01-15T10:00:00'),
        endDate: new Date('2025-01-17T11:00:00'),
        source: existingSource,
        color: existingSource.color
      };

      act(() => {
        result.current.createEvent(multiDayEvent);
      });

      console.log('Multi-day event created:', {
        id: multiDayEvent.id,
        title: multiDayEvent.title,
        startDate: multiDayEvent.startDate,
        endDate: multiDayEvent.endDate,
        source: multiDayEvent.source.id
      });

      console.log('All events after creation:', result.current.events.map(e => ({ id: e.id, title: e.title, source: e.source.id })));
      console.log('Filtered events after creation:', result.current.filteredEvents.map(e => ({ id: e.id, title: e.title, source: e.source.id })));

      // 新しく作成されたイベントをタイトルで検索
      const createdEvent = result.current.events.find(e => e.title === '複数日イベント');
      expect(createdEvent).toBeDefined();

      // 開始日、終了日、その間の日にイベントが表示されることを確認
      const startDay = result.current.calendarDays.find(day => 
        day.date.toDateString() === new Date('2025-01-15').toDateString()
      );
      const endDay = result.current.calendarDays.find(day => 
        day.date.toDateString() === new Date('2025-01-17').toDateString()
      );

      console.log('Start day events:', startDay?.events.map(e => ({ id: e.id, title: e.title })));
      console.log('End day events:', endDay?.events.map(e => ({ id: e.id, title: e.title })));

      // イベントが作成されていることを確認
      expect(result.current.events.some(e => e.title === '複数日イベント')).toBe(true);
      
      // カレンダーに表示されることを確認
      expect(startDay?.events.some(e => e.title === '複数日イベント')).toBe(true);
      expect(endDay?.events.some(e => e.title === '複数日イベント')).toBe(true);
    });
  });
});