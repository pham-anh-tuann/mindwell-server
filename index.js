const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const http = require('http'); 
const { Server } = require('socket.io'); 
const { filterBadWords } = require('./utils/badWords');

const authRoutes = require('./routes/authRoutes');
const moodRoutes = require('./routes/moodRoutes');
const testResultRoutes = require('./routes/testResultRoutes');
const chatRoutes = require('./routes/chatRoutes');
const userRoutes = require('./routes/userRoutes'); 
const contentRoutes = require('./routes/contentRoutes');
const testRoutes = require('./routes/testRoutes');
const studySessionRoutes = require('./routes/studySessionRoutes');
const taskRoutes = require('./routes/taskRoutes'); 
const startCronJobs = require('./cronJobs');
const communityRoutes = require('./routes/communityRoutes');
const path = require('path');

dotenv.config();
connectDB();

const app = express();

const server = http.createServer(app); 
const io = new Server(server, {
  cors: {
    origin: '*', 
    methods: ['GET', 'POST']
  }
});

app.use(cors({
  origin: true, 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use((req, res, next) => {
  console.log(`👉 [${req.method}] ${req.url}`);
  if (req.body && req.body.avatar && req.body.avatar.length > 100) {
    const preview = { ...req.body };
    preview.avatar = 'DATA_ẢNH_RẤT_DÀI_(ĐÃ_ẨN)';
    console.log("Dữ liệu gửi lên:", preview);
  } else {
    console.log("Dữ liệu gửi lên:", req.body);
  }
  next();
});

io.on('connection', (socket) => {
  console.log('⚡ Có đồng đạo vừa kết nối Community:', socket.id);
  

  console.log('🚨 CHÚ Ý: ĐÂY LÀ BẢN CODE ĐÃ CÓ LỆNH RESET!!!');


  socket.on('send_community_msg', async (data) => {
    try {
      const User = require('./models/User'); 
      const CommunityChat = require('./models/CommunityChat');
      const userId = data.user._id;
  
      const userProfile = await User.findById(userId);
      if (!userProfile) return;
  
      if (data.text.trim() === '/reset') {
        userProfile.status = 'active';
        userProfile.violationCount = 0;
        await userProfile.save();
        
        await CommunityChat.deleteMany({}); 
        
        socket.emit('receive_community_msg', {
          _id: 'sys_' + Date.now(),
          text: '✅ Đã xóa toàn bộ lịch sử chat và mở khóa tài khoản! Hãy thoát ra vào lại nhóm chat rồi test từ bậy nhé.',
          createdAt: new Date(),
          user: { _id: 'system', name: 'Hệ thống', avatar: 'https://cdn-icons-png.flaticon.com/512/564/564619.png' }
        });
        return;
      }
  
      if (userProfile.status === 'banned') {
        if (userProfile.bannedUntil > new Date()) {
          socket.emit('receive_community_msg', {
            _id: 'sys_' + Date.now(),
            text: `🚫 Tài khoản của bạn đang bị khóa chat 24h do vi phạm ngôn từ.`,
            createdAt: new Date(),
            user: { _id: 'system', name: 'Hệ thống', avatar: 'https://cdn-icons-png.flaticon.com/512/564/564619.png' }
          });
          return;
        } else {
          userProfile.status = 'active';
          userProfile.violationCount = 0;
        }
      }
  
      const { isBad, filteredText } = filterBadWords(data.text);
      
      const savedMsg = await CommunityChat.create({
        user: data.user,
        text: filteredText, 
        createdAt: new Date()
      });
      
      io.emit('receive_community_msg', savedMsg.toJSON());
  
      if (isBad) {
        userProfile.violationCount = (userProfile.violationCount || 0) + 1;
  
        if (userProfile.violationCount >= 3) {
          userProfile.status = 'banned';
          userProfile.bannedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
          await userProfile.save();
  
          socket.emit('receive_community_msg', {
            _id: 'sys_' + Date.now(),
            text: `🚫 Bạn đã văng tục 3 lần. Khóa chat 24 giờ!`,
            createdAt: new Date(),
            user: { _id: 'system', name: 'Hệ thống', avatar: 'https://cdn-icons-png.flaticon.com/512/564/564619.png' }
          });
          return; 
        }
        
        await userProfile.save();
      }
  
    } catch (err) {
      console.log("❌ Lỗi kiểm duyệt chat:", err);
    }
});

socket.on('delete_msg', async (data) => {
  try {
    const CommunityChat = require('./models/CommunityChat');
    await CommunityChat.findByIdAndUpdate(data.msgId, { isDeleted: true, text: 'Tin nhắn đã được thu hồi' });
    io.emit('msg_deleted', { msgId: data.msgId });
  } catch (err) { console.log(err); }
});

socket.on('react_msg', async (data) => {
  try {
    const CommunityChat = require('./models/CommunityChat');
    const { msgId, userId, userName, emoji } = data;
    
    const msg = await CommunityChat.findById(msgId);
    const existingReaction = msg.reactions.find(r => r.userId === userId && r.emoji === emoji);
    
    if (existingReaction) {
      msg.reactions = msg.reactions.filter(r => !(r.userId === userId && r.emoji === emoji));
    } else {
      msg.reactions.push({ userId, userName, emoji });
    }
    
    await msg.save();
    io.emit('msg_reacted', { msgId, reactions: msg.reactions });
  } catch (err) { console.log(err); }
});

socket.on('send_sticker', async (data) => {
  const CommunityChat = require('./models/CommunityChat');
  const savedMsg = await CommunityChat.create({
    user: data.user,
    sticker: data.stickerUrl,
    createdAt: new Date()
  });
  io.emit('receive_community_msg', savedMsg);
});

  socket.on('typing', (data) => {
    socket.broadcast.emit('someone_typing', data.name);
  });

  socket.on('stop_typing', () => {
    socket.broadcast.emit('someone_stopped_typing');
  });

  socket.on('disconnect', () => {
    console.log('🔥 Một người đã rời phòng chat');
  });
});

app.get('/', (req, res) => {
  res.send('🚀 MindWell API & Community Chat đang hoạt động...');
});

app.use('/api/auth', authRoutes);
app.use('/api/mood', moodRoutes);
app.use('/api/test-results', testResultRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/users', userRoutes);
app.use('/api/habits', require('./routes/habitRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/tests', testRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/tasks', taskRoutes);
app.use('/api/sessions', studySessionRoutes);
app.use('/api/community', communityRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const PORT = process.env.PORT || 5000;
startCronJobs();

server.listen(PORT, () => {
  console.log(`🚀 Server MindWell đang chạy tại port ${PORT}`);
});

module.exports = app;