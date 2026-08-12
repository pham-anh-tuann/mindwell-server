const User = require('../models/User');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

exports.register = async (req, res) => {
  try {
    const { name, email, password, onboarding } = req.body; 
    console.log("👉 [Register] Đang đăng ký cho:", email);
    console.log("👉 [Register] Dữ liệu khảo sát:", onboarding); 

    const userExists = await User.findOne({ email });
    if (userExists) {
      console.log("❌ [Register] Email đã tồn tại");
      return res.status(400).json({ message: 'Email đã tồn tại!' });
    }

    const user = await User.create({
      name,
      email,
      password,
      onboardingData: onboarding || {} 
    });

    if (user) {
      console.log("✅ [Register] Tạo tài khoản thành công!");
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        message: 'Đăng ký thành công! 🎉'
      });
    } else {
      res.status(400).json({ message: 'Không thể tạo người dùng' });
    }

  } catch (error) {
    console.error("❌ [Register Error]:", error.message);
    res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`👉 [Login Request] Email: ${email}`);

    const user = await User.findOne({ email });
    console.log("1. Tìm User trong DB:", user ? "✅ CÓ THẤY" : "❌ KHÔNG THẤY");

    if (!user) {
      return res.status(400).json({ message: 'Email hoặc mật khẩu không chính xác!' });
    }

    const isMatch = await user.matchPassword(password);
    console.log("2. So sánh mật khẩu:", isMatch ? "✅ KHỚP" : "❌ KHÔNG KHỚP");

    if (!isMatch) {
      return res.status(400).json({ message: 'Email hoặc mật khẩu không chính xác!' });
    }

    if (user.status === 'banned') {
      console.log("❌ [Login] TỪ CHỐI: Tài khoản đang bị khóa.");
      return res.status(403).json({ message: 'Tài khoản của bạn đã bị Admin khóa!' });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'mindwell_secret',
      { expiresIn: '30d' }
    );

    console.log("✅ Đăng nhập thành công!");

    res.json({
      message: 'Đăng nhập thành công!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        gender: user.gender,
        dob: user.dob,
        isAdmin: user.isAdmin,
        role: user.role || (user.isAdmin ? 'super_admin' : 'student')
      }
    });

  } catch (error) {
    console.error("❌ [Login Error]:", error.message);
    res.status(500).json({ message: 'Lỗi Server: ' + error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.gender = req.body.gender || user.gender;
      user.dob = req.body.dob || user.dob;
      user.avatar = req.body.avatar || user.avatar;

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        gender: updatedUser.gender,
        dob: updatedUser.dob,
      });
    } else {
      res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User không tồn tại' });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng!' });
    }

    user.password = newPassword;
    await user.save();
    
    res.json({ message: 'Đổi mật khẩu thành công!' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    console.log(`👉 [Forgot Password] Yêu cầu từ email: ${email}`);

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Email này không tồn tại trên hệ thống!' });
    }

    const newPassword = Math.random().toString(36).slice(-8);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS 
      }
    });

    const mailOptions = {
      from: `"Hỗ trợ MindWell" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Khôi phục mật khẩu MindWell',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2 style="color: #047857;">Chào ${user.name},</h2>
          <p>Chúng tôi nhận được yêu cầu khôi phục mật khẩu của bạn.</p>
          <p>Mật khẩu mới của bạn là: <strong style="font-size: 18px; color: #165C51;">${newPassword}</strong></p>
          <p>Vui lòng đăng nhập lại và đổi mật khẩu ngay để bảo mật tài khoản nhé!</p>
          <hr />
          <p style="font-size: 12px; color: #777;">Nếu bạn không yêu cầu điều này, hãy bỏ qua email.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    
    user.password = newPassword;
    await user.save();

    console.log(`✅ Đã gửi mật khẩu mới cho: ${email}`);
    res.json({ success: true, message: 'Mật khẩu mới đã được gửi vào email của bạn!' });

  } catch (error) {
    console.error("❌ [Forgot Password Error]:", error.message);
    res.status(500).json({ message: 'Lỗi gửi mail: ' + error.message });
  }
};