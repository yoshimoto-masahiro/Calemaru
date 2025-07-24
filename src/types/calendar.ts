export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  source: CalendarSource;
  color: string;
  allDay?: boolean;
}

export interface CalendarSource {
  id: string;
  name: string;
  type: 'google' | 'outlook' | 'apple' | 'local';
  color: string;
  enabled: boolean;
}

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

export interface ImportedCalendarData {
  events: CalendarEvent[];
  source: CalendarSource;
}

export interface FileImportResult {
  success: boolean;
  events: CalendarEvent[];
  errors: string[];
  fileName: string;
}