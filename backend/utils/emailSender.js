const nodemailer = require('nodemailer');
const SmtpConfig = require('../models/SmtpConfig');
const crypto = require('crypto');

const ALGO = 'aes-256-ctr';
// Clé de 32 caractères hexadécimaux pour AES-256
// Clé hexadécimale de 64 caractères (32 octets) pour AES-256
const SECRET = process.env.SMTP_SECRET || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

function encrypt(text) {
  console.log('[ENCRYPT] ALGO:', ALGO, '| SECRET length:', SECRET.length, '| SECRET:', SECRET);
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGO, Buffer.from(SECRET, 'hex'), iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  } catch (e) {
    console.error('[ENCRYPT ERROR]', e);
    throw e;
  }
}

function decrypt(text) {
  console.log('[DECRYPT] ALGO:', ALGO, '| SECRET length:', SECRET.length, '| SECRET:', SECRET);
  try {
    const [ivHex, contentHex] = text.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encryptedText = Buffer.from(contentHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGO, Buffer.from(SECRET, 'hex'), iv);
    const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
    return decrypted.toString();
  } catch (e) {
    console.error('[DECRYPT ERROR]', e);
    throw e;
  }
}

async function getSmtpConfig() {
  // Récupère la dernière config SMTP
  const config = await SmtpConfig.findOne().sort({ createdAt: -1 });
  if (!config) throw new Error('Aucune configuration SMTP trouvée');
  return {
    email: config.email,
    password: decrypt(config.password),
    host: config.host,
    port: config.port,
    secure: config.secure,
  };
}

async function sendMail({ to, subject, text, html }) {
  const smtp = await getSmtpConfig();
  if (!smtp.email || !smtp.password || !smtp.host || !smtp.port) {
    throw new Error('Configuration SMTP incomplète');
  }
  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: {
      user: smtp.email,
      pass: smtp.password,
    },
  });
  return transporter.sendMail({
    from: smtp.email,
    to,
    subject,
    text,
    html,
  });
}

module.exports = { sendMail, encrypt, decrypt };
