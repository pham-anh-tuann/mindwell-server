const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');

const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.json(notifications);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi khi tải thông báo' });
    }
});

router.put('/:id/read', protect, async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(req.params.id, { read: true });
        res.json({ message: 'Đã đánh dấu đọc' });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});
router.delete('/clear-all', protect, async (req, res) => {
    try {
        await Notification.deleteMany({ userId: req.user._id });
        res.json({ message: 'Đã dọn sạch lịch sử' });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});
router.delete('/:id', protect, async (req, res) => {
    try {
        await Notification.findByIdAndDelete(req.params.id);
        res.json({ message: 'Đã xóa thành công' });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

router.post('/test-create', protect, async (req, res) => {
    try {
       const newNotif = new Notification({
           userId: req.user._id,
           type: req.body.type || 'water',
           title: req.body.title || 'Uống nước nào! 💧',
           desc: req.body.desc || 'Hệ thống gửi thông báo từ Server.',
           time: 'Vừa xong'
       });
       await newNotif.save();
       res.status(201).json(newNotif);
    } catch(err) {
       res.status(500).json({ message: 'Lỗi server' });
    }
});

module.exports = router;