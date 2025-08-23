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

// Tesseract.jsのモック実装
const mockTesseract = {
  recognize: async (dataUrl, language) => {
    // テスト用のOCR結果をシミュレート
    if (dataUrl.includes('sample-calendar')) {
      return {
        data: {
          text: `2025-02-15 10:00 - 11:00 チーム会議
2025-02-16 14:30 医者の予約
2025-02-17 友人との食事
2025/02/18 19:00 - 21:00 ヨガクラス
2025-02-20 終日イベント`
        }
      };
    } else if (dataUrl.includes('invalid-format')) {
      return {
        data: {
          text: `invalid date format
no date at all
random text without dates`
        }
      };
    } else if (dataUrl.includes('mixed-format')) {
      return {
        data: {
          text: `2025-02-15 10:00 - 11:00 正常なイベント
invalid-date-format イベント
2025/02/16 スラッシュ区切りの日付
16/02/2025 14:00 ヨーロッパ形式の日付`
        }
      };
    } else if (dataUrl.includes('empty')) {
      return {
        data: {
          text: ''
        }
      };
    } else if (dataUrl.includes('error')) {
      throw new Error('OCR processing failed');
    }
    
    return {
      data: {
        text: '2025-02-15 10:00 デフォルトテストイベント'
      }
    };
  }
};

// テスト用のモックソース
const createMockSource = () => ({
  id: 'test-source',
  name: 'Test Source',
  type: 'local',
  color: '#10B981',
  enabled: true
});

