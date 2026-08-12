const StudySession = require('../models/StudySession');
const Task = require('../models/Task');

exports.startSession = async (req, res) => {
  try {
    const { taskId, duration } = req.body;
    const userId = req.body.userId; 

    if (!userId) return res.status(400).json({ success: false, message: 'Thiếu userId' });

    const newSession = await StudySession.create({
      userId,
      taskId: taskId || null, 
      duration: duration || 25,
      status: 'running'
    });

    res.status(201).json({ success: true, data: newSession });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

exports.endSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { status } = req.body; 

    const session = await StudySession.findById(sessionId);
    if (!session) return res.status(404).json({ success: false, message: 'Không tìm thấy phiên học' });
    
    if (session.status !== 'running') {
      return res.status(400).json({ success: false, message: 'Phiên này đã kết thúc từ trước rồi!' });
    }

    session.status = status || 'completed';
    session.endTime = Date.now();
    await session.save();

    res.status(200).json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

exports.completeSession = async (req, res) => {
  try {
    const { duration, type, completedAt, userId: bodyUserId } = req.body;
    const finalUserId = (req.user && (req.user._id || req.user.id)) || bodyUserId;

    if (!finalUserId) return res.status(400).json({ message: "Không tìm thấy ID người dùng!" });

    const newSession = await StudySession.create({
      userId: finalUserId, 
      duration: duration || 25, 
      type: type || 'pomodoro',
      status: 'completed', 
      createdAt: completedAt || new Date()
    });

    res.status(201).json({ success: true, data: newSession });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

exports.getWeeklyReport = async (req, res) => {
  try {
    const userId = req.user._id;

    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0); 

    const report = await StudySession.aggregate([
      {
        $match: {
          userId: userId,
          status: 'completed', 
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "+07:00" } },
          totalMinutes: { $sum: "$duration" } 
        }
      },
      { $sort: { _id: 1 } } 
    ]);

    const filledReport = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const dateStr = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
      const dayOfWeek = d.toLocaleDateString('vi-VN', { weekday: 'short', timeZone: 'Asia/Ho_Chi_Minh' });

      const found = report.find(r => r._id === dateStr);
      filledReport.push({
        date: dateStr, label: dayOfWeek, totalMinutes: found ? found.totalMinutes : 0
      });
    }

    res.status(200).json({ success: true, data: filledReport });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.getCommunityReport = async (req, res) => {
  try {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0); 
    
    const currentUserId = req.user ? req.user._id.toString() : null; 

    const communityStats = await StudySession.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: sevenDaysAgo } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "+07:00" } }, uniqueUsers: { $addToSet: "$userId" } } },
      { $project: { _id: 1, userCount: { $size: "$uniqueUsers" } } },
      { $sort: { _id: 1 } }
    ]);

    const filledDailyStats = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const dateStr = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
      const dayOfWeek = d.toLocaleDateString('vi-VN', { weekday: 'short', timeZone: 'Asia/Ho_Chi_Minh' });

      const found = communityStats.find(r => r._id === dateStr);
      filledDailyStats.push({ label: dayOfWeek, usersActive: found ? found.userCount : 0 });
    }

    let topPercentage = 100; 
    
    if (currentUserId) {
        const userRankings = await StudySession.aggregate([
            { $match: { status: 'completed', createdAt: { $gte: sevenDaysAgo } } },
            { $group: { _id: "$userId", totalMinutes: { $sum: "$duration" } } },
            { $sort: { totalMinutes: -1 } } 
        ]);

        const totalActiveUsersThisWeek = userRankings.length;
        if (totalActiveUsersThisWeek > 0) {
            const userIndex = userRankings.findIndex(u => u._id && u._id.toString() === currentUserId);
            if (userIndex !== -1) {
                const userRank = userIndex + 1; 
                
                if (totalActiveUsersThisWeek === 1) {
                    topPercentage = 1; 
                } else {
                    topPercentage = Math.round((userRank / totalActiveUsersThisWeek) * 100);
                    if (topPercentage === 0) topPercentage = 1; 
                    if (topPercentage === 100) topPercentage = 99; 
                }
            }
        }
    }

    res.status(200).json({ 
        success: true, 
        data: { dailyStats: filledDailyStats, rank: { topPercentage: topPercentage } } 
    });

  } catch (error) {
    console.error("❌ Lỗi getCommunityReport:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};