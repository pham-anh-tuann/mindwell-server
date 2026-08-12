const cron = require('node-cron');
const { Expo } = require('expo-server-sdk'); 
const expo = new Expo();

const Notification = require('./models/Notification');
const User = require('./models/User');
const StudySession = require('./models/StudySession'); 
const Task = require('./models/Task'); 

const createNotificationForAllUsers = async (type, title, desc, timeString) => {
    try {
        const users = await User.find({});
        if (users.length === 0) return;

        const notifications = users.map(user => ({
            userId: user._id,
            type: type, 
            title: title,
            desc: desc,
            time: timeString
        }));

        await Notification.insertMany(notifications);
        console.log(`[Cron Job] Đã tạo thông báo "${title}" cho ${users.length} user lúc ${timeString}.`);
    } catch (error) {
        console.error(`[Cron Job Lỗi] Không thể tạo thông báo ${type}:`, error);
    }
};

const startCronJobs = () => {
    console.log("⏰ Trạm CronJob đã kích hoạt toàn bộ tính năng!");

    cron.schedule('0 9,13 * * *', () => {
        const currentHour = new Date().getHours(); 
        const timeStr = currentHour === 9 ? '09:00' : '13:00';
        createNotificationForAllUsers(
            'water', 'Đã đến giờ uống nước! 💧', 'Đừng quên uống một cốc nước để thanh lọc cơ thể nhé!', timeStr
        );
    });

    cron.schedule('0 20 * * *', () => {
        createNotificationForAllUsers(
            'mood', 'Check-in cảm xúc nào! 😊', 'Hôm nay của bạn thế nào? Dành 1 phút để ghi lại cảm xúc nhé!', '20:00'
        );
    });

    cron.schedule('0 23 * * *', () => {
        createNotificationForAllUsers(
            'sleep', 'Đến giờ đi ngủ rồi! 🌙', 'Hãy đặt điện thoại xuống và nhắm mắt lại. Chúc bạn ngủ thật ngon!', '23:00'
        );
    });

    cron.schedule('*/5 * * * *', async () => {
        try {
            const thirtyFiveMinsAgo = new Date(Date.now() - 35 * 60 * 1000);
            const result = await StudySession.updateMany(
                { status: 'running', createdAt: { $lt: thirtyFiveMinsAgo } },
                { $set: { status: 'failed', endTime: Date.now() } }
            );

            if (result.modifiedCount > 0) {
                console.log(`[BOT QUÉT RÁC] 🧹 Đã tiêu diệt ${result.modifiedCount} phiên học Zombie bị kẹt!`);
            }
        } catch (error) {
            console.error("[BOT QUÉT RÁC] Lỗi khi dọn dẹp:", error.message);
        }
    });


    cron.schedule('* * * * *', async () => {
        try {
            const now = new Date();
            now.setSeconds(0, 0);
            const startOfMinute = new Date(now.getTime());
            const endOfMinute = new Date(now.getTime() + 59999);

            const tasksToNotify = await Task.find({
                startTime: { $gte: startOfMinute, $lte: endOfMinute }
            }).populate('userId');

            if (tasksToNotify.length === 0) return; 

            console.log(`🎯 Đến giờ cho ${tasksToNotify.length} môn học! Xử lý ngay...`);

            let messages = [];

            for (let task of tasksToNotify) {
                const user = task.userId;
                if (!user) continue;

                const title = "⏰ MindWell: Tới giờ cày rồi sếp ơi!";
                const body = `Môn: ${task.title} đã đến giờ rồi. Vào học thôi!`;

                try {
                    await Notification.create({
                        userId: user._id,
                        type: 'study',
                        title: title,
                        desc: body,
                        read: false,
                    });
                } catch (dbErr) {
                    console.log("❌ Lỗi ghi lịch sử báo môn học:", dbErr);
                }

                if (user.pushToken && Expo.isExpoPushToken(user.pushToken)) {
                    messages.push({
                        to: user.pushToken,
                        sound: 'default',
                        title: title,
                        body: body,
                        data: { taskId: task._id },
                    });
                }
            }

            if (messages.length > 0) {
                let chunks = expo.chunkPushNotifications(messages);
                for (let chunk of chunks) {
                    try {
                        await expo.sendPushNotificationsAsync(chunk);
                    } catch (error) {
                        console.error('❌ Lỗi bắn thông báo môn học:', error);
                    }
                }
                console.log(`✅ Đã bắn ${messages.length} phát chuông báo môn học!`);
            }

        } catch (error) {
            console.error("❌ Lỗi hệ thống Job Báo thức môn học:", error);
        }
    });
};

module.exports = startCronJobs;