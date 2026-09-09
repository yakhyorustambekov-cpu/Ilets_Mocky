const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// GET /api/profile
router.get('/', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        profile: true,
        randomizationCycles: true,
        _count: {
          select: {
            testAttempts: true,
            fullMockAttempts: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password, ...safeUser } = user;
    res.json(safeUser);
  } catch (error) {
    next(error);
  }
});

// PUT /api/profile
router.put('/', async (req, res, next) => {
  try {
    const { firstName, lastName, targetBand, examDate, phone, bio } = req.body;

    const userUpdate = {};
    if (firstName) userUpdate.firstName = firstName;
    if (lastName) userUpdate.lastName = lastName;

    const profileUpdate = {};
    if (targetBand !== undefined) profileUpdate.targetBand = targetBand ? parseFloat(targetBand) : null;
    if (examDate !== undefined) profileUpdate.examDate = examDate;
    if (phone !== undefined) profileUpdate.phone = phone;
    if (bio !== undefined) profileUpdate.bio = bio;

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...userUpdate,
        profile: {
          upsert: {
            create: profileUpdate,
            update: profileUpdate,
          },
        },
      },
      include: {
        profile: true,
      },
    });

    const { password, ...safeUser } = updatedUser;
    res.json(safeUser);
  } catch (error) {
    next(error);
  }
});

// PUT /api/profile/password
router.put('/password', async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashed },
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
