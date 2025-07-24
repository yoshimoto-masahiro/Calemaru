import React, { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';
import { CalendarSource, FileImportResult } from '../types/calendar';
import { importCalendarFile } from '../utils/calendarImporter';

interface FileDropZoneProps {
  sources: CalendarSource[];
  onImport: (events: any[]) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const FileDropZone: React.FC<FileDropZoneProps> = ({
  sources,
  onImport,
  isOpen,
  onClose,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedSource, setSelectedSource] = useState(sources[0]?.id || '');
  const [importResults, setImportResults] = useState<FileImportResult[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  };

  const handleFiles = async (files: File[]) => {
    if (files.length === 0) return;
    
    setIsProcessing(true);
    setImportResults([]);
    
    const source = sources.find(s => s.id === selectedSource) || sources[0];
    const results: FileImportResult[] = [];
    
    for (const file of files) {
      const result = await importCalendarFile(file, source);
      results.push(result);
      
      if (result.success) {
        onImport(result.events);
      }
    }
    
    setImportResults(results);
    setIsProcessing(false);
  };

  const clearResults = () => {
    setImportResults([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            カレンダーファイルをインポート
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* カレンダーソース選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              インポート先のカレンダー
            </label>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {sources.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.name}
                </option>
              ))}
            </select>
          </div>

          {/* ドロップゾーン */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className={`w-12 h-12 mx-auto mb-4 ${
              isDragOver ? 'text-blue-500' : 'text-gray-400'
            }`} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              ファイルをドラッグ＆ドロップ
            </h3>
            <p className="text-gray-600 mb-4">
              または
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              disabled={isProcessing}
            >
              ファイルを選択
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".ics,.csv,.json"
              onChange={handleFileSelect}
              className="hidden"
            />
            <p className="text-sm text-gray-500 mt-4">
              対応形式: ICS, CSV, JSON
            </p>
          </div>

          {/* 処理中表示 */}
          {isProcessing && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">ファイルを処理中...</span>
            </div>
          )}

          {/* インポート結果 */}
          {importResults.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">インポート結果</h3>
                <button
                  onClick={clearResults}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  クリア
                </button>
              </div>
              
              {importResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    result.success
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {result.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-4 h-4" />
                        <span className="font-medium text-gray-900">
                          {result.fileName}
                        </span>
                      </div>
                      
                      {result.success ? (
                        <p className="text-sm text-green-700">
                          {result.events.length}件の予定をインポートしました
                        </p>
                      ) : (
                        <div className="text-sm text-red-700">
                          <p className="mb-1">インポートに失敗しました</p>
                          {result.errors.map((error, errorIndex) => (
                            <p key={errorIndex} className="text-xs">
                              • {error}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 使用方法 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">対応ファイル形式</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• <strong>ICS</strong>: Google Calendar、Outlook、Apple Calendarからエクスポート</li>
              <li>• <strong>CSV</strong>: タイトル、開始時刻、終了時刻、説明の列を含む</li>
              <li>• <strong>JSON</strong>: 予定データを含むJSON配列またはオブジェクト</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end gap-2 p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};