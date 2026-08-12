const Mood = require('../models/Mood');

exports.addMood = async (req, res) => {
  try {
    const score = req.body.score || req.body.value; 
    const note = req.body.note;
    const userId = req.user._id;


    const targetDate = req.body.createdAt ? new Date(req.body.createdAt) : new Date();
    
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    let existingMood = await Mood.findOne({
      user: userId,
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });

    if (existingMood) {
      existingMood.score = score; 
      existingMood.note = note || existingMood.note;
      
      const updatedMood = await existingMood.save();
      console.log("✅ Đã cập nhật Mood ngày", targetDate.toLocaleDateString(), "thành score:", score);
      return res.status(200).json(updatedMood);
    } else {
      const newMood = await Mood.create({
        user: userId,
        score: score, 
        note: note,
        createdAt: targetDate 
      });
      console.log("✅ Đã tạo Mood mới ngày", targetDate.toLocaleDateString(), "với score:", score);
      return res.status(201).json(newMood);
    }
  } catch (error) {
    console.error("❌ LỖI ADD MOOD:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

exports.getMoodHistory = async (req, res) => {
  try {
    const moods = await Mood.find({ user: req.user._id })
      .sort({ createdAt: 1 });
    res.json(moods);
  } catch (error) {
    console.error("❌ LỖI GET HISTORY:", error);
    res.status(500).json({ message: "Lỗi lấy lịch sử", error: error.message });
  }
};