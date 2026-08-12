const Habit = require('../models/Habit');

exports.getMyHabits = async (req, res) => {
  try {
    let habits = await Habit.find({ user: req.user._id });

    if (habits.length === 0) {
      const defaultHabits = [
        {
          user: req.user._id,
          title: 'Uống đủ nước',
          description: 'Đảm bảo uống đủ 8 ly nước mỗi ngày.',
          iconName: 'water',
          isCustom: false
        },
        {
          user: req.user._id,
          title: 'Thiền 5 phút',
          description: 'Dành 5 phút tĩnh tâm mỗi sáng.',
          iconName: 'meditation',
          isCustom: false
        },
        {
          user: req.user._id,
          title: 'Đọc sách 15 phút',
          description: 'Đọc sách để thư giãn đầu óc.',
          iconName: 'book',
          isCustom: false
        },
        {
          user: req.user._id,
          title: 'Đi bộ 30 phút',
          description: 'Vận động nhẹ nhàng cải thiện tâm trạng.',
          iconName: 'walk',
          isCustom: false
        },
        {
          user: req.user._id,
          title: 'Viết Nhật Ký',
          description: 'Ghi lại 3 điều biết ơn trong ngày.',
          iconName: 'journal',
          isCustom: false
        }
      ];

      await Habit.insertMany(defaultHabits);
      
      habits = await Habit.find({ user: req.user._id });
    }

    res.json(habits);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createHabit = async (req, res) => {
  try {
    const { title, description, iconName, isCustom } = req.body;
    const habit = await Habit.create({
      user: req.user._id,
      title,
      description,
      iconName,
      isCustom
    });
    res.status(201).json(habit);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.toggleHabitStatus = async (req, res) => {
  try {
    const { date } = req.body; 
    const habit = await Habit.findById(req.params.id);

    if (!habit) return res.status(404).json({ message: 'Không tìm thấy thói quen' });

    const dateIndex = habit.completedDates.indexOf(date);
    if (dateIndex > -1) {
      habit.completedDates.splice(dateIndex, 1); 
    } else {
      habit.completedDates.push(date); 
    }

    await habit.save();
    res.json(habit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteHabit = async (req, res) => {
  try {
    const habit = await Habit.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!habit) return res.status(404).json({ message: 'Không tìm thấy thói quen để xóa' });
    res.json({ message: 'Đã xóa thói quen' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};