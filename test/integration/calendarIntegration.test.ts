import { parseICSFile, parseCSVFile, parseJSONFile } from '../../src/utils/calendarImporter';
import { parseImageFile } from '../../src/utils/imageCalendarParser';
import { useCalendar } from '../../src/hooks/useCalendar';
import { renderHook, act } from '@testing-library/react';
import { CalendarSource } from '../../src/types/calendar';

describe('Calendar Integration Tests', () => {
  const mockSource: CalendarSource = {
    id: 'integration-test',
    name: '統合テストソース',
    type: 'local',
    color: '#00FF00',
    enabled: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('End-to-End Import Workflow', () => {
    it('should import ICS file and add to calendar', () => {
      const { result } = renderHook(() => useCalendar());
      const initialEventCount = result.current.events.length;

      // ICSファイルをパース
      const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:統合テスト会議
DESCRIPTION:ICSファイルからのインポートテスト
DTSTART:20250120T100000
DTEND:20250120T110000
END:VEVENT
END:VCALENDAR`;

      const importResult = parseICSFile(icsContent, mockSource);
      expect(importResult.success).toBe(true);
      expect(importResult.events).toHaveLength(1);

      // カレンダーにイベントを追加
      act(() => {
        result.current.importEvents(importResult.events);
      });

      expect(result.current.events).toHaveLength(initialEventCount + 1);
      
      const importedEvent = result.current.events.find(e => e.title === '統合テスト会議');
      expect(importedEvent).toBeDefined();
      expect(importedEvent?.source.id).toBe(mockSource.id);
    });

    it('should import CSV file and add to calendar', () => {
      const { result } = renderHook(() => useCalendar());
      const initialEventCount = result.current.events.length;

      // CSVファイルをパース
      const csvContent = `Title,Start,End,Description
統合テストCSV,2025-01-21 10:00,2025-01-21 11:00,CSVファイルからのインポートテスト`;

      const importResult = parseCSVFile(csvContent, mockSource);
      expect(importResult.success).toBe(true);
      expect(importResult.events).toHaveLength(1);

      // カレンダーにイベントを追加
      act(() => {
        result.current.importEvents(importResult.events);
      });

      expect(result.current.events).toHaveLength(initialEventCount + 1);
      
      const importedEvent = result.current.events.find(e => e.title === '統合テストCSV');
      expect(importedEvent).toBeDefined();
      expect(importedEvent?.source.id).toBe(mockSource.id);
    });

    it('should import JSON file and add to calendar', () => {
      const { result } = renderHook(() => useCalendar());
      const initialEventCount = result.current.events.length;

      // JSONファイルをパース
      const jsonContent = JSON.stringify([
        {
          title: '統合テストJSON',
          description: 'JSONファイルからのインポートテスト',
          startDate: '2025-01-22T10:00:00',
          endDate: '2025-01-22T11:00:00'
        }
      ]);

      const importResult = parseJSONFile(jsonContent, mockSource);
      expect(importResult.success).toBe(true);
      expect(importResult.events).toHaveLength(1);

      // カレンダーにイベントを追加
      act(() => {
        result.current.importEvents(importResult.events);
      });

      expect(result.current.events).toHaveLength(initialEventCount + 1);
      
      const importedEvent = result.current.events.find(e => e.title === '統合テストJSON');
      expect(importedEvent).toBeDefined();
      expect(importedEvent?.source.id).toBe(mockSource.id);
    });

    it('should import image file and add to calendar', async () => {
      const { result } = renderHook(() => useCalendar());
      const initialEventCount = result.current.events.length;

      // 画像ファイルをパース
      const imageEvents = await parseImageFile('data:image/png;base64,test', mockSource);
      expect(imageEvents).toHaveLength(2);

      // カレンダーにイベントを追加
      act(() => {
        result.current.importEvents(imageEvents);
      });

      expect(result.current.events).toHaveLength(initialEventCount + 2);
      
      const importedEvent1 = result.current.events.find(e => e.title === 'テスト会議');
      const importedEvent2 = result.current.events.find(e => e.title === '終日イベント');
      expect(importedEvent1).toBeDefined();
      expect(importedEvent2).toBeDefined();
      expect(importedEvent1?.source.id).toBe(mockSource.id);
      expect(importedEvent2?.source.id).toBe(mockSource.id);
    });
  });

  describe('Multi-Format Import', () => {
    it('should handle multiple file formats in sequence', async () => {
      const { result } = renderHook(() => useCalendar());
      const initialEventCount = result.current.events.length;

      // ICSファイルをインポート
      const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:ICS会議
DTSTART:20250123T100000
DTEND:20250123T110000
END:VEVENT
END:VCALENDAR`;

      const icsResult = parseICSFile(icsContent, mockSource);
      act(() => {
        result.current.importEvents(icsResult.events);
      });

      // CSVファイルをインポート
      const csvContent = `Title,Start,End
CSV会議,2025-01-24 10:00,2025-01-24 11:00`;

      const csvResult = parseCSVFile(csvContent, mockSource);
      act(() => {
        result.current.importEvents(csvResult.events);
      });

      // JSONファイルをインポート
      const jsonContent = JSON.stringify([
        {
          title: 'JSON会議',
          startDate: '2025-01-25T10:00:00',
          endDate: '2025-01-25T11:00:00'
        }
      ]);

      const jsonResult = parseJSONFile(jsonContent, mockSource);
      act(() => {
        result.current.importEvents(jsonResult.events);
      });

      // 画像ファイルをインポート
      const imageEvents = await parseImageFile('data:image/png;base64,test', mockSource);
      act(() => {
        result.current.importEvents(imageEvents);
      });

      // 全てのイベントが正しくインポートされていることを確認
      expect(result.current.events).toHaveLength(initialEventCount + 5); // ICS:1 + CSV:1 + JSON:1 + Image:2 = 5

      const importedTitles = ['ICS会議', 'CSV会議', 'JSON会議', 'テスト会議', '終日イベント'];
      importedTitles.forEach(title => {
        const event = result.current.events.find(e => e.title === title);
        expect(event).toBeDefined();
        expect(event?.source.id).toBe(mockSource.id);
      });
    });
  });

  describe('Source Management Integration', () => {
    it('should filter imported events based on source enabled state', async () => {
      const { result } = renderHook(() => useCalendar());
      
      // 新しいソースを作成
      const newSource: CalendarSource = {
        id: 'filter-test',
        name: 'フィルターテスト',
        type: 'local',
        color: '#FF00FF',
        enabled: true
      };

      // 新しいソースを追加
      act(() => {
        result.current.addSource(newSource);
      });

      console.log('Sources after adding new source:', result.current.sources.map(s => ({ id: s.id, enabled: s.enabled })));

      // 新しいソースでイベントをインポート
      const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:フィルターテスト会議
DTSTART:20250126T100000
DTEND:20250126T110000
END:VEVENT
END:VCALENDAR`;

      const importResult = parseICSFile(icsContent, newSource);
      act(() => {
        result.current.importEvents(importResult.events);
      });

      console.log('Events after import:', result.current.events.map(e => ({ title: e.title, source: e.source.id })));
      console.log('Filtered events after import:', result.current.filteredEvents.map(e => ({ title: e.title, source: e.source.id })));

      // ソースを無効化
      act(() => {
        result.current.toggleSourceEnabled(newSource.id);
      });

      console.log('Sources after disabling:', result.current.sources.map(s => ({ id: s.id, enabled: s.enabled })));

      // フィルタリングされたイベントから除外される
      const filteredEvents = result.current.filteredEvents;
      const importedEvent = filteredEvents.find(e => e.title === 'フィルターテスト会議');
      expect(importedEvent).toBeUndefined();

      // ソースを再有効化
      act(() => {
        result.current.toggleSourceEnabled(newSource.id);
      });

      console.log('Sources after re-enabling:', result.current.sources.map(s => ({ id: s.id, enabled: s.enabled })));

      // フィルタリングされたイベントに再表示される
      const reFilteredEvents = result.current.filteredEvents;
      const reImportedEvent = reFilteredEvents.find(e => e.title === 'フィルターテスト会議');
      
      // デバッグ情報を追加
      console.log('Re-enabled source events:', reFilteredEvents.map(e => ({ title: e.title, source: e.source.id })));
      console.log('Looking for event:', 'フィルターテスト会議');
      
      expect(reImportedEvent).toBeDefined();
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle import errors gracefully and continue operation', () => {
      const { result } = renderHook(() => useCalendar());
      const initialEventCount = result.current.events.length;

      // 無効なICSファイル
      const invalidICS = 'INVALID:ICS:CONTENT';
      const icsResult = parseICSFile(invalidICS, mockSource);
      expect(icsResult.success).toBe(false);

      // 有効なICSファイル
      const validICS = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:有効な会議
DTSTART:20250127T100000
DTEND:20250127T110000
END:VEVENT
END:VCALENDAR`;

      const validICSResult = parseICSFile(validICS, mockSource);
      expect(validICSResult.success).toBe(true);

      // 有効なイベントのみをインポート
      act(() => {
        result.current.importEvents(validICSResult.events);
      });

      expect(result.current.events).toHaveLength(initialEventCount + 1);
      
      const importedEvent = result.current.events.find(e => e.title === '有効な会議');
      expect(importedEvent).toBeDefined();
    });

    it('should handle mixed success and failure scenarios', async () => {
      const { result } = renderHook(() => useCalendar());
      const initialEventCount = result.current.events.length;

      // 無効なCSV
      const invalidCSV = 'Invalid,CSV,Content';
      const csvResult = parseCSVFile(invalidCSV, mockSource);
      expect(csvResult.success).toBe(false);

      // 有効なJSON
      const validJSON = JSON.stringify([
        {
          title: '有効なJSON会議',
          startDate: '2025-01-28T10:00:00',
          endDate: '2025-01-28T11:00:00'
        }
      ]);

      const jsonResult = parseJSONFile(validJSON, mockSource);
      expect(jsonResult.success).toBe(true);

      // 有効なイベントのみをインポート
      act(() => {
        result.current.importEvents(jsonResult.events);
      });

      expect(result.current.events).toHaveLength(initialEventCount + 1);
      
      const importedEvent = result.current.events.find(e => e.title === '有効なJSON会議');
      expect(importedEvent).toBeDefined();
    });
  });

  describe('Data Consistency', () => {
    it('should maintain data consistency across different import methods', () => {
      const { result } = renderHook(() => useCalendar());
      
      // 同じ内容のイベントを異なる形式でインポート
      const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:一貫性テスト
DTSTART:20250129T100000
DTEND:20250129T110000
END:VEVENT
END:VCALENDAR`;

      const csvContent = `Title,Start,End
一貫性テスト,2025-01-29 10:00,2025-01-29 11:00`;

      const jsonContent = JSON.stringify([
        {
          title: '一貫性テスト',
          startDate: '2025-01-29T10:00:00',
          endDate: '2025-01-29T11:00:00'
        }
      ]);

      // 全ての形式でインポート
      const icsResult = parseICSFile(icsContent, mockSource);
      const csvResult = parseCSVFile(csvContent, mockSource);
      const jsonResult = parseJSONFile(jsonContent, mockSource);

      act(() => {
        result.current.importEvents([
          ...icsResult.events,
          ...csvResult.events,
          ...jsonResult.events
        ]);
      });

      // 同じタイトルのイベントが3つ作成される
      const consistencyEvents = result.current.events.filter(e => e.title === '一貫性テスト');
      expect(consistencyEvents).toHaveLength(3);

      // 全てのイベントが同じ日時を持つ
      consistencyEvents.forEach(event => {
        expect(event.startDate.getTime()).toBe(new Date('2025-01-29T10:00:00').getTime());
        // 終了時刻は1時間後（デフォルト設定）
        expect(event.endDate.getTime()).toBe(new Date('2025-01-29T11:00:00').getTime());
        expect(event.source.id).toBe(mockSource.id);
      });
    });
  });
});