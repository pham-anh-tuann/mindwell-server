const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = "AIzaSyDxO0nEX5wN2NHBHM4GMVBFTItxaBPUrwI"; 

const genAI = new GoogleGenerativeAI(API_KEY);

async function listMyModels() {
  try {
    console.log("🔍 Đang kiểm tra danh sách Model...");
    const model = genAI.getGenerativeModel({ model: "gemini-pro" }); 
    

    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
    const data = await response.json();

    if (data.models) {
      console.log("✅ DANH SÁCH MODEL CỦA BRO:");
      console.log("---------------------------");
      data.models.forEach(m => {
        if (m.supportedGenerationMethods.includes("generateContent")) {
            console.log(`👉 Tên chuẩn: ${m.name.replace("models/", "")}`);
        }
      });
      console.log("---------------------------");
      console.log("💡 Hãy copy một cái tên ở trên thay vào code cũ là chạy!");
    } else {
      console.log("❌ Lỗi lạ: ", data);
    }

  } catch (error) {
    console.error("❌ Lỗi kết nối:", error.message);
  }
}

listMyModels();