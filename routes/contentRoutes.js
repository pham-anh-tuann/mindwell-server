const express = require('express');
const router = express.Router();
const Content = require('../models/Content');

router.get('/daily-tip', async (req, res) => {
  try {
    const allTips = await Content.find({ type: 'tip', status: 'published' }).sort({ createdAt: 1 });

    if (allTips.length === 0) {
      return res.status(404).json({ message: "Chưa có tip nào" });
    }

    const daysSinceEpoch = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    
    const tipIndex = daysSinceEpoch % allTips.length;
    
    const dailyTip = allTips[tipIndex];

    res.json(dailyTip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/news', async (req, res) => {
  try {
    const news = await Content.find({ type: 'news', status: 'published' })
                              .sort({ createdAt: -1 })
                              .limit(50) 
                              .select('-bodyContent');
    res.json(news);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/detail/:id', async (req, res) => {
  try {
    const article = await Content.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } }, 
      { new: true } 
    );

    if (!article) {
      return res.status(404).json({ success: false, message: "Không tìm thấy bài viết" });
    }
    res.json(article);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


router.get('/', async (req, res) => {
  try {
    const contents = await Content.find().sort({ createdAt: -1 });
    res.json({ success: true, data: contents });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const newContent = await Content.create(req.body);
    res.status(201).json({ success: true, data: newContent });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updated = await Content.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Content.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Đã xóa thành công" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;