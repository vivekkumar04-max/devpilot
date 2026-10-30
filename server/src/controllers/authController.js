import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const publicUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  avatarDataUrl: user.avatarDataUrl || '',
});

const createToken = (user) =>
  jwt.sign({ userId: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '7d' });

export async function register(req, res) {
  try {
    const { name, email, password } = req.body;
    if (!name?.trim() || !email?.trim() || !password || password.length < 8) {
      return res.status(400).json({ message: 'Name, email, and a password of at least 8 characters are required.' });
    }
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) return res.status(409).json({ message: 'An account with this email already exists.' });
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash: await bcrypt.hash(password, 12),
    });
    res.status(201).json({ token: createToken(user), user: publicUser(user) });
  } catch (error) {
    res.status(500).json({ message: 'Could not register user.', detail: error.message });
  }
}

export async function login(req, res) {
  try {
    const user = await User.findOne({ email: String(req.body.email || '').toLowerCase().trim() });
    if (!user || !(await bcrypt.compare(req.body.password || '', user.passwordHash))) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    res.json({ token: createToken(user), user: publicUser(user) });
  } catch (error) {
    res.status(500).json({ message: 'Could not log in.', detail: error.message });
  }
}

export async function getProfile(req, res) {
  try {
    const user = await User.findById(req.userId).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({
      user: publicUser(user),
      recentRepositories: [...(user.recentRepositories || [])].sort(
        (a, b) => new Date(b.lastAnalyzed) - new Date(a.lastAnalyzed)
      ),
    });
  } catch (error) {
    res.status(500).json({ message: 'Could not load profile.', detail: error.message });
  }
}

export async function updateProfile(req, res) {
  try {
    const updates = {};
    if (typeof req.body.name === 'string') {
      const name = req.body.name.trim();
      if (!name || name.length > 80) {
        return res.status(400).json({ message: 'Name must contain 1 to 80 characters.' });
      }
      updates.name = name;
    }

    if (typeof req.body.avatarDataUrl === 'string') {
      const avatar = req.body.avatarDataUrl;
      if (avatar && !/^data:image\/(png|jpeg|webp);base64,/.test(avatar)) {
        return res.status(400).json({ message: 'Profile image must be PNG, JPEG, or WebP.' });
      }
      if (avatar.length > 1_100_000) {
        return res.status(413).json({ message: 'Profile image is too large. Choose an image under 750 KB.' });
      }
      updates.avatarDataUrl = avatar;
    }

    if (!Object.keys(updates).length) {
      return res.status(400).json({ message: 'Provide a name or profile image to update.' });
    }

    const user = await User.findByIdAndUpdate(req.userId, { $set: updates }, {
      new: true,
      runValidators: true,
    });
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ user: publicUser(user) });
  } catch (error) {
    res.status(500).json({ message: 'Could not update profile.', detail: error.message });
  }
}
