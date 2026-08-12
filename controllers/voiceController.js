const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const Chat = require('../models/Chat'); 

exports.analyzeVoiceChat = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "Không tìm thấy file ghi âm" });

    const originalPath = req.file.path;
    const newPath = originalPath + '.m4a';
    fs.renameSync(originalPath, newPath);

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(newPath),
      model: "whisper-1",
      prompt: "Hãy giữ nguyên các từ ngập ngừng như ừm, à, dạ...",
    });

    const userText = transcription.text;

    let conversationHistory = [];
    if (req.body.history) {
      try { conversationHistory = JSON.parse(req.body.history); } catch (e) {}
    }

    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { 
          role: "system", 
          content: `Bạn là Dr. Mind - một chuyên gia tâm lý học đường thấu cảm, ấm áp và thân thiện.
QUY TẮC SỐNG CÒN:
1. XƯNG HÔ: Bắt buộc xưng là "Mình" và gọi người dùng là "Bạn". Tuyệt đối không dùng "Thầy/Cô", "Em".
2. 100% TIẾNG VIỆT THUẦN TÚY: Tuyệt đối KHÔNG chèn từ tiếng Anh vào câu.
3. ĐỒNG CẢM VÀ GIẢI PHÁP: Xác nhận cảm xúc và gợi ý 1 mẹo nhỏ thực tế.
4. ĐỘ DÀI: Trả lời ngắn gọn khoảng 3-4 câu. BẰNG VĂN BẢN THUẦN TÚY.
BẮT BUỘC trả về định dạng JSON: { "detected_emotion": "1 từ khóa", "reply_text": "Câu trả lời" }` 
        },
        ...conversationHistory,
        { 
          role: "user", 
          content: `${userText}\n\n(Hãy phản hồi bằng định dạng JSON như đã yêu cầu)` 
        }
      ]
    });

    const result = JSON.parse(aiResponse.choices[0].message.content);

    const isCall = req.body.isCallMode === 'true';
    let audioUrl = null;

    if (!isCall) {
      audioUrl = `/uploads/temp_audio/${path.basename(newPath)}`;
      try {
        const userId = req.user._id; 
        await Chat.create({
          user: userId,
          message: userText,            
          response: result.reply_text,  
          audioUrl: audioUrl 
        });
      } catch (dbError) { console.error("Lỗi DB:", dbError); }
    } else {
      fs.unlinkSync(newPath);
    }

    res.status(200).json({
      success: true,
      data: {
        originalText: userText,
        emotion: result.detected_emotion,
        aiReply: result.reply_text,
        audioUrl: audioUrl
      }
    });

  } catch (error) {
    console.error("Lỗi Voice Chat:", error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    if (req.file && fs.existsSync(req.file.path + '.m4a')) fs.unlinkSync(req.file.path + '.m4a');
    res.status(500).json({ success: false, message: "Lỗi hệ thống AI" });
  }
};