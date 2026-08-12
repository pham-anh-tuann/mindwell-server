const mongoose = require('mongoose');

exports.getCommunityHistory = async (req, res) => {
  try {
    const CommunityChat = mongoose.models.CommunityChat || require('../models/CommunityChat');
    
    const history = await CommunityChat.find()
      .sort({ createdAt: -1 }) 
      .limit(50)
      .lean();

    res.status(200).json({ success: true, data: history });
  } catch (error) {
    console.error("❌ Lỗi kéo lịch sử cộng đồng:", error);
    res.status(500).json({ success: false, message: "Lỗi Server khi lấy lịch sử" });
  }
};