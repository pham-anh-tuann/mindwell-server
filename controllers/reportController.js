const { OpenAI } = require('openai'); 
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const getModel = (name) => mongoose.models[name] || require(`../models/${name}`);

exports.getWeeklySummary = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = new Date(); today.setHours(23, 59, 59, 999);
    const sevenDaysAgo = new Date(today); sevenDaysAgo.setDate(today.getDate() - 6);
    
    const Mood = getModel('Mood');
    const TestResult = getModel('TestResult');

    const [moods, tests] = await Promise.all([
      Mood.find({ user: userId, createdAt: { $gte: sevenDaysAgo, $lte: today } }).sort({ createdAt: 1 }),
      TestResult.find({ user: userId, createdAt: { $gte: sevenDaysAgo } }).sort({ createdAt: -1 })
    ]);

    const moodScores = moods.map(m => m.score);
    const avgMood = moodScores.length > 0 ? (moodScores.reduce((a, b) => a + b, 0) / moodScores.length).toFixed(1) : null;

    let aiRecommendation = "Tớ vẫn đang theo dõi hành trình của cậu! ✨";
    if (avgMood) {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Bạn là trợ lý MindWell. Phân tích dữ liệu sinh viên 7 ngày qua, viết đánh giá Gen Z (60-80 từ), dùng emoji." },
          { role: "user", content: `Điểm cảm xúc: ${avgMood}/5. Bài test: ${tests.map(t => t.result).join(', ')}` }
        ]
      });
      aiRecommendation = completion.choices[0].message.content.trim();
    }

    res.json({
      moodSummary: avgMood >= 3 ? "Cân Bằng ⚖️" : "Cần Nghỉ Ngơi 🌧️",
      testsCompleted: tests.length,
      rawMoods: moods.map(m => ({ date: `${new Date(m.createdAt).getDate()}/${new Date(m.createdAt).getMonth() + 1}`, value: m.score })),
      rawTests: tests.map(t => ({ name: t.testTitle, level: t.result, score: t.score })),
      aiRecommendation
    });
  } catch (error) { res.status(500).json({ message: 'Lỗi server báo cáo tuần' }); }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const User = getModel('User');
    const TestResult = getModel('TestResult');

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [totalUsers, totalTests, severityRaw, redFlags] = await Promise.all([
      User.countDocuments({ isAdmin: { $ne: true } }),
      TestResult.countDocuments(),
      TestResult.aggregate([{ $group: { _id: "$result", count: { $sum: 1 } } }]),
      TestResult.find({ isRedFlag: true }).populate('user', 'name').sort({ createdAt: -1 }).limit(10)
    ]);

   
    const allTestsThisMonth = await TestResult.find({ createdAt: { $gte: startOfMonth } });

    const stressCount = allTestsThisMonth.filter(t => {
      const title = t.testTitle.toLowerCase();
      return (title.includes('stress') || title.includes('căng thẳng') || title.includes('pss')) 
             && t.isRedFlag === true;
    }).length;

    const depressionCount = allTestsThisMonth.filter(t => {
      const title = t.testTitle.toLowerCase();
      return (title.includes('trầm cảm') || title.includes('depression') || title.includes('phq')) 
             && t.isRedFlag === true;
    }).length;

    const trendData = [
      { 
        month: 'Tháng này', 
        stress: stressCount, 
        depression: depressionCount 
      }
    ];

    res.json({ 
      totalUsers, 
      totalTests, 
      totalContent: 42, 
      severityRaw, 
      redFlags,
      trendData
    });
  } catch (error) { 
    console.error(error);
    res.status(500).json({ message: "Lỗi Dashboard" }); 
  }
};

exports.getAllRedFlags = async (req, res) => {
  try {
    const TestResult = getModel('TestResult');
    
    const flags = await TestResult.find({
      $or: [
        { isRedFlag: true },
        { status: { $in: ['pending', 'in_progress', 'resolved'] } }
      ]
    })
    .populate('user', 'name email phone studentCode') 
    .sort({ createdAt: -1 });

    res.json(flags);
  } catch (error) { 
    console.error("Lỗi lấy RedFlags:", error);
    res.status(500).json({ message: "Lỗi lấy RedFlags" }); 
  }
};

exports.updateRedFlagStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { newStatus, note, adminName } = req.body;
    const TestResult = getModel('TestResult');

    const currentTicket = await TestResult.findById(id);
    
    if (!currentTicket) {
      return res.status(404).json({ message: "Không tìm thấy hồ sơ này!" });
    }

    if (currentTicket.status === 'resolved') {
      return res.status(403).json({ 
        message: "Hồ sơ này đã được đóng (Resolved) và không thể chỉnh sửa để đảm bảo tính toàn vẹn của dữ liệu can thiệp." 
      });
    }

    const newLog = {
      action: `Chuyển trạng thái thành [${newStatus}]: ${note}`,
      user: adminName || 'Chuyên viên MindWell',
      time: new Date()
    };

    const updatedTest = await TestResult.findByIdAndUpdate(
      id, 
      { 
        status: newStatus,
        $push: { logs: newLog }
      }, 
      { new: true }
    );

    res.json({ message: "Cập nhật và lưu lịch sử thành công!", test: updatedTest });
  } catch (error) { 
    console.error("Lỗi cập nhật trạng thái:", error);
    res.status(500).json({ message: "Lỗi server khi lưu nhật ký can thiệp" }); 
  }
};

exports.getGlobalInterventionHistory = async (req, res) => {
  try {
    const TestResult = getModel('TestResult');
    const history = await TestResult.find({ "logs.0": { $exists: true } }).sort({ "logs.time": -1 });
    res.json(history);
  } catch (error) { res.status(500).json({ message: "Lỗi lấy lịch sử" }); }
};