const User = require('../models/User');
const bcrypt = require('bcryptjs');

exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      res.json({
        _id: user._id, name: user.name, email: user.email,
        phone: user.phone, avatar: user.avatar || '', gender: user.gender,
        dob: user.dob, isAdmin: user.isAdmin,
        role: user.role || (user.isAdmin ? 'super_admin' : 'student') 
      });
    } else {
      res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.name = req.body.name || user.name;
      user.gender = req.body.gender || user.gender;
      user.dob = req.body.dob || user.dob;
      user.avatar = req.body.avatar || user.avatar;
      user.phone = req.body.phone || user.phone;

      const updatedUser = await user.save();
      res.json({
        _id: updatedUser._id, name: updatedUser.name, email: updatedUser.email,
        gender: updatedUser.gender, dob: updatedUser.dob,
        avatar: updatedUser.avatar, phone: updatedUser.phone, token: req.body.token
      });
    } else {
      res.status(404).json({ message: 'Không tìm thấy User' });
    }
  } catch (error) {
    console.error("Lỗi update profile:", error);
    res.status(500).json({ message: 'Lỗi server khi cập nhật hồ sơ' });
  }
};

exports.changeUserPassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

    if (await user.matchPassword(oldPassword)) {
      user.password = newPassword;
      await user.save();
      res.json({ message: 'Đổi mật khẩu thành công!' });
    } else {
      res.status(401).json({ message: 'Mật khẩu cũ không đúng' });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

exports.createAdminAccount = async (req, res) => {
  try {
    const { name, email, phone, role } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "Email này đã tồn tại trong hệ thống!" });

    const newAdmin = await User.create({
      name, email, phone,
      password: "Mindwell@123", 
      isAdmin: true, role: role || 'admin', avatar: "" 
    });

    res.status(201).json({ 
      message: "Tạo tài khoản Admin thành công!", 
      admin: { _id: newAdmin._id, name: newAdmin.name, email: newAdmin.email, role: newAdmin.role } 
    });
  } catch (error) {
    console.error("Lỗi tạo Admin:", error);
    res.status(500).json({ message: "Lỗi máy chủ khi tạo tài khoản!" });
  }
};

exports.getAllUsersForAdmin = async (req, res) => {
  try {
    const users = await User.find({ isAdmin: { $ne: true } }).sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy dữ liệu sinh viên' });
  }
};

exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy sinh viên' });
    
    user.status = user.status === 'active' ? 'banned' : 'active';
    await user.save();
    
    res.json({ message: `Đã ${user.status === 'active' ? 'mở khóa' : 'khóa'} tài khoản thành công!`, status: user.status });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy sinh viên' });
    res.json({ message: 'Đã xóa tài khoản vĩnh viễn!' });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await User.find({ isAdmin: true }).select('-password').sort({ createdAt: -1 });
    res.json(admins);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy dữ liệu nhân sự' });
  }
};