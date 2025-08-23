import Tesseract from 'tesseract.js';
import { CalendarEvent, CalendarSource } from '../types/calendar';

// 画像からカレンダーイベントを抽出するための簡易パーサー
export const parseImageFile = async (
  dataUrl: string,
  source: CalendarSource
): Promise<CalendarEvent[]> => {
  try {
    const result = await Tesseract.recognize(dataUrl, 'eng');
    const text = result.data.text || '';
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l);

    const events: CalendarEvent[] = [];

    for (const line of lines) {
      // パターン: YYYY-MM-DD HH:MM [ - HH:MM ] タイトル
      const match = line.match(
        /(\d{4}[-/]\d{1,2}[-/]\d{1,2})\s+(\d{1,2}:\d{2})(?:\s*-\s*(\d{1,2}:\d{2}))?\s*(.*)/
      );

      if (match) {
        const dateStr = match[1].replace(/-/g, '/');
        const startTime = match[2];
        const endTime = match[3] || startTime;
        const title = match[4] || 'イベント';

        const startDate = new Date(`${dateStr} ${startTime}`);
        const endDate = new Date(`${dateStr} ${endTime}`);

        events.push({
          id:
            Date.now().toString() + Math.random().toString(36).substring(2, 11),
          title,
          description: '',
          startDate,
          endDate,
          source,
          color: source.color,
        });
      } else {
        // 日付のみを含む行を終日イベントとして扱う
        const dateOnly = line.match(/(\d{4}[-/]\d{1,2}[-/]\d{1,2})\s*(.*)/);
        if (dateOnly) {
          const date = new Date(dateOnly[1].replace(/-/g, '/'));
          const title = dateOnly[2] ? dateOnly[2].trim() : 'イベント';

          events.push({
            id:
              Date.now().toString() + Math.random().toString(36).substring(2, 11),
            title,
            description: '',
            startDate: date,
            endDate: date,
            source,
            color: source.color,
            allDay: true,
          });
        }
      }
    }

    return events;
  } catch (error) {
    console.error('OCR parsing error:', error);
    return [];
  }
};

export default parseImageFile;
