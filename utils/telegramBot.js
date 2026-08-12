const axios = require('axios');
require('dotenv').config(); 

const sendTelegramAlert = async (studentName, testTitle, result) => {
  const token = process.env.TELEGRAM_BOT_TOKEN; 
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const adminUrl = process.env.ADMIN_WEB_URL || 'http://localhost:5173';
  
  const message = `🚨 <b>CẢNH BÁO KHẨN CẤP (RED FLAG)</b> 🚨\n\n` +
                  `👤 Sinh viên: <b>${studentName}</b>\n` +
                  `📝 Bài test: ${testTitle}\n` +
                  `📊 Kết quả: <b>${result}</b>\n\n` +
                  `👉 <a href="${adminUrl}">Bấm vào đây để mở Web Admin xử lý ngay!</a>`;

  try {
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML', 
      disable_web_page_preview: true 
    });
    console.log("✈️ Đã bắn báo động vào Group Telegram!");
  } catch (error) {
    console.error("❌ Lỗi gửi Telegram:", error.message);
  }
};

module.exports = sendTelegramAlert;