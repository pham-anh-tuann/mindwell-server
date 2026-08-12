const Test = require('../models/Test'); 

exports.getTests = async (req, res) => {
  try {
    const tests = await Test.find({ isActive: true }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: tests.length, data: tests });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

exports.createTest = async (req, res) => {
  try {
    const newTest = await Test.create(req.body);
    res.status(201).json({ success: true, data: newTest });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Lỗi tạo bài test', error: error.message });
  }
};


exports.getTestById = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài test này' });
    }
    res.status(200).json({ success: true, data: test });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};
exports.updateTest = async (req, res) => {
  try {
    const testId = req.params.id;
    

    const updatedTest = await Test.findByIdAndUpdate(
      testId, 
      req.body, 
      { new: true, runValidators: true }
    );

    if (!updatedTest) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài test này' });
    }

    res.status(200).json({ success: true, message: 'Đã cập nhật bài test!', data: updatedTest });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Mã bài test này đã bị trùng với bài khác!' });
    }
    res.status(500).json({ success: false, message: 'Lỗi khi cập nhật bài test', error: error.message });
  }
};
exports.deleteTest = async (req, res) => {
  try {
    const testId = req.params.id;

    const deletedTest = await Test.findByIdAndUpdate(
      testId,
      { isActive: false },
      { new: true }
    );

    if (!deletedTest) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài test này' });
    }

    res.status(200).json({ success: true, message: 'Đã xóa bài test thành công', data: deletedTest });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi xóa bài test', error: error.message });
  }
};