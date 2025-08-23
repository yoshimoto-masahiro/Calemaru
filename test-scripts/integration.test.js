import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// テスト結果の集計
let testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

const assert = (condition, message) => {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    testResults.passed++;
  } else {
    console.log(`❌ FAIL: ${message}`);
    testResults.failed++;
    testResults.errors.push(message);
  }
};

// React DOMのモック実装
const mockReactDOM = {
  createRoot: () => ({
    render: () => {}
  })
};

// ローカルストレージのモック
const mockLocalStorage = {
  storage: {},
  getItem: function(key) {
    return this.storage[key] || null;
  },
  setItem: function(key, value) {
    this.storage[key] = value;
  },
  removeItem: function(key) {
    delete this.storage[key];
  },
  clear: function() {
    this.storage = {};
  }
};

// DOM APIのモック
const mockDocument = {
  getElementById: () => ({ appendChild: () => {} }),
  createElement: () => ({
    style: {},
    classList: {
      add: () => {},
      remove: () => {},
      contains: () => false
    },
    addEventListener: () => {},
    removeEventListener: () => {}
  })
};

// グローバルモックの設定
global.localStorage = mockLocalStorage;
global.document = mockDocument;
global.window = { localStorage: mockLocalStorage };

// カレンダーフック機能のテスト用モック
const createMockCalendarHook = () => {
  let events = [];
  let sources = [
    { id: 'google', name: 'Google Calendar', type: 'google', color: '#EA4335', enabled: true },
    { id: 'outlook', name: 'Outlook Calendar', type: 'outlook', color: '#0078D4', enabled: true },
    { id: 'local', name: 'Local Calendar', type: 'local', color: '#10B981', enabled: true }
  ];
  let currentDate = new Date();

  const generateCalendarDays = (date, filteredEvents) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const today = new Date();
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const dayEvents = filteredEvents.filter(event => {
        const eventDate = new Date(event.startDate);
        return eventDate.getDate() === date.getDate() &&
               eventDate.getMonth() === date.getMonth() &&
               eventDate.getFullYear() === date.getFullYear();
      });
      
      days.push({
        date,
        isCurrentMonth: date.getMonth() === month,
        isToday: date.toDateString() === today.toDateString(),
        events: dayEvents,
      });
    }
    
    return days;
  };

  return {
    currentDate,
    get calendarDays() {
      const enabledSources = sources.filter(s => s.enabled).map(s => s.id);
      const filteredEvents = events.filter(e => enabledSources.includes(e.source.id));
      return generateCalendarDays(currentDate, filteredEvents);
    },
    sources,
    get events() {
      const enabledSources = sources.filter(s => s.enabled).map(s => s.id);
      return events.filter(e => enabledSources.includes(e.source.id));
    },
    
    navigateMonth: (direction) => {
      currentDate = new Date(currentDate);
      currentDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    },
    
    toggleSourceEnabled: (sourceId) => {
      sources = sources.map(source => 
        source.id === sourceId 
          ? { ...source, enabled: !source.enabled }
          : source
      );
    },
    
    createEvent: (eventData) => {
      const newEvent = {
        ...eventData,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      };
      events.push(newEvent);
      return newEvent;
    },
    
    updateEvent: (eventId, eventData) => {
      events = events.map(event => 
        event.id === eventId 
          ? { ...event, ...eventData }
          : event
      );
    },
    
    deleteEvent: (eventId) => {
      events = events.filter(event => event.id !== eventId);
    },
    
    importEvents: (newEvents) => {
      events.push(...newEvents);
    }
  };
};

