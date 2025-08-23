// Tesseract.jsのモック
const mockRecognize = jest.fn().mockResolvedValue({
  data: {
    text: '2025-01-15 10:00 - 11:00 テスト会議\n2025-01-16 終日イベント'
  }
});

const Tesseract = {
  recognize: mockRecognize
};

module.exports = Tesseract;
module.exports.default = Tesseract;
module.exports.Tesseract = Tesseract;