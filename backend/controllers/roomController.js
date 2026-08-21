const Room = require('../models/Room');

exports.createRoom = async (req, res) => {
  try {
    const { roomNumber, department, programme, block, floor, capacity, description } = req.body;

    const room = new Room({
      roomNumber,
      department,
      programme,
      block,
      floor,
      capacity,
      description,
    });

    await room.save();
    res.status(201).json({ message: 'Room created successfully', room });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create room', error: error.message });
  }
};

exports.getRooms = async (req, res) => {
  try {
    const { departmentId, programmeId, blockId } = req.query;
    const query = { isActive: true };
    if (departmentId) query.department = departmentId;
    if (programmeId) query.programme = programmeId;
    if (blockId) query.block = blockId;

    const rooms = await Room.find(query)
      .populate('department')
      .populate('programme')
      .populate('block');
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch rooms', error: error.message });
  }
};

exports.getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('department')
      .populate('programme')
      .populate('block');
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.json(room);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch room', error: error.message });
  }
};

exports.updateRoom = async (req, res) => {
  try {
    const { roomNumber, department, programme, block, floor, capacity, description } = req.body;
    const room = await Room.findByIdAndUpdate(
      req.params.id,
      { roomNumber, department, programme, block, floor, capacity, description },
      { new: true, runValidators: true }
    );
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.json({ message: 'Room updated successfully', room });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update room', error: error.message });
  }
};

exports.deleteRoom = async (req, res) => {
  try {
    const room = await Room.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete room', error: error.message });
  }
};
