const mongoose = require('mongoose');

const SmtpConfigSchema = new mongoose.Schema({
  email: { type: String, required: true },
  password: { type: String, required: true }, // Stocké chiffré
  host: { type: String, required: true },
  port: { type: Number, required: true },
  secure: { type: Boolean, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('SmtpConfig', SmtpConfigSchema);
