const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const prisma = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Too many attempts, please try again later' },
});

function generateToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
}

function setTokenCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
}

function sanitizeUser(user) {
  if (!user) return null;
  const { password, ...safe } = user;
  return safe;
}

// POST /api/auth/signup
router.post('/signup', authLimiter, async (req, res, next) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const candidateNumber = `CDI-${Math.floor(100000 + Math.random() * 900000)}`;

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashed,
        firstName,
        lastName,
        candidateNumber,
        role: 'STUDENT',
        profile: {
          create: {
            targetBand: 7.0,
          },
        },
        randomizationCycles: {
          create: [
            { section: 'LISTENING', currentCycle: 1 },
            { section: 'READING', currentCycle: 1 },
            { section: 'WRITING', currentCycle: 1 },
          ],
        },
      },
      include: {
        profile: true,
      },
    });

    const token = generateToken(user);
    setTokenCookie(res, token);

    res.status(201).json({ user: sanitizeUser(user), token });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { profile: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user);
    setTokenCookie(res, token);

    res.json({ user: sanitizeUser(user), token });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/logout
router.post('/logout', (_req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { profile: true },
    });
    res.json({ user: sanitizeUser(user) });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', authLimiter, async (req, res, next) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ error: 'Email and new password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (user) {
      const hashed = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashed },
      });
    }

    // Always return success for security
    res.json({ message: 'If the email exists, the password has been reset' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
