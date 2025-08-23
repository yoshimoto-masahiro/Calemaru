import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// テスト実行と結果集計
const runAllTests = async () => {
  console.log('🧪 Calemaru テストスイート実行開始');
  console.log('=' * 60);
  console.log();

  const overallResults = {
    totalTests: 0,
    passed: 0,
    failed: 0,
    errors: [],
    testSuites: []
  };

  const startTime = Date.now();

  // Test Suite 1: カレンダーインポート機能テスト
  console.log('📋 1. カレンダーインポート機能テスト');
  console.log('-'.repeat(40));
  try {
    // calendar-importer.test.js を動的インポート
    const { runTests } = await import('./calendar-importer.test.js');
    const results = await runTests();
    
    overallResults.testSuites.push({
      name: 'カレンダーインポート機能',
      passed: results.passed,
      failed: results.failed,
      errors: results.errors
    });
    
    overallResults.totalTests += results.passed + results.failed;
    overallResults.passed += results.passed;
    overallResults.failed += results.failed;
    overallResults.errors.push(...results.errors);
    
    console.log(`✅ 成功: ${results.passed}件, ❌ 失敗: ${results.failed}件\n`);
  } catch (error) {
    console.log(`❌ テストスイート実行エラー: ${error.message}\n`);
    overallResults.testSuites.push({
      name: 'カレンダーインポート機能',
      passed: 0,
      failed: 1,
      errors: [`テストスイート実行エラー: ${error.message}`]
    });
    overallResults.failed++;
    overallResults.totalTests++;
  }

  // Test Suite 2: OCR機能テスト
  console.log('🖼️  2. OCR機能テスト');
  console.log('-'.repeat(40));
  try {
    const { runOCRTests } = await import('./ocr-parser.test.js');
    const results = await runOCRTests();
    
    overallResults.testSuites.push({
      name: 'OCR機能',
      passed: results.passed,
      failed: results.failed,
      errors: results.errors
    });
    
    overallResults.totalTests += results.passed + results.failed;
    overallResults.passed += results.passed;
    overallResults.failed += results.failed;
    overallResults.errors.push(...results.errors);
    
    console.log(`✅ 成功: ${results.passed}件, ❌ 失敗: ${results.failed}件\n`);
  } catch (error) {
    console.log(`❌ テストスイート実行エラー: ${error.message}\n`);
    overallResults.testSuites.push({
      name: 'OCR機能',
      passed: 0,
      failed: 1,
      errors: [`テストスイート実行エラー: ${error.message}`]
    });
    overallResults.failed++;
    overallResults.totalTests++;
  }

  // Test Suite 3: 統合テスト
  console.log('🔄 3. 統合テスト');
  console.log('-'.repeat(40));
  try {
    const { runIntegrationTests } = await import('./integration.test.js');
    const results = await runIntegrationTests();
    
    overallResults.testSuites.push({
      name: '統合テスト',
      passed: results.passed,
      failed: results.failed,
      errors: results.errors
    });
    
    overallResults.totalTests += results.passed + results.failed;
    overallResults.passed += results.passed;
    overallResults.failed += results.failed;
    overallResults.errors.push(...results.errors);
    
    console.log(`✅ 成功: ${results.passed}件, ❌ 失敗: ${results.failed}件\n`);
  } catch (error) {
    console.log(`❌ テストスイート実行エラー: ${error.message}\n`);
    overallResults.testSuites.push({
      name: '統合テスト',
      passed: 0,
      failed: 1,
      errors: [`テストスイート実行エラー: ${error.message}`]
    });
    overallResults.failed++;
    overallResults.totalTests++;
  }

  // Test Suite 4: エッジケーステスト
  console.log('🚨 4. エッジケース・エラーハンドリングテスト');
  console.log('-'.repeat(40));
  try {
    const { runEdgeCaseTests } = await import('./edge-cases.test.js');
    const results = await runEdgeCaseTests();
    
    overallResults.testSuites.push({
      name: 'エッジケース・エラーハンドリング',
      passed: results.passed,
      failed: results.failed,
      errors: results.errors
    });
    
    overallResults.totalTests += results.passed + results.failed;
    overallResults.passed += results.passed;
    overallResults.failed += results.failed;
    overallResults.errors.push(...results.errors);
    
    console.log(`✅ 成功: ${results.passed}件, ❌ 失敗: ${results.failed}件\n`);
  } catch (error) {
    console.log(`❌ テストスイート実行エラー: ${error.message}\n`);
    overallResults.testSuites.push({
      name: 'エッジケース・エラーハンドリング',
      passed: 0,
      failed: 1,
      errors: [`テストスイート実行エラー: ${error.message}`]
    });
    overallResults.failed++;
    overallResults.totalTests++;
  }

  const endTime = Date.now();
  const duration = endTime - startTime;

  // 総合結果レポート
  console.log('='.repeat(60));
  console.log('📊 テスト実行完了レポート');
  console.log('='.repeat(60));
  console.log();
  
  // 基本統計
  console.log('📈 基本統計:');
  console.log(`   総テスト数: ${overallResults.totalTests}件`);
  console.log(`   ✅ 成功: ${overallResults.passed}件 (${((overallResults.passed / overallResults.totalTests) * 100).toFixed(1)}%)`);
  console.log(`   ❌ 失敗: ${overallResults.failed}件 (${((overallResults.failed / overallResults.totalTests) * 100).toFixed(1)}%)`);
  console.log(`   ⏱️  実行時間: ${(duration / 1000).toFixed(2)}秒`);
  console.log();

  // テストスイートごとの詳細
  console.log('📋 テストスイート別結果:');
  overallResults.testSuites.forEach((suite, index) => {
    const total = suite.passed + suite.failed;
    const passRate = total > 0 ? ((suite.passed / total) * 100).toFixed(1) : '0.0';
    
    console.log(`   ${index + 1}. ${suite.name}`);
    console.log(`      ✅ ${suite.passed}件 ❌ ${suite.failed}件 (成功率: ${passRate}%)`);
  });
  console.log();

  // 問題点の詳細分析
  if (overallResults.failed > 0) {
    console.log('🔍 検出された問題点:');
    console.log();
    
    overallResults.testSuites.forEach((suite, index) => {
      if (suite.errors.length > 0) {
        console.log(`   ${index + 1}. ${suite.name}の問題点:`);
        suite.errors.forEach(error => {
          console.log(`      • ${error}`);
        });
        console.log();
      }
    });
  }

  // 潜在的な問題点の分析
  console.log('⚠️  潜在的な問題点と推奨事項:');
  console.log();

  // ICS解析関連の問題
  if (overallResults.errors.some(error => error.includes('ICS'))) {
    console.log('   📋 ICSファイル処理:');
    console.log('      • ICS日付形式の解析が不完全な可能性があります');
    console.log('      • タイムゾーン処理が実装されていません');
    console.log('      • 繰り返しイベント（RRULE）のサポートがありません');
    console.log('      • 大きなICSファイルの処理でメモリ使用量が増大する可能性があります');
    console.log();
  }

  // CSV解析関連の問題
  if (overallResults.errors.some(error => error.includes('CSV'))) {
    console.log('   📊 CSVファイル処理:');
    console.log('      • CSV内の改行やカンマのエスケープ処理が不十分です');
    console.log('      • 異なる日付形式のサポートが限定的です');
    console.log('      • 文字エンコーディングの自動検出がありません');
    console.log();
  }

  // JSON解析関連の問題
  if (overallResults.errors.some(error => error.includes('JSON'))) {
    console.log('   🗂️  JSONファイル処理:');
    console.log('      • 深くネストしたJSONの処理でスタックオーバーフローの危険があります');
    console.log('      • 大きなJSONファイルの処理でメモリ不足になる可能性があります');
    console.log('      • 不正なJSONのエラーメッセージが不十分です');
    console.log();
  }

  // OCR関連の問題
  if (overallResults.errors.some(error => error.includes('OCR'))) {
    console.log('   🖼️  OCR機能:');
    console.log('      • 日本語テキストの認識精度が低い可能性があります');
    console.log('      • 複雑なレイアウトの画像処理が困難です');
    console.log('      • 画像の前処理（回転、ノイズ除去）がありません');
    console.log('      • OCR処理の進行状況表示がありません');
    console.log();
  }

  // 全般的な問題
  console.log('   🔧 全般的な改善点:');
  console.log('      • エラーメッセージの国際化（多言語対応）');
  console.log('      • ファイルアップロードの進行状況表示');
  console.log('      • 大きなファイルの処理における非同期処理の最適化');
  console.log('      • ユーザビリティテストの実施');
  console.log('      • アクセシビリティ対応の確認');
  console.log('      • ブラウザ互換性テストの追加');
  console.log();

  // セキュリティ関連の推奨事項
  console.log('   🔒 セキュリティ関連:');
  console.log('      • ファイルアップロードサイズ制限の実装確認');
  console.log('      • 悪意のあるファイルのスキャン機能');
  console.log('      • CSP（Content Security Policy）の設定');
  console.log('      • XSS対策の強化');
  console.log();

  // パフォーマンス関連の推奨事項
  console.log('   🚀 パフォーマンス関連:');
  console.log('      • 大量イベントの仮想化表示');
  console.log('      • Web Workers を使用した重い処理の分離');
  console.log('      • キャッシュ戦略の最適化');
  console.log('      • バンドルサイズの最適化');
  console.log();

  // 機能拡張の提案
  console.log('   🆕 機能拡張の提案:');
  console.log('      • 繰り返しイベント（毎週、毎月など）のサポート');
  console.log('      • カレンダーのエクスポート機能');
  console.log('      • イベントの検索・フィルタリング機能の強化');
  console.log('      • 複数人での予定共有機能');
  console.log('      • 通知・リマインダー機能');
  console.log('      • CalDAV/WebDAVとの同期');
  console.log();

  // レポートをファイルに保存
  const reportContent = generateTestReport(overallResults, duration);
  const reportPath = path.join(__dirname, '..', 'test-results.md');
  
  try {
    fs.writeFileSync(reportPath, reportContent, 'utf8');
    console.log(`📝 詳細レポートを保存しました: ${reportPath}`);
  } catch (error) {
    console.log(`⚠️  レポートファイルの保存に失敗: ${error.message}`);
  }

  // 全体的な評価
  console.log();
  console.log('=' * 60);
  if (overallResults.failed === 0) {
    console.log('🎉 全てのテストが成功しました！');
    console.log('   アプリケーションは期待通りに動作しています。');
  } else if (overallResults.failed <= overallResults.totalTests * 0.1) {
    console.log('✅ アプリケーションは概ね良好に動作しています。');
    console.log('   いくつかの小さな問題がありますが、全体的な機能は正常です。');
  } else if (overallResults.failed <= overallResults.totalTests * 0.3) {
    console.log('⚠️  アプリケーションに注意が必要な問題があります。');
    console.log('   重要でない機能に問題がある可能性があります。');
  } else {
    console.log('❌ アプリケーションに重大な問題があります。');
    console.log('   本格的な使用前に問題の修正を強く推奨します。');
  }
  console.log('=' * 60);

  return overallResults;
};

