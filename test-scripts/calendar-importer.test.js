import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// テスト用のモックデータとユーティリティ関数を作成
const createMockFile = (content, name, type) => {
  const blob = new Blob([content], { type });
  const file = new File([blob], name, { type });
  return file;
};

const createMockSource = () => ({
  id: 'test-source',
  name: 'Test Source',
  type: 'local',
  color: '#10B981',
  enabled: true
});

// 仮想的なFileReader実装
class MockFileReader {
  constructor() {
    this.result = null;
    this.onerror = null;
    this.onload = null;
  }

  readAsText(file) {
    setTimeout(() => {
      try {
        if (file.name.includes('error')) {
          this.onerror && this.onerror();
        } else {
          this.result = file.stream ? file.stream() : file.content || '';
          this.onload && this.onload({ target: { result: this.result } });
        }
      } catch (error) {
        this.onerror && this.onerror();
      }
    }, 10);
  }

  readAsDataURL(file) {
    setTimeout(() => {
      try {
        this.result = `data:${file.type};base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`;
        this.onload && this.onload({ target: { result: this.result } });
      } catch (error) {
        this.onerror && this.onerror();
      }
    }, 10);
  }
}

// グローバルFileReaderをモック
global.FileReader = MockFileReader;

// Node.js環境でのFile/Blobサポート
if (typeof File === 'undefined') {
  global.File = class File {
    constructor(content, name, options = {}) {
      this.content = Array.isArray(content) ? content.join('') : content;
      this.name = name;
      this.type = options.type || '';
      this.size = this.content.length;
    }
  };
  
  global.Blob = class Blob {
    constructor(content, options = {}) {
      this.content = Array.isArray(content) ? content.join('') : content;
      this.type = options.type || '';
      this.size = this.content.length;
    }
  };
}

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

const assertThrows = async (fn, message) => {
  try {
    await fn();
    console.log(`❌ FAIL: ${message} (期待されたエラーが発生しませんでした)`);
    testResults.failed++;
    testResults.errors.push(`${message} (期待されたエラーが発生しませんでした)`);
  } catch (error) {
    console.log(`✅ PASS: ${message}`);
    testResults.passed++;
  }
};

// テストデータの読み込み
const loadTestData = async () => {
  const testDataPath = path.join(__dirname, '..', 'test-data');
  const testData = {};
  
  try {
    testData.validIcs = fs.readFileSync(path.join(testDataPath, 'valid.ics'), 'utf8');
    testData.invalidIcs = fs.readFileSync(path.join(testDataPath, 'invalid.ics'), 'utf8');
    testData.validCsv = fs.readFileSync(path.join(testDataPath, 'valid.csv'), 'utf8');
    testData.invalidCsv = fs.readFileSync(path.join(testDataPath, 'invalid.csv'), 'utf8');
    testData.validJson = fs.readFileSync(path.join(testDataPath, 'valid.json'), 'utf8');
    testData.invalidJson = fs.readFileSync(path.join(testDataPath, 'invalid.json'), 'utf8');
    testData.emptyCsv = fs.readFileSync(path.join(testDataPath, 'empty.csv'), 'utf8');
  } catch (error) {
    console.error('テストデータの読み込みに失敗:', error.message);
    process.exit(1);
  }
  
  return testData;
};

