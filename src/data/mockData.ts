import { CalendarEvent, CalendarSource } from '../types/calendar';

export const calendarSources: CalendarSource[] = [
  {
    id: 'google',
    name: 'Google Calendar',
    type: 'google',
    color: '#EA4335',
    enabled: true,
  },
  {
    id: 'outlook',
    name: 'Outlook Calendar',
    type: 'outlook',
    color: '#0078D4',
    enabled: true,
  },
  {
    id: 'apple',
    name: 'Apple Calendar',
    type: 'apple',
    color: '#8E8E93',
    enabled: true,
  },
  {
    id: 'local',
    name: 'ローカルカレンダー',
    type: 'local',
    color: '#10B981',
    enabled: true,
  },
];

export const mockEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'チーム会議',
    description: 'プロジェクトの進捗確認',
    startDate: new Date(2025, 0, 15, 10, 0),
    endDate: new Date(2025, 0, 15, 11, 0),
    source: calendarSources[0],
    color: calendarSources[0].color,
  },
  {
    id: '2',
    title: '医者の予約',
    description: '定期健診',
    startDate: new Date(2025, 0, 16, 14, 30),
    endDate: new Date(2025, 0, 16, 15, 30),
    source: calendarSources[1],
    color: calendarSources[1].color,
  },
  {
    id: '3',
    title: '友人との食事',
    description: '久しぶりの再会',
    startDate: new Date(2025, 0, 18, 19, 0),
    endDate: new Date(2025, 0, 18, 21, 0),
    source: calendarSources[2],
    color: calendarSources[2].color,
  },
  {
    id: '4',
    title: 'ヨガクラス',
    description: '週例のヨガ',
    startDate: new Date(2025, 0, 20, 8, 0),
    endDate: new Date(2025, 0, 20, 9, 0),
    source: calendarSources[3],
    color: calendarSources[3].color,
  },
  {
    id: '5',
    title: 'プレゼンテーション',
    description: 'クライアント向け提案',
    startDate: new Date(2025, 0, 22, 13, 0),
    endDate: new Date(2025, 0, 22, 14, 0),
    source: calendarSources[0],
    color: calendarSources[0].color,
  },
  {
    id: '6',
    title: '勉強会',
    description: '新技術の学習',
    startDate: new Date(2025, 0, 25, 15, 0),
    endDate: new Date(2025, 0, 25, 17, 0),
    source: calendarSources[3],
    color: calendarSources[3].color,
  },
];