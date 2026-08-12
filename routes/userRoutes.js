const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const mongoose = require('mongoose'); 
const User = require('../models/User');

router.get('/profile', protect, userController.getUserProfile);
router.put('/profile', protect, userController.updateUserProfile);
router.put('/password', protect, userController.changeUserPassword);

router.get('/admin/all', protect, userController.getAllUsersForAdmin); 
router.put('/admin/user/:id/status', protect, userController.toggleUserStatus); 
router.delete('/admin/user/:id', protect, userController.deleteUser); 
router.post('/create-admin', protect, userController.createAdminAccount);
router.get('/admin/list-admins', protect, userController.getAllAdmins);

router.put('/admin/user/:id', protect, async (req, res) => {
    try {
        const User = mongoose.model('User'); 
        const { name, phone, role } = req.body;
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { name, phone, role },
            { new: true }
        );
        if (!updatedUser) return res.status(404).json({ message: "Không tìm thấy nhân sự này" });
        res.json({ message: "Cập nhật thành công!", data: updatedUser });
    } catch (error) {
        console.error("Lỗi cập nhật Admin:", error);
        res.status(500).json({ message: "Lỗi server khi cập nhật" });
    }
});

router.post('/push-token', protect, async (req, res) => {
  try {
    const { userId, token } = req.body;
    if (!userId || !token) {
      return res.status(400).json({ message: "Thiếu thông tin!" });
    }
    await User.findByIdAndUpdate(userId, { pushToken: token });
    res.json({ success: true, message: "Đã nạp đạn (Push Token) thành công!" });
  } catch (error) {
    console.error("Lỗi lưu Push Token:", error);
    res.status(500).json({ success: false, message: "Lỗi Server" });
  }
});

module.exports = router;