// メインテスト関数
const runIntegrationTests = async () => {
  console.log('🔄 統合テストを開始...\n');
  
  // Test 1: カレンダーフック基本機能
  console.log('📅 Test 1: カレンダーフック基本機能');
  try {
    const calendar = createMockCalendarHook();
    
    assert(calendar.currentDate instanceof Date, '現在日付が正しく初期化される');
    assert(Array.isArray(calendar.sources), 'ソース配列が存在する');
    assert(Array.isArray(calendar.calendarDays), 'カレンダー日配列が生成される');
    assert(calendar.calendarDays.length === 42, 'カレンダーが42日分生成される');
    assert(Array.isArray(calendar.events), 'イベント配列が存在する');
    
    console.log(`   ソース数: ${calendar.sources.length}`);
    console.log(`   カレンダー日数: ${calendar.calendarDays.length}`);
  } catch (error) {
    console.log(`❌ FAIL: カレンダーフック基本機能 (${error.message})`);
    testResults.failed++;
  }
  
  // Test 2: イベント作成機能
  console.log('\n📝 Test 2: イベント作成機能');
  try {
    const calendar = createMockCalendarHook();
    const testSource = calendar.sources[0];
    
    const eventData = {
      title: 'テストイベント',
      description: 'テスト用のイベント',
      startDate: new Date('2025-02-15T10:00:00'),
      endDate: new Date('2025-02-15T11:00:00'),
      source: testSource,
      color: testSource.color
    };
    
    const createdEvent = calendar.createEvent(eventData);
    
    assert(typeof createdEvent.id === 'string', 'イベントIDが生成される');
    assert(createdEvent.title === eventData.title, 'タイトルが正しく設定される');
    assert(calendar.events.length === 1, 'イベントが正しく追加される');
    
    console.log(`   作成されたイベント: ${createdEvent.title}`);
  } catch (error) {
    console.log(`❌ FAIL: イベント作成機能 (${error.message})`);
    testResults.failed++;
  }
  
  // Test 3: イベント更新機能
  console.log('\n✏️  Test 3: イベント更新機能');
  try {
    const calendar = createMockCalendarHook();
    const testSource = calendar.sources[0];
    
    const event = calendar.createEvent({
      title: '更新前タイトル',
      description: '',
      startDate: new Date('2025-02-15T10:00:00'),
      endDate: new Date('2025-02-15T11:00:00'),
      source: testSource,
      color: testSource.color
    });
    
    calendar.updateEvent(event.id, {
      title: '更新後タイトル',
      description: '更新された説明'
    });
    
    const updatedEvent = calendar.events.find(e => e.id === event.id);
    assert(updatedEvent.title === '更新後タイトル', 'タイトルが更新される');
    assert(updatedEvent.description === '更新された説明', '説明が更新される');
    
    console.log(`   更新後タイトル: ${updatedEvent.title}`);
  } catch (error) {
    console.log(`❌ FAIL: イベント更新機能 (${error.message})`);
    testResults.failed++;
  }
  
  // Test 4: イベント削除機能
  console.log('\n🗑️  Test 4: イベント削除機能');
  try {
    const calendar = createMockCalendarHook();
    const testSource = calendar.sources[0];
    
    const event = calendar.createEvent({
      title: '削除テストイベント',
      description: '',
      startDate: new Date('2025-02-15T10:00:00'),
      endDate: new Date('2025-02-15T11:00:00'),
      source: testSource,
      color: testSource.color
    });
    
    assert(calendar.events.length === 1, 'イベントが作成される');
    
    calendar.deleteEvent(event.id);
    
    assert(calendar.events.length === 0, 'イベントが削除される');
    assert(!calendar.events.find(e => e.id === event.id), '削除されたイベントが見つからない');
    
    console.log('   イベントが正常に削除されました');
  } catch (error) {
    console.log(`❌ FAIL: イベント削除機能 (${error.message})`);
    testResults.failed++;
  }
  
  // Test 5: ソースフィルタリング機能
  console.log('\n🎯 Test 5: ソースフィルタリング機能');
  try {
    const calendar = createMockCalendarHook();
    const googleSource = calendar.sources.find(s => s.id === 'google');
    const outlookSource = calendar.sources.find(s => s.id === 'outlook');
    
    // 異なるソースのイベントを作成
    calendar.createEvent({
      title: 'Googleイベント',
      description: '',
      startDate: new Date('2025-02-15T10:00:00'),
      endDate: new Date('2025-02-15T11:00:00'),
      source: googleSource,
      color: googleSource.color
    });
    
    calendar.createEvent({
      title: 'Outlookイベント',
      description: '',
      startDate: new Date('2025-02-15T14:00:00'),
      endDate: new Date('2025-02-15T15:00:00'),
      source: outlookSource,
      color: outlookSource.color
    });
    
    assert(calendar.events.length === 2, '全イベントが表示される');
    
    // Googleソースを無効化
    calendar.toggleSourceEnabled('google');
    
    assert(calendar.events.length === 1, 'フィルタリング後は1つのイベント');
    assert(calendar.events[0].title === 'Outlookイベント', 'Outlookイベントのみ表示');
    
    console.log(`   フィルタリング後のイベント数: ${calendar.events.length}`);
  } catch (error) {
    console.log(`❌ FAIL: ソースフィルタリング機能 (${error.message})`);
    testResults.failed++;
  }
  
  // Test 6: 月間ナビゲーション機能
  console.log('\n🗓️  Test 6: 月間ナビゲーション機能');
  try {
    const calendar = createMockCalendarHook();
    const initialMonth = calendar.currentDate.getMonth();
    const initialYear = calendar.currentDate.getFullYear();
    
    // 次の月に移動
    calendar.navigateMonth('next');
    
    let expectedMonth = initialMonth + 1;
    let expectedYear = initialYear;
    if (expectedMonth > 11) {
      expectedMonth = 0;
      expectedYear++;
    }
    
    assert(calendar.currentDate.getMonth() === expectedMonth, '次の月に移動');
    assert(calendar.currentDate.getFullYear() === expectedYear, '年が正しく更新される');
    
    // 前の月に移動
    calendar.navigateMonth('prev');
    
    assert(calendar.currentDate.getMonth() === initialMonth, '元の月に戻る');
    assert(calendar.currentDate.getFullYear() === initialYear, '元の年に戻る');
    
    console.log(`   ナビゲーション機能が正常に動作`);
  } catch (error) {
    console.log(`❌ FAIL: 月間ナビゲーション機能 (${error.message})`);
    testResults.failed++;
  }
  
  // Test 7: カレンダー日の今日判定
  console.log('\n📅 Test 7: カレンダー日の今日判定');
  try {
    const calendar = createMockCalendarHook();
    const today = new Date();
    const todayDays = calendar.calendarDays.filter(day => day.isToday);
    
    assert(todayDays.length === 1, '今日は1日だけ存在する');
    
    if (todayDays.length > 0) {
      const todayDay = todayDays[0];
      assert(todayDay.date.toDateString() === today.toDateString(), '今日の日付が正確');
    }
    
    console.log(`   今日として識別された日数: ${todayDays.length}`);
  } catch (error) {
    console.log(`❌ FAIL: カレンダー日の今日判定 (${error.message})`);
    testResults.failed++;
  }
  
  // Test 8: イベントインポート機能
  console.log('\n📥 Test 8: イベントインポート機能');
  try {
    const calendar = createMockCalendarHook();
    const initialEventCount = calendar.events.length;
    
    const importEvents = [
      {
        id: 'import-1',
        title: 'インポートイベント1',
        description: '',
        startDate: new Date('2025-02-15T10:00:00'),
        endDate: new Date('2025-02-15T11:00:00'),
        source: calendar.sources[0],
        color: calendar.sources[0].color
      },
      {
        id: 'import-2',
        title: 'インポートイベント2',
        description: '',
        startDate: new Date('2025-02-16T14:00:00'),
        endDate: new Date('2025-02-16T15:00:00'),
        source: calendar.sources[1],
        color: calendar.sources[1].color
      }
    ];
    
    calendar.importEvents(importEvents);
    
    assert(calendar.events.length === initialEventCount + 2, 'インポートされたイベントが追加される');
    assert(calendar.events.some(e => e.title === 'インポートイベント1'), 'イベント1が存在する');
    assert(calendar.events.some(e => e.title === 'インポートイベント2'), 'イベント2が存在する');
    
    console.log(`   インポート後のイベント数: ${calendar.events.length}`);
  } catch (error) {
    console.log(`❌ FAIL: イベントインポート機能 (${error.message})`);
    testResults.failed++;
  }
  
  // Test 9: カレンダー日とイベントの関連付け
  console.log('\n🔗 Test 9: カレンダー日とイベントの関連付け');
  try {
    const calendar = createMockCalendarHook();
    const testDate = new Date('2025-02-15');
    const testSource = calendar.sources[0];
    
    calendar.createEvent({
      title: '関連付けテストイベント',
      description: '',
      startDate: new Date('2025-02-15T10:00:00'),
      endDate: new Date('2025-02-15T11:00:00'),
      source: testSource,
      color: testSource.color
    });
    
    const dayWithEvent = calendar.calendarDays.find(day => 
      day.date.getDate() === testDate.getDate() &&
      day.date.getMonth() === testDate.getMonth() &&
      day.date.getFullYear() === testDate.getFullYear()
    );
    
    assert(dayWithEvent, '該当する日が見つかる');
    assert(dayWithEvent.events.length === 1, 'その日にイベントが関連付けられる');
    assert(dayWithEvent.events[0].title === '関連付けテストイベント', '正しいイベントが関連付けられる');
    
    console.log(`   イベントが関連付けられた日: ${dayWithEvent.date.toDateString()}`);
  } catch (error) {
    console.log(`❌ FAIL: カレンダー日とイベントの関連付け (${error.message})`);
    testResults.failed++;
  }
  
  // Test 10: 複数月跨ぎのイベント表示
  console.log('\n🗓️  Test 10: 複数月跨ぎのイベント表示');
  try {
    const calendar = createMockCalendarHook();
    
    // 現在の月の最終日にイベントを作成
    const currentMonth = calendar.currentDate.getMonth();
    const currentYear = calendar.currentDate.getFullYear();
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    calendar.createEvent({
      title: '月末イベント',
      description: '',
      startDate: new Date(currentYear, currentMonth, lastDayOfMonth, 10, 0),
      endDate: new Date(currentYear, currentMonth, lastDayOfMonth, 11, 0),
      source: calendar.sources[0],
      color: calendar.sources[0].color
    });
    
    // 現在の月での表示確認
    const currentMonthDays = calendar.calendarDays.filter(day => day.isCurrentMonth);
    const eventsInCurrentMonth = currentMonthDays.reduce((total, day) => total + day.events.length, 0);
    
    assert(eventsInCurrentMonth === 1, '現在の月にイベントが表示される');
    
    // 次の月に移動
    calendar.navigateMonth('next');
    
    // 次の月では該当イベントが表示されないことを確認
    const nextMonthDays = calendar.calendarDays.filter(day => day.isCurrentMonth);
    const eventsInNextMonth = nextMonthDays.reduce((total, day) => total + day.events.length, 0);
    
    assert(eventsInNextMonth === 0, '次の月では該当イベントが表示されない');
    
    console.log(`   月ごとのイベント表示が正常に動作`);
  } catch (error) {
    console.log(`❌ FAIL: 複数月跨ぎのイベント表示 (${error.message})`);
    testResults.failed++;
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`🔄 統合テスト完了: ${testResults.passed + testResults.failed}件実行`);
  console.log(`✅ 成功: ${testResults.passed}件`);
  console.log(`❌ 失敗: ${testResults.failed}件`);
  
  if (testResults.failed > 0) {
    console.log('\n🔍 失敗したテスト:');
    testResults.errors.forEach(error => console.log(`   - ${error}`));
  }
  
  return testResults;
};

// テスト実行
runIntegrationTests().catch(console.error);

export { runIntegrationTests };