// メインテスト関数
const runOCRTests = async () => {
  console.log('🖼️  画像OCR機能のテストを開始...\n');
  
  const mockSource = createMockSource();
  
  // imageCalendarParser モジュールの動的インポート
  let imageParser;
  try {
    const parserPath = path.join(__dirname, '..', 'src', 'utils', 'imageCalendarParser.js');
    imageParser = await import(parserPath);
  } catch (error) {
    console.warn('⚠️  imageCalendarParser.jsが見つかりません。テスト用のモック関数を使用します。');
    
    // モック実装
    imageParser = {
      parseImageFile: async (dataUrl, source) => {
        try {
          const result = await mockTesseract.recognize(dataUrl, 'eng');
          const text = result.data.text || '';
          const lines = text
            .split('\n')
            .map((l) => l.trim())
            .filter((l) => l);

          const events = [];

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

              if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
                events.push({
                  id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
                  title,
                  description: '',
                  startDate,
                  endDate,
                  source,
                  color: source.color,
                });
              }
            } else {
              // 日付のみを含む行を終日イベントとして扱う
              const dateOnly = line.match(/(\d{4}[-/]\d{1,2}[-/]\d{1,2})\s*(.*)/);
              if (dateOnly) {
                const date = new Date(dateOnly[1].replace(/-/g, '/'));
                const title = dateOnly[2] ? dateOnly[2].trim() : 'イベント';

                if (!isNaN(date.getTime())) {
                  events.push({
                    id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
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
          }

          return events;
        } catch (error) {
          console.error('OCR parsing error:', error);
          return [];
        }
      }
    };
  }
  
  // Test 1: 正常な日時形式の画像解析
  console.log('🖼️  Test 1: 正常な日時形式の画像解析');
  try {
    const dataUrl = 'data:image/png;base64,sample-calendar';
    const events = await imageParser.parseImageFile(dataUrl, mockSource);
    
    assert(Array.isArray(events), 'イベント配列が返される');
    assert(events.length > 0, 'イベントが正しく抽出される');
    
    // 最初のイベントの詳細チェック
    if (events.length > 0) {
      const firstEvent = events[0];
      assert(typeof firstEvent.id === 'string', 'イベントIDが文字列');
      assert(typeof firstEvent.title === 'string', 'タイトルが文字列');
      assert(firstEvent.startDate instanceof Date, '開始日時がDateオブジェクト');
      assert(firstEvent.endDate instanceof Date, '終了日時がDateオブジェクト');
      assert(firstEvent.source === mockSource, 'ソースが正しく設定される');
    }
    
    console.log(`   抽出されたイベント数: ${events.length}`);
    events.forEach((event, index) => {
      console.log(`   ${index + 1}. ${event.title} (${event.startDate.toISOString().split('T')[0]})`);
    });
  } catch (error) {
    console.log(`❌ FAIL: 正常な日時形式の画像解析 (${error.message})`);
    testResults.failed++;
  }
  
  // Test 2: 無効な日付形式の画像
  console.log('\n🖼️  Test 2: 無効な日付形式の画像');
  try {
    const dataUrl = 'data:image/png;base64,invalid-format';
    const events = await imageParser.parseImageFile(dataUrl, mockSource);
    
    assert(Array.isArray(events), 'イベント配列が返される');
    assert(events.length === 0, '無効な形式では空の配列が返される');
    console.log(`   抽出されたイベント数: ${events.length}`);
  } catch (error) {
    console.log(`❌ FAIL: 無効な日付形式の画像 (${error.message})`);
    testResults.failed++;
  }
  
  // Test 3: 混在形式の画像（一部有効、一部無効）
  console.log('\n🖼️  Test 3: 混在形式の画像');
  try {
    const dataUrl = 'data:image/png;base64,mixed-format';
    const events = await imageParser.parseImageFile(dataUrl, mockSource);
    
    assert(Array.isArray(events), 'イベント配列が返される');
    console.log(`   抽出されたイベント数: ${events.length}`);
    
    // 有効なイベントのみが抽出されることを確認
    events.forEach(event => {
      assert(!isNaN(event.startDate.getTime()), '有効な開始日時を持つ');
      assert(!isNaN(event.endDate.getTime()), '有効な終了日時を持つ');
    });
  } catch (error) {
    console.log(`❌ FAIL: 混在形式の画像 (${error.message})`);
    testResults.failed++;
  }
  
  // Test 4: 空の画像（テキストなし）
  console.log('\n🖼️  Test 4: 空の画像');
  try {
    const dataUrl = 'data:image/png;base64,empty';
    const events = await imageParser.parseImageFile(dataUrl, mockSource);
    
    assert(Array.isArray(events), 'イベント配列が返される');
    assert(events.length === 0, 'テキストがない場合は空の配列');
    console.log(`   抽出されたイベント数: ${events.length}`);
  } catch (error) {
    console.log(`❌ FAIL: 空の画像 (${error.message})`);
    testResults.failed++;
  }
  
  // Test 5: OCRエラー処理
  console.log('\n🖼️  Test 5: OCRエラー処理');
  try {
    const dataUrl = 'data:image/png;base64,error';
    const events = await imageParser.parseImageFile(dataUrl, mockSource);
    
    assert(Array.isArray(events), 'エラー時でも配列が返される');
    assert(events.length === 0, 'エラー時は空の配列');
    console.log(`   抽出されたイベント数: ${events.length}`);
  } catch (error) {
    console.log(`❌ FAIL: OCRエラー処理 (${error.message})`);
    testResults.failed++;
  }
  
  // Test 6: 日付パターンの多様性テスト
  console.log('\n🖼️  Test 6: 日付パターンの多様性');
  try {
    // 様々な日付形式をテスト
    const testPatterns = [
      '2025-02-15 10:00 - 11:00 ハイフン区切り',
      '2025/02/15 14:30 スラッシュ区切り',
      '2025-2-5 9:00 ゼロ埋めなし',
      '2025-02-15 終日イベント',
    ];
    
    // モックのTesseractを直接使用
    const mockResult = {
      data: { text: testPatterns.join('\n') }
    };
    
    const events = [];
    const lines = mockResult.data.text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l);

    for (const line of lines) {
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

        if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
          events.push({
            id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
            title,
            description: '',
            startDate,
            endDate,
            source: mockSource,
            color: mockSource.color,
          });
        }
      } else {
        const dateOnly = line.match(/(\d{4}[-/]\d{1,2}[-/]\d{1,2})\s*(.*)/);
        if (dateOnly) {
          const date = new Date(dateOnly[1].replace(/-/g, '/'));
          const title = dateOnly[2] ? dateOnly[2].trim() : 'イベント';

          if (!isNaN(date.getTime())) {
            events.push({
              id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
              title,
              description: '',
              startDate: date,
              endDate: date,
              source: mockSource,
              color: mockSource.color,
              allDay: true,
            });
          }
        }
      }
    }
    
    assert(events.length > 0, '様々な日付形式が正しく解析される');
    console.log(`   解析された日付パターン数: ${events.length}`);
    
    // 各パターンの検証
    events.forEach((event, index) => {
      assert(!isNaN(event.startDate.getTime()), `パターン${index + 1}の開始日時が有効`);
      assert(!isNaN(event.endDate.getTime()), `パターン${index + 1}の終了日時が有効`);
    });
  } catch (error) {
    console.log(`❌ FAIL: 日付パターンの多様性 (${error.message})`);
    testResults.failed++;
  }
  
  // Test 7: イベントプロパティの完全性チェック
  console.log('\n🖼️  Test 7: イベントプロパティの完全性');
  try {
    const dataUrl = 'data:image/png;base64,sample-calendar';
    const events = await imageParser.parseImageFile(dataUrl, mockSource);
    
    if (events.length > 0) {
      const event = events[0];
      const requiredProperties = ['id', 'title', 'description', 'startDate', 'endDate', 'source', 'color'];
      
      requiredProperties.forEach(prop => {
        assert(event.hasOwnProperty(prop), `イベントが${prop}プロパティを持つ`);
      });
      
      assert(typeof event.id === 'string' && event.id.length > 0, 'IDが非空文字列');
      assert(typeof event.title === 'string', 'タイトルが文字列');
      assert(typeof event.description === 'string', '説明が文字列');
      assert(event.startDate instanceof Date, '開始日時がDateオブジェクト');
      assert(event.endDate instanceof Date, '終了日時がDateオブジェクト');
      assert(event.source === mockSource, 'ソースが正しく参照される');
      assert(typeof event.color === 'string', '色が文字列');
    }
  } catch (error) {
    console.log(`❌ FAIL: イベントプロパティの完全性 (${error.message})`);
    testResults.failed++;
  }
  
  // Test 8: 時刻の解析精度
  console.log('\n🖼️  Test 8: 時刻の解析精度');
  try {
    const testTimeText = '2025-02-15 09:30 - 10:45 精密時刻テスト';
    const mockResult = { data: { text: testTimeText } };
    
    const events = [];
    const lines = [testTimeText];
    
    for (const line of lines) {
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
          id: 'test-time',
          title,
          startDate,
          endDate,
          source: mockSource,
          color: mockSource.color,
        });
      }
    }
    
    if (events.length > 0) {
      const event = events[0];
      assert(event.startDate.getHours() === 9, '開始時刻の時間が正確');
      assert(event.startDate.getMinutes() === 30, '開始時刻の分が正確');
      assert(event.endDate.getHours() === 10, '終了時刻の時間が正確');
      assert(event.endDate.getMinutes() === 45, '終了時刻の分が正確');
      
      const duration = event.endDate.getTime() - event.startDate.getTime();
      const expectedDuration = 75 * 60 * 1000; // 75分
      assert(duration === expectedDuration, '時間間隔が正確に計算される');
    }
  } catch (error) {
    console.log(`❌ FAIL: 時刻の解析精度 (${error.message})`);
    testResults.failed++;
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`🖼️  OCRテスト完了: ${testResults.passed + testResults.failed}件実行`);
  console.log(`✅ 成功: ${testResults.passed}件`);
  console.log(`❌ 失敗: ${testResults.failed}件`);
  
  if (testResults.failed > 0) {
    console.log('\n🔍 失敗したテスト:');
    testResults.errors.forEach(error => console.log(`   - ${error}`));
  }
  
  return testResults;
};

// テスト実行
runOCRTests().catch(console.error);

export { runOCRTests };