// マークダウン形式のレポート生成
const generateTestReport = (results, duration) => {
  const currentDate = new Date().toLocaleString('ja-JP');
  
  return `# Calemaru テスト実行レポート

**実行日時:** ${currentDate}  
**実行時間:** ${(duration / 1000).toFixed(2)}秒

## 📊 実行結果サマリー

| 項目 | 値 | 割合 |
|------|----|----|
| 総テスト数 | ${results.totalTests} | 100% |
| ✅ 成功 | ${results.passed} | ${((results.passed / results.totalTests) * 100).toFixed(1)}% |
| ❌ 失敗 | ${results.failed} | ${((results.failed / results.totalTests) * 100).toFixed(1)}% |

## 📋 テストスイート別結果

${results.testSuites.map((suite, index) => {
  const total = suite.passed + suite.failed;
  const passRate = total > 0 ? ((suite.passed / total) * 100).toFixed(1) : '0.0';
  
  return `### ${index + 1}. ${suite.name}

- **成功:** ${suite.passed}件
- **失敗:** ${suite.failed}件  
- **成功率:** ${passRate}%

${suite.errors.length > 0 ? `**検出された問題:**
${suite.errors.map(error => `- ${error}`).join('\n')}` : '**問題なし**'}
`;
}).join('\n')}

## 🔍 主要な問題点と推奨事項

### ICSファイル処理
- ICS日付形式の解析が不完全
- タイムゾーン処理未実装
- 繰り返しイベント（RRULE）未サポート
- 大きなファイルでのメモリ使用量増大

### CSVファイル処理  
- 改行・カンマのエスケープ処理不十分
- 日付形式サポートが限定的
- 文字エンコーディング自動検出なし

### OCR機能
- 日本語認識精度の課題
- 複雑レイアウト処理の困難
- 画像前処理機能なし
- 進行状況表示なし

### セキュリティ・パフォーマンス
- ファイルサイズ制限の確認必要
- 大量データの仮想化表示検討
- Web Workers活用検討
- XSS対策強化

## 🚀 今後の改善提案

1. **機能拡張**
   - 繰り返しイベントサポート
   - エクスポート機能
   - 高度な検索・フィルタリング
   
2. **ユーザビリティ向上**
   - 多言語対応
   - アクセシビリティ改善
   - 進行状況表示

3. **技術的改善**
   - パフォーマンス最適化
   - エラーハンドリング強化
   - ブラウザ互換性向上

---
*このレポートは自動生成されました*
`;
};

// メイン実行
runAllTests().catch(error => {
  console.error('テスト実行中にエラーが発生しました:', error);
  process.exit(1);
});

export { runAllTests };