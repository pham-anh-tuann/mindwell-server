const Task = require('../models/Task');

exports.createTask = async (req, res) => {
  try {
    const { title, description, startTime, endTime, type, targetPomodoros, colorTag, location } = req.body;
    
    const userId = req.user ? req.user.id : req.body.userId; 

    if (!title || !startTime || !endTime) {
      return res.status(400).json({ success: false, message: 'Thiếu tiêu đề hoặc thời gian học/thi!' });
    }

    const newTask = await Task.create({
      userId,
      title,
      description,
      startTime: new Date(startTime), 
      endTime: new Date(endTime), 
      type,
      targetPomodoros,
      colorTag,
      location
    });

    res.status(201).json({ success: true, data: newTask });
  } catch (error) {
    console.error("Lỗi tạo Task:", error);
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

exports.getTasks = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : req.query.userId;
    const { startDate, endDate } = req.query;

    let query = { userId };

    if (startDate && endDate) {
        query.startTime = { 
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        };
    }

    const tasks = await Task.find(query).sort({ startTime: 1 }); 
    res.status(200).json({ success: true, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};
exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params; 
    
    const deletedTask = await Task.findByIdAndDelete(id);
    
    if (!deletedTask) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lịch trình này!' });
    }

    res.status(200).json({ success: true, message: 'Đã xóa lịch trình thành công!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server khi xóa', error: error.message });
  }
};