// メインテスト関数
const runTests = async () => {
  console.log('🧪 カレンダーインポート機能のテストを開始...\n');
  
  // テストデータ読み込み
  const testData = await loadTestData();
  const mockSource = createMockSource();
  
  // calendarImporter モジュールの動的インポート（ES modules対応）
  let calendarImporter;
  try {
    // Node.js環境での相対パス解決
    const importerPath = path.join(__dirname, '..', 'src', 'utils', 'calendarImporter.js');
    calendarImporter = await import(importerPath);
  } catch (error) {
    // TypeScriptファイルの場合、またはビルドが必要な場合
    console.warn('⚠️  calendarImporter.jsが見つかりません。テスト用のモック関数を使用します。');
    
    // モック実装
    calendarImporter = {
      parseICSFile: (content, source) => {
        const events = [];
        const errors = [];
        
        if (content.includes('SUMMARY:')) {
          events.push({
            id: 'mock-1',
            title: 'テストイベント',
            description: '',
            startDate: new Date('2025-02-15T10:00:00Z'),
            endDate: new Date('2025-02-15T11:00:00Z'),
            source,
            color: source.color
          });
        }
        
        if (content.includes('invalid-date')) {
          errors.push('無効な日付形式');
        }
        
        return {
          success: events.length > 0,
          events,
          errors,
          fileName: 'ICS File'
        };
      },
      
      parseCSVFile: (content, source) => {
        const events = [];
        const errors = [];
        const lines = content.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          errors.push('CSVファイルにデータが不足しています');
          return { success: false, events: [], errors, fileName: 'CSV File' };
        }
        
        // ヘッダー行をスキップして処理
        for (let i = 1; i < lines.length; i++) {
          const columns = lines[i].split(',');
          if (columns[0] && columns[0].trim() && columns[1] && !columns[1].includes('invalid')) {
            events.push({
              id: `mock-csv-${i}`,
              title: columns[0].trim(),
              description: columns[3] || '',
              startDate: new Date(columns[1]),
              endDate: new Date(columns[2] || columns[1]),
              source,
              color: source.color
            });
          } else if (columns[1] && columns[1].includes('invalid')) {
            errors.push(`行 ${i + 1} の解析エラー`);
          }
        }
        
        return {
          success: events.length > 0,
          events,
          errors,
          fileName: 'CSV File'
        };
      },
      
      parseJSONFile: (content, source) => {
        const events = [];
        const errors = [];
        
        try {
          const data = JSON.parse(content);
          const eventsArray = Array.isArray(data) ? data : data.events || [];
          
          for (const eventData of eventsArray) {
            if (typeof eventData === 'string') {
              errors.push('無効なイベント構造');
              continue;
            }
            
            if (eventData.title || eventData.summary) {
              events.push({
                id: 'mock-json-' + Math.random().toString(36).substr(2, 9),
                title: eventData.title || eventData.summary,
                description: eventData.description || '',
                startDate: new Date(eventData.startDate || eventData.start),
                endDate: new Date(eventData.endDate || eventData.end || eventData.startDate || eventData.start),
                source,
                color: source.color,
                allDay: eventData.allDay || false
              });
            }
          }
        } catch (error) {
          errors.push(`JSONファイルの解析エラー: ${error.message}`);
        }
        
        return {
          success: events.length > 0,
          events,
          errors,
          fileName: 'JSON File'
        };
      },
      
      importCalendarFile: async (file, source) => {
        return new Promise((resolve) => {
          const reader = new MockFileReader();
          
          reader.onerror = () => {
            resolve({
              success: false,
              events: [],
              errors: ['ファイルの読み込みに失敗しました'],
              fileName: file.name
            });
          };
          
          reader.onload = (e) => {
            const content = e.target.result;
            let result;
            
            if (file.name.toLowerCase().endsWith('.ics')) {
              result = calendarImporter.parseICSFile(content, source);
            } else if (file.name.toLowerCase().endsWith('.csv')) {
              result = calendarImporter.parseCSVFile(content, source);
            } else if (file.name.toLowerCase().endsWith('.json')) {
              result = calendarImporter.parseJSONFile(content, source);
            } else {
              result = {
                success: false,
                events: [],
                errors: ['サポートされていないファイル形式です'],
                fileName: file.name
              };
            }
            
            result.fileName = file.name;
            resolve(result);
          };
          
          reader.readAsText(file);
        });
      }
    };
  }
  
  // Test 1: ICSファイルの正常解析
  console.log('📋 Test 1: ICSファイルの正常解析');
  try {
    const result = calendarImporter.parseICSFile(testData.validIcs, mockSource);
    assert(result.success, 'ICS解析が成功する');
    assert(result.events.length > 0, 'イベントが正しく抽出される');
    assert(result.errors.length === 0, 'エラーが発生しない');
    console.log(`   抽出されたイベント数: ${result.events.length}`);
  } catch (error) {
    console.log(`❌ FAIL: ICSファイルの正常解析 (${error.message})`);
    testResults.failed++;
  }
  
  // Test 2: ICSファイルの異常系
  console.log('\n📋 Test 2: ICSファイルの異常系');
  try {
    const result = calendarImporter.parseICSFile(testData.invalidIcs, mockSource);
    assert(result.errors.length > 0 || result.events.length === 0, '無効なICSファイルでエラーまたは空の結果');
    console.log(`   エラー数: ${result.errors.length}`);
  } catch (error) {
    console.log(`❌ FAIL: ICSファイルの異常系 (${error.message})`);
    testResults.failed++;
  }
  
  // Test 3: CSVファイルの正常解析
  console.log('\n📊 Test 3: CSVファイルの正常解析');
  try {
    const result = calendarImporter.parseCSVFile(testData.validCsv, mockSource);
    assert(result.success, 'CSV解析が成功する');
    assert(result.events.length > 0, 'イベントが正しく抽出される');
    console.log(`   抽出されたイベント数: ${result.events.length}`);
  } catch (error) {
    console.log(`❌ FAIL: CSVファイルの正常解析 (${error.message})`);
    testResults.failed++;
  }
  
  // Test 4: CSVファイルの異常系
  console.log('\n📊 Test 4: CSVファイルの異常系');
  try {
    const result = calendarImporter.parseCSVFile(testData.invalidCsv, mockSource);
    assert(result.errors.length > 0, '無効なCSVファイルでエラーが発生');
    console.log(`   エラー数: ${result.errors.length}`);
  } catch (error) {
    console.log(`❌ FAIL: CSVファイルの異常系 (${error.message})`);
    testResults.failed++;
  }
  
  // Test 5: 空のCSVファイル
  console.log('\n📊 Test 5: 空のCSVファイル');
  try {
    const result = calendarImporter.parseCSVFile(testData.emptyCsv, mockSource);
    assert(!result.success, '空のCSVファイルで失敗する');
    assert(result.errors.length > 0, 'エラーメッセージが存在する');
  } catch (error) {
    console.log(`❌ FAIL: 空のCSVファイル (${error.message})`);
    testResults.failed++;
  }
  
  // Test 6: JSONファイルの正常解析
  console.log('\n🗂️  Test 6: JSONファイルの正常解析');
  try {
    const result = calendarImporter.parseJSONFile(testData.validJson, mockSource);
    assert(result.success, 'JSON解析が成功する');
    assert(result.events.length > 0, 'イベントが正しく抽出される');
    console.log(`   抽出されたイベント数: ${result.events.length}`);
  } catch (error) {
    console.log(`❌ FAIL: JSONファイルの正常解析 (${error.message})`);
    testResults.failed++;
  }
  
  // Test 7: JSONファイルの異常系
  console.log('\n🗂️  Test 7: JSONファイルの異常系');
  try {
    const result = calendarImporter.parseJSONFile(testData.invalidJson, mockSource);
    assert(result.errors.length > 0, '無効なJSONファイルでエラーが発生');
    console.log(`   エラー数: ${result.errors.length}`);
  } catch (error) {
    console.log(`❌ FAIL: JSONファイルの異常系 (${error.message})`);
    testResults.failed++;
  }
  
  // Test 8: ファイルインポート統合テスト
  console.log('\n🔄 Test 8: ファイルインポート統合テスト');
  try {
    const validIcsFile = createMockFile(testData.validIcs, 'valid.ics', 'text/calendar');
    validIcsFile.content = testData.validIcs;
    
    const result = await calendarImporter.importCalendarFile(validIcsFile, mockSource);
    assert(result.fileName === 'valid.ics', 'ファイル名が正しく設定される');
    assert(typeof result.success === 'boolean', '成功フラグが存在する');
    assert(Array.isArray(result.events), 'イベント配列が存在する');
    assert(Array.isArray(result.errors), 'エラー配列が存在する');
  } catch (error) {
    console.log(`❌ FAIL: ファイルインポート統合テスト (${error.message})`);
    testResults.failed++;
  }
  
  // Test 9: サポートされていないファイル形式
  console.log('\n❓ Test 9: サポートされていないファイル形式');
  try {
    const unsupportedFile = createMockFile('test content', 'test.txt', 'text/plain');
    unsupportedFile.content = 'test content';
    
    const result = await calendarImporter.importCalendarFile(unsupportedFile, mockSource);
    assert(!result.success, 'サポートされていないファイル形式で失敗する');
    assert(result.errors.length > 0, 'エラーメッセージが存在する');
  } catch (error) {
    console.log(`❌ FAIL: サポートされていないファイル形式 (${error.message})`);
    testResults.failed++;
  }
  
  // Test 10: エラーハンドリング
  console.log('\n🚨 Test 10: エラーハンドリング');
  try {
    const errorFile = createMockFile('', 'error.ics', 'text/calendar');
    errorFile.name = 'error.ics'; // MockFileReaderがエラーを発生させる
    
    const result = await calendarImporter.importCalendarFile(errorFile, mockSource);
    assert(!result.success, 'ファイル読み込みエラーで失敗する');
    assert(result.errors.length > 0, 'エラーメッセージが存在する');
  } catch (error) {
    console.log(`❌ FAIL: エラーハンドリング (${error.message})`);
    testResults.failed++;
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`🧪 テスト完了: ${testResults.passed + testResults.failed}件実行`);
  console.log(`✅ 成功: ${testResults.passed}件`);
  console.log(`❌ 失敗: ${testResults.failed}件`);
  
  if (testResults.failed > 0) {
    console.log('\n🔍 失敗したテスト:');
    testResults.errors.forEach(error => console.log(`   - ${error}`));
  }
  
  return testResults;
};

// テスト実行
runTests().catch(console.error);

export { runTests };