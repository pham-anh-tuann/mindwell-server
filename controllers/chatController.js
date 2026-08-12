const { OpenAI } = require('openai');
const Chat = require('../models/Chat');
const User = require('../models/User');
const Mood = require('../models/Mood');
const Task = require('../models/Task');
const StudySession = require('../models/StudySession');
const dotenv = require('dotenv');
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

exports.chatWithAI = async (req, res) => {
  try {
    let { message } = req.body;
    const userId = req.user._id;

    if (!message) return res.status(400).json({ message: "Vui lòng nhập tin nhắn!" });

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const [currentUser, todayTasks, activeSession, recentMood, lastChats] = await Promise.all([
      User.findById(userId).lean(),
      Task.find({ userId, startTime: { $gte: startOfDay, $lte: endOfDay } }).lean(),
      StudySession.findOne({ userId, status: 'running' }).lean(),
      Mood.findOne({ user: userId }).sort({ createdAt: -1 }).lean(),
      
      Chat.find({ user: userId }).sort({ createdAt: -1 }).limit(15).lean()
    ]);

    const goal = currentUser?.onboardingData?.['1'] || "Học tập tốt";
    const academicContext = todayTasks.length > 0 
      ? todayTasks.map(t => `- ${t.title} (${t.type === 'exam' ? 'LỊCH THI' : 'Lịch học'})`).join('\n')
      : "Trống lịch.";
    const moodStatus = recentMood ? `${recentMood.score}/5 (${recentMood.note || ''})` : "Chưa cập nhật";

 
    const conversationHistory = lastChats.reverse().flatMap(chat => [
      { role: "user", content: chat.message },
      { role: "assistant", content: chat.response }
    ]);

    const systemPrompt = `
      Bạn là người đồng hành thấu cảm cho sinh viên Việt Nam. Không chẩn đoán y khoa. 
      
      NHIỆM VỤ:
      - Khi người dùng căng thẳng: Lắng nghe, PHẢN CHIẾU cảm xúc, đặt câu hỏi gợi mở.
      - Đề xuất bài tập thư giãn (hít thở, Pomodoro) khi thấy họ stress vì lịch học.
      - Ngôn ngữ: Gen Z, thân thiện, dùng "cậu - mình".

      DỮ LIỆU SINH VIÊN:
      - Mục tiêu: ${goal} | Tâm trạng hiện tại: ${moodStatus}
      - Lịch học hôm nay: ${academicContext}

      🚨 GIAO THỨC CẤP CỨU: Nếu user nhắc đến tự tử, đưa hotline 094 563 3355 ngay!
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...conversationHistory,                   
        { role: "user", content: message }         
      ],
      temperature: 0.7,
      max_tokens: 500, 
    });

    const responseText = completion.choices[0].message.content;

    const newChat = await Chat.create({
      user: userId,
      message,
      response: responseText
    });

    res.json(newChat);

  } catch (error) {
    console.error("❌ Lỗi AI Memory:", error);
    res.status(500).json({ message: "Tớ vẫn đang nhớ lại chuyện tụi mình, nhắn lại cho tớ nhé!" });
  }
};

exports.getChatHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20; 
    const skip = (page - 1) * limit;
    const chats = await Chat.find({ user: req.user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-__v -updatedAt').lean(); 
    res.json({ success: true, data: chats, meta: { currentPage: page, hasMore: chats.length === limit } });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};