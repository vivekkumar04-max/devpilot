import mongoose from 'mongoose';

const recentRepositorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  description: { type: String, default: '' },
  language: { type: String, default: '' },
  defaultBranch: { type: String, default: '' },
  fileCount: { type: Number, default: 0 },
  planSummary: { type: String, default: '' },
  lastAnalyzed: { type: Date, default: Date.now },
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  avatarDataUrl: { type: String, default: '' },
  recentRepositories: { type: [recentRepositorySchema], default: [] },
}, { timestamps: true });

export default mongoose.model('User', userSchema);
