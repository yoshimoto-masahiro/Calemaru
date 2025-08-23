import { CalendarEvent, CalendarSource, CalendarDay, ImportedCalendarData, FileImportResult } from '../../src/types/calendar';

describe('Calendar Types', () => {
  describe('CalendarEvent', () => {
    it('should have all required properties', () => {
      const event: CalendarEvent = {
        id: 'test-1',
        title: 'テストイベント',
        description: 'テスト説明',
        startDate: new Date('2025-01-15T10:00:00'),
        endDate: new Date('2025-01-15T11:00:00'),
        source: {
          id: 'google',
          name: 'Google Calendar',
          type: 'google',
          color: '#EA4335',
          enabled: true
        },
        color: '#EA4335',
        allDay: false
      };

      expect(event.id).toBe('test-1');
      expect(event.title).toBe('テストイベント');
      expect(event.description).toBe('テスト説明');
      expect(event.startDate).toBeInstanceOf(Date);
      expect(event.endDate).toBeInstanceOf(Date);
      expect(event.source).toBeDefined();
      expect(event.color).toBe('#EA4335');
      expect(event.allDay).toBe(false);
    });

    it('should allow optional allDay property', () => {
      const event: CalendarEvent = {
        id: 'test-2',
        title: '終日イベント',
        description: '',
        startDate: new Date('2025-01-16'),
        endDate: new Date('2025-01-16'),
        source: {
          id: 'local',
          name: 'ローカルカレンダー',
          type: 'local',
          color: '#10B981',
          enabled: true
        },
        color: '#10B981'
        // allDay is optional
      };

      expect(event.allDay).toBeUndefined();
    });
  });

  describe('CalendarSource', () => {
    it('should have valid type values', () => {
      const validTypes = ['google', 'outlook', 'apple', 'local'] as const;
      
      validTypes.forEach(type => {
        const source: CalendarSource = {
          id: `test-${type}`,
          name: `Test ${type}`,
          type,
          color: '#000000',
          enabled: true
        };

        expect(source.type).toBe(type);
        expect(validTypes).toContain(source.type);
      });
    });

    it('should have required properties', () => {
      const source: CalendarSource = {
        id: 'test-source',
        name: 'テストソース',
        type: 'local',
        color: '#FF0000',
        enabled: false
      };

      expect(source.id).toBe('test-source');
      expect(source.name).toBe('テストソース');
      expect(source.type).toBe('local');
      expect(source.color).toBe('#FF0000');
      expect(source.enabled).toBe(false);
    });
  });

  describe('CalendarDay', () => {
    it('should have correct structure', () => {
      const day: CalendarDay = {
        date: new Date('2025-01-15'),
        isCurrentMonth: true,
        isToday: false,
        events: []
      };

      expect(day.date).toBeInstanceOf(Date);
      expect(typeof day.isCurrentMonth).toBe('boolean');
      expect(typeof day.isToday).toBe('boolean');
      expect(Array.isArray(day.events)).toBe(true);
    });
  });

  describe('ImportedCalendarData', () => {
    it('should contain events and source', () => {
      const importedData: ImportedCalendarData = {
        events: [],
        source: {
          id: 'imported',
          name: 'インポートされたカレンダー',
          type: 'local',
          color: '#00FF00',
          enabled: true
        }
      };

      expect(Array.isArray(importedData.events)).toBe(true);
      expect(importedData.source).toBeDefined();
    });
  });

  describe('FileImportResult', () => {
    it('should have success status and results', () => {
      const result: FileImportResult = {
        success: true,
        events: [],
        errors: [],
        fileName: 'test.ics'
      };

      expect(typeof result.success).toBe('boolean');
      expect(Array.isArray(result.events)).toBe(true);
      expect(Array.isArray(result.errors)).toBe(true);
      expect(typeof result.fileName).toBe('string');
    });
  });
});