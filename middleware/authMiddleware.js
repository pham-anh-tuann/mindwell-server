const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'Tài khoản này không còn tồn tại trên hệ thống!' });
      }

      if (req.user.status === 'banned') {
        return res.status(403).json({ message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin!' });
      }

      next();
    } catch (error) {
      res.status(401).json({ message: 'Không có quyền truy cập, token hỏng hoặc hết hạn' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Không có quyền truy cập, thiếu Token!' });
  }
};

module.exports = { protect };