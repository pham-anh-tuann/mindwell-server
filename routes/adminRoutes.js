const express = require('express');
const router = express.Router();
const User = require('../models/User'); 


router.get('/list-admins', async (req, res) => {
    try {
        const admins = await User.find({ role: { $ne: 'student' } }).sort({ createdAt: -1 });
        res.json(admins);
    } catch (error) {
        console.error("Lỗi lấy danh sách Admin:", error);
        res.status(500).json({ message: "Lỗi server khi lấy danh sách" });
    }
});


router.put('/update-info/:id', async (req, res) => {
    try {
        const { name, phone, role } = req.body;
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { name, phone, role },
            { new: true }
        );
        
        if (!updatedUser) return res.status(404).json({ message: "Không tìm thấy Admin này" });
        
        res.json({ message: "Cập nhật thành công!", data: updatedUser });
    } catch (error) {
        console.error("Lỗi cập nhật Admin:", error);
        res.status(500).json({ message: "Lỗi Backend khi lưu dữ liệu" });
    }
});

router.put('/toggle-status/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "Không tìm thấy Admin" });
        
        user.status = user.status === 'banned' ? 'active' : 'banned';
        await user.save();
        
        res.json({ message: "Đã đổi trạng thái thành công", status: user.status });
    } catch (error) {
        console.error("Lỗi đổi trạng thái:", error);
        res.status(500).json({ message: "Lỗi khi thay đổi trạng thái" });
    }
});


router.get('/dashboard-stats', (req, res) => {
    res.json({
        message: "Chào sếp! Đường truyền Admin đã thông.",
        totalUsers: 150,
        totalTests: 45,
        totalPosts: 12
    });
});

module.exports = router;