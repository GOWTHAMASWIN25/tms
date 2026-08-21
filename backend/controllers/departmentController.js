const Department = require('../models/Department');

exports.createDepartment = async (req, res) => {
  try {
    const { name, shortName, description } = req.body;

    const department = new Department({
      name,
      shortName,
      description,
    });

    await department.save();
    res.status(201).json({ message: 'Department created successfully', department });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create department', error: error.message });
  }
};

exports.getDepartments = async (req, res) => {
  try {
    const departments = await Department.find({ isActive: true });
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch departments', error: error.message });
  }
};

exports.getDepartmentById = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }
    res.json(department);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch department', error: error.message });
  }
};

exports.updateDepartment = async (req, res) => {
  try {
    const { name, shortName, description } = req.body;
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      { name, shortName, description },
      { new: true, runValidators: true }
    );
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }
    res.json({ message: 'Department updated successfully', department });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update department', error: error.message });
  }
};

exports.deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }
    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete department', error: error.message });
  }
};
