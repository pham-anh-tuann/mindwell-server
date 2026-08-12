const TestResult = require('../models/TestResult');
const Test = require('../models/Test'); 
const sendTelegramAlert = require('../utils/telegramBot');

exports.saveTestResult = async (req, res) => {
  try {
    const { testId, testTitle, score, result, isRedFlag } = req.body;

    const newResult = await TestResult.create({
      user: req.user._id,
      testId,
      testTitle,
      score,
      result,
      isRedFlag: isRedFlag || false, 
      status: isRedFlag ? 'pending' : 'safe' 
    });

    if (testId) {
      if (testId.length === 24) {
        await Test.findByIdAndUpdate(testId, { $inc: { takes: 1 } });
      } 
      else {
        await Test.findOneAndUpdate({ code: testId }, { $inc: { takes: 1 } });
      }
    }

    if (isRedFlag) {
      sendTelegramAlert(req.user.name || "Một sinh viên (Ẩn danh)", testTitle, result);
    }

    console.log(`✅ [${isRedFlag ? '🚨 SOS' : 'SAFE'}] Đã lưu kết quả test & tăng lượt làm bài:`, testTitle);
    res.status(201).json(newResult);
  } catch (error) {
    console.error("❌ Lỗi lưu test:", error);
    res.status(500).json({ message: "Lỗi server khi lưu kết quả" });
  }
};

exports.getTestHistory = async (req, res) => {
  try {
    const history = await TestResult.find({ user: req.user._id })
      .sort({ createdAt: -1 }); 
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserTestHistoryForAdmin = async (req, res) => {
  try {
    const history = await TestResult.find({ user: req.params.userId })
      .sort({ createdAt: -1 }); 
    res.json(history);
  } catch (error) {
    console.error("Lỗi lấy lịch sử cho admin:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};