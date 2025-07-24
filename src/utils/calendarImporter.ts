import { CalendarEvent, CalendarSource, FileImportResult } from '../types/calendar';

// ICS形式のパーサー
export const parseICSFile = (content: string, source: CalendarSource): FileImportResult => {
  const events: CalendarEvent[] = [];
  const errors: string[] = [];
  
  try {
    const lines = content.split('\n').map(line => line.trim());
    let currentEvent: Partial<CalendarEvent> = {};
    let inEvent = false;
    
    for (const line of lines) {
      if (line === 'BEGIN:VEVENT') {
        inEvent = true;
        currentEvent = { source, color: source.color };
      } else if (line === 'END:VEVENT' && inEvent) {
        if (currentEvent.title && currentEvent.startDate && currentEvent.endDate) {
          events.push({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            title: currentEvent.title,
            description: currentEvent.description || '',
            startDate: currentEvent.startDate,
            endDate: currentEvent.endDate,
            source,
            color: source.color,
            allDay: currentEvent.allDay || false,
          });
        }
        inEvent = false;
        currentEvent = {};
      } else if (inEvent) {
        if (line.startsWith('SUMMARY:')) {
          currentEvent.title = line.substring(8);
        } else if (line.startsWith('DESCRIPTION:')) {
          currentEvent.description = line.substring(12);
        } else if (line.startsWith('DTSTART:')) {
          const dateStr = line.substring(8);
          currentEvent.startDate = parseICSDate(dateStr);
        } else if (line.startsWith('DTEND:')) {
          const dateStr = line.substring(6);
          currentEvent.endDate = parseICSDate(dateStr);
        }
      }
    }
  } catch (error) {
    errors.push(`ICSファイルの解析エラー: ${error}`);
  }
  
  return {
    success: events.length > 0,
    events,
    errors,
    fileName: 'ICS File'
  };
};

// CSV形式のパーサー
export const parseCSVFile = (content: string, source: CalendarSource): FileImportResult => {
  const events: CalendarEvent[] = [];
  const errors: string[] = [];
  
  try {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);
    if (lines.length < 2) {
      errors.push('CSVファイルにデータが不足しています');
      return { success: false, events: [], errors, fileName: 'CSV File' };
    }
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const titleIndex = headers.findIndex(h => h.includes('title') || h.includes('subject') || h.includes('summary'));
    const startIndex = headers.findIndex(h => h.includes('start'));
    const endIndex = headers.findIndex(h => h.includes('end'));
    const descIndex = headers.findIndex(h => h.includes('description') || h.includes('desc'));
    
    if (titleIndex === -1 || startIndex === -1) {
      errors.push('必要な列（タイトル、開始時刻）が見つかりません');
      return { success: false, events: [], errors, fileName: 'CSV File' };
    }
    
    for (let i = 1; i < lines.length; i++) {
      const columns = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
      
      try {
        const title = columns[titleIndex];
        const startDate = new Date(columns[startIndex]);
        const endDate = endIndex !== -1 ? new Date(columns[endIndex]) : new Date(startDate.getTime() + 60 * 60 * 1000);
        const description = descIndex !== -1 ? columns[descIndex] : '';
        
        if (title && !isNaN(startDate.getTime())) {
          events.push({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            title,
            description,
            startDate,
            endDate,
            source,
            color: source.color,
          });
        }
      } catch (error) {
        errors.push(`行 ${i + 1} の解析エラー: ${error}`);
      }
    }
  } catch (error) {
    errors.push(`CSVファイルの解析エラー: ${error}`);
  }
  
  return {
    success: events.length > 0,
    events,
    errors,
    fileName: 'CSV File'
  };
};

// JSON形式のパーサー
export const parseJSONFile = (content: string, source: CalendarSource): FileImportResult => {
  const events: CalendarEvent[] = [];
  const errors: string[] = [];
  
  try {
    const data = JSON.parse(content);
    const eventsArray = Array.isArray(data) ? data : data.events || [];
    
    for (const eventData of eventsArray) {
      try {
        if (eventData.title || eventData.summary) {
          events.push({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            title: eventData.title || eventData.summary,
            description: eventData.description || '',
            startDate: new Date(eventData.startDate || eventData.start),
            endDate: new Date(eventData.endDate || eventData.end || eventData.startDate || eventData.start),
            source,
            color: source.color,
            allDay: eventData.allDay || false,
          });
        }
      } catch (error) {
        errors.push(`イベントの解析エラー: ${error}`);
      }
    }
  } catch (error) {
    errors.push(`JSONファイルの解析エラー: ${error}`);
  }
  
  return {
    success: events.length > 0,
    events,
    errors,
    fileName: 'JSON File'
  };
};

// ICS日付形式のパーサー
const parseICSDate = (dateStr: string): Date => {
  // YYYYMMDDTHHMMSSZ または YYYYMMDD 形式
  if (dateStr.includes('T')) {
    const [datePart, timePart] = dateStr.split('T');
    const year = parseInt(datePart.substring(0, 4));
    const month = parseInt(datePart.substring(4, 6)) - 1;
    const day = parseInt(datePart.substring(6, 8));
    const hour = parseInt(timePart.substring(0, 2));
    const minute = parseInt(timePart.substring(2, 4));
    const second = parseInt(timePart.substring(4, 6));
    
    return new Date(year, month, day, hour, minute, second);
  } else {
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6)) - 1;
    const day = parseInt(dateStr.substring(6, 8));
    
    return new Date(year, month, day);
  }
};

// ファイル形式の判定とパース
export const importCalendarFile = (file: File, source: CalendarSource): Promise<FileImportResult> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const content = e.target?.result as string;
      let result: FileImportResult;
      
      if (file.name.toLowerCase().endsWith('.ics')) {
        result = parseICSFile(content, source);
      } else if (file.name.toLowerCase().endsWith('.csv')) {
        result = parseCSVFile(content, source);
      } else if (file.name.toLowerCase().endsWith('.json')) {
        result = parseJSONFile(content, source);
      } else {
        result = {
          success: false,
          events: [],
          errors: ['サポートされていないファイル形式です。ICS、CSV、JSONファイルをご利用ください。'],
          fileName: file.name
        };
      }
      
      result.fileName = file.name;
      resolve(result);
    };
    
    reader.onerror = () => {
      resolve({
        success: false,
        events: [],
        errors: ['ファイルの読み込みに失敗しました'],
        fileName: file.name
      });
    };
    
    reader.readAsText(file);
  });
};