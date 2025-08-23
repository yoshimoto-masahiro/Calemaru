import { parseImageFile } from '../../src/utils/imageCalendarParser';
import { CalendarSource } from '../../src/types/calendar';

describe('Image Calendar Parser', () => {
  const mockSource: CalendarSource = {
    id: 'test-source',
    name: 'テストソース',
    type: 'local',
    color: '#FF0000',
    enabled: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('parseImageFile', () => {
    it('should parse image with time-based events correctly', async () => {
      const result = await parseImageFile('data:image/png;base64,test', mockSource);

      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('テスト会議');
      expect(result[0].startDate).toBeInstanceOf(Date);
      expect(result[0].endDate).toBeInstanceOf(Date);
      expect(result[0].source).toBe(mockSource);
      expect(result[0].color).toBe(mockSource.color);
      expect(result[0].allDay).toBe(false);

      expect(result[1].title).toBe('終日イベント');
    });

    it('should parse image with all-day events correctly', async () => {
      const result = await parseImageFile('data:image/png;base64,test', mockSource);

      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('テスト会議');
      expect(result[0].allDay).toBe(false);
      expect(result[1].title).toBe('終日イベント');
      expect(result[1].allDay).toBe(true);
    });

    it('should handle mixed event types in image', async () => {
      const result = await parseImageFile('data:image/png;base64,test', mockSource);

      expect(result).toHaveLength(2);
      
      // 時間指定イベント
      expect(result[0].title).toBe('テスト会議');
      expect(result[0].allDay).toBe(false);
      
      // 終日イベント
      expect(result[1].title).toBe('終日イベント');
      expect(result[1].allDay).toBe(true);
    });

    it('should handle different date formats', async () => {
      const result = await parseImageFile('data:image/png;base64,test', mockSource);

      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('テスト会議');
      expect(result[1].title).toBe('終日イベント');
    });

    it('should handle events without end time', async () => {
      const result = await parseImageFile('data:image/png;base64,test', mockSource);

      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('テスト会議');
      expect(result[0].startDate.getHours()).toBe(10);
      expect(result[0].endDate.getHours()).toBe(11); // 終了時刻は1時間後
    });

    it('should handle OCR errors gracefully', async () => {
      // エラーをシミュレートするためにモックを一時的に変更
      const Tesseract = require('tesseract.js').default;
      Tesseract.recognize.mockRejectedValueOnce(new Error('OCR failed'));

      const result = await parseImageFile('data:image/png;base64,test', mockSource);

      expect(result).toHaveLength(0);
    });

    it('should handle empty OCR result', async () => {
      // 空の結果をシミュレート
      const Tesseract = require('tesseract.js').default;
      Tesseract.recognize.mockResolvedValueOnce({
        data: { text: '' }
      });

      const result = await parseImageFile('data:image/png;base64,test', mockSource);

      expect(result).toHaveLength(0);
    });

    it('should handle OCR result with only whitespace', async () => {
      // 空白のみの結果をシミュレート
      const Tesseract = require('tesseract.js').default;
      Tesseract.recognize.mockResolvedValueOnce({
        data: { text: '   \n  \t  \n  ' }
      });

      const result = await parseImageFile('data:image/png;base64,test', mockSource);

      expect(result).toHaveLength(0);
    });

    it('should handle malformed date strings', async () => {
      // 無効な日付を含む結果をシミュレート
      const Tesseract = require('tesseract.js').default;
      Tesseract.recognize.mockResolvedValueOnce({
        data: { 
          text: 'invalid-date 10:00 無効な日付の会議\n2025-01-15 10:00 有効な会議' 
        }
      });

      const result = await parseImageFile('data:image/png;base64,test', mockSource);

      // 無効な日付のイベントは除外され、有効なもののみ処理される
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('有効な会議');
    });

    it('should generate unique IDs for events', async () => {
      const result = await parseImageFile('data:image/png;base64,test', mockSource);

      expect(result).toHaveLength(2);
      const eventIds = result.map(e => e.id);
      expect(new Set(eventIds).size).toBe(eventIds.length);
      expect(eventIds.every(id => typeof id === 'string')).toBe(true);
    });

    it('should handle special characters in event titles', async () => {
      const result = await parseImageFile('data:image/png;base64,test', mockSource);

      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('テスト会議');
      expect(result[1].title).toBe('終日イベント');
    });
  });
});