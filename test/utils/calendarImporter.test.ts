import { parseICSFile, parseCSVFile, parseJSONFile } from '../../src/utils/calendarImporter';
import { CalendarSource, CalendarEvent } from '../../src/types/calendar';

describe('Calendar Importer Utils', () => {
  const mockSource: CalendarSource = {
    id: 'test-source',
    name: 'テストソース',
    type: 'local',
    color: '#FF0000',
    enabled: true
  };

  describe('parseICSFile', () => {
    it('should parse valid ICS file correctly', () => {
      const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:テスト会議
DESCRIPTION:プロジェクトの進捗確認
DTSTART:20250115T100000
DTEND:20250115T110000
END:VEVENT
END:VCALENDAR`;

      const result = parseICSFile(icsContent, mockSource);

      expect(result.success).toBe(true);
      expect(result.events).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
      expect(result.fileName).toBe('ICS File');

      const event = result.events[0];
      expect(event.title).toBe('テスト会議');
      expect(event.description).toBe('プロジェクトの進捗確認');
      expect(event.startDate).toBeInstanceOf(Date);
      expect(event.endDate).toBeInstanceOf(Date);
      expect(event.source).toBe(mockSource);
      expect(event.color).toBe(mockSource.color);
    });

    it('should handle multiple events in ICS file', () => {
      const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:会議1
DTSTART:20250115T100000
DTEND:20250115T110000
END:VEVENT
BEGIN:VEVENT
SUMMARY:会議2
DTSTART:20250116T140000
DTEND:20250116T150000
END:VEVENT
END:VCALENDAR`;

      const result = parseICSFile(icsContent, mockSource);

      expect(result.success).toBe(true);
      expect(result.events).toHaveLength(2);
      expect(result.events[0].title).toBe('会議1');
      expect(result.events[1].title).toBe('会議2');
    });

    it('should handle ICS parsing errors gracefully', () => {
      const invalidICS = 'INVALID:ICS:CONTENT';
      const result = parseICSFile(invalidICS, mockSource);

      expect(result.success).toBe(false);
      expect(result.events).toHaveLength(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle empty ICS file', () => {
      const emptyICS = '';
      const result = parseICSFile(emptyICS, mockSource);

      expect(result.success).toBe(false);
      expect(result.events).toHaveLength(0);
    });
  });

  describe('parseCSVFile', () => {
    it('should parse valid CSV file correctly', () => {
      const csvContent = `Title,Start,End,Description
テスト会議,2025-01-15 10:00,2025-01-15 11:00,プロジェクト会議
医者の予約,2025-01-16 14:30,2025-01-16 15:30,定期健診`;

      const result = parseCSVFile(csvContent, mockSource);

      expect(result.success).toBe(true);
      expect(result.events).toHaveLength(2);
      expect(result.errors).toHaveLength(0);

      const firstEvent = result.events[0];
      expect(firstEvent.title).toBe('テスト会議');
      expect(firstEvent.description).toBe('プロジェクト会議');
      expect(firstEvent.startDate).toBeInstanceOf(Date);
      expect(firstEvent.endDate).toBeInstanceOf(Date);
    });

    it('should handle CSV with different column names', () => {
      const csvContent = `Subject,Start Time,End Time,Notes
会議,2025-01-15 10:00,2025-01-15 11:00,重要`;

      const result = parseCSVFile(csvContent, mockSource);

      expect(result.success).toBe(true);
      expect(result.events).toHaveLength(1);
      expect(result.events[0].title).toBe('会議');
    });

    it('should handle CSV with missing end time', () => {
      const csvContent = `Title,Start,Description
会議,2025-01-15 10:00,テスト`;

      const result = parseCSVFile(csvContent, mockSource);

      expect(result.success).toBe(true);
      expect(result.events).toHaveLength(1);
      
      const event = result.events[0];
      const expectedEndTime = new Date(event.startDate.getTime() + 60 * 60 * 1000);
      expect(event.endDate.getTime()).toBe(expectedEndTime.getTime());
    });

    it('should handle CSV with missing required columns', () => {
      const csvContent = `Description,Notes
テスト,説明`;

      const result = parseCSVFile(csvContent, mockSource);

      expect(result.success).toBe(false);
      expect(result.events).toHaveLength(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle empty CSV file', () => {
      const emptyCSV = '';
      const result = parseCSVFile(emptyCSV, mockSource);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('parseJSONFile', () => {
    it('should parse valid JSON file correctly', () => {
      const jsonContent = JSON.stringify([
        {
          title: 'テスト会議',
          description: 'プロジェクト会議',
          startDate: '2025-01-15T10:00:00',
          endDate: '2025-01-15T11:00:00'
        }
      ]);

      const result = parseJSONFile(jsonContent, mockSource);

      expect(result.success).toBe(true);
      expect(result.events).toHaveLength(1);
      expect(result.errors).toHaveLength(0);

      const event = result.events[0];
      expect(event.title).toBe('テスト会議');
      expect(event.description).toBe('プロジェクト会議');
      expect(event.startDate).toBeInstanceOf(Date);
      expect(event.endDate).toBeInstanceOf(Date);
    });

    it('should handle JSON with missing optional fields', () => {
      const jsonContent = JSON.stringify([
        {
          title: 'シンプルな会議',
          startDate: '2025-01-15T10:00:00'
        }
      ]);

      const result = parseJSONFile(jsonContent, mockSource);

      expect(result.success).toBe(true);
      expect(result.events).toHaveLength(1);
      
      const event = result.events[0];
      expect(event.title).toBe('シンプルな会議');
      expect(event.description).toBe('');
      expect(event.endDate.getTime()).toBe(event.startDate.getTime() + 60 * 60 * 1000);
    });

    it('should handle invalid JSON gracefully', () => {
      const invalidJSON = '{ invalid json }';
      const result = parseJSONFile(invalidJSON, mockSource);

      expect(result.success).toBe(false);
      expect(result.events).toHaveLength(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle empty JSON array', () => {
      const emptyJSON = '[]';
      const result = parseJSONFile(emptyJSON, mockSource);

      expect(result.success).toBe(false);
      expect(result.events).toHaveLength(0);
    });
  });

  describe('Edge Cases', () => {
    it('should generate unique IDs for events', () => {
      const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:会議1
DTSTART:20250115T100000
DTEND:20250115T110000
END:VEVENT
BEGIN:VEVENT
SUMMARY:会議2
DTSTART:20250115T140000
DTEND:20250115T150000
END:VEVENT
END:VCALENDAR`;

      const result = parseICSFile(icsContent, mockSource);
      const eventIds = result.events.map(e => e.id);

      expect(new Set(eventIds).size).toBe(eventIds.length);
      expect(eventIds.every(id => typeof id === 'string')).toBe(true);
    });

    it('should handle special characters in event titles', () => {
      const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:特殊文字テスト: !@#$%^&*()_+
DESCRIPTION:説明文: 改行\\nタブ\\t
DTSTART:20250115T100000
DTEND:20250115T110000
END:VEVENT
END:VCALENDAR`;

      const result = parseICSFile(icsContent, mockSource);

      expect(result.success).toBe(true);
      expect(result.events).toHaveLength(1);
      expect(result.events[0].title).toBe('特殊文字テスト: !@#$%^&*()_+');
    });
  });
});