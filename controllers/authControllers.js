import { pool } from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import crypto from 'crypto';

import { toResponseUser } from "../utils/utils.js";
import { sendEmail } from "../utils/sendEmail.js";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key';
const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:8000';
const MIN_PASSWORD_LENGTH = 8;
const TOKEN_EXP_MS = 3600000;

// POST /api/v1/auth/signup
export const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json('All fields are required.');
        }

        if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
            return res.status(400).json(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
        }

        const existingUser = await pool.query(`SELECT * FROM users WHERE email = $1 OR username = $2`, [email, username]);
        if (existingUser.rows.length > 0) {
            return res.status(400).send('User with this email/username already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const insertQ = `INSERT INTO users (email, username, password_hash) 
                    VALUES($1, $2, $3) 
                    RETURNING id, email, username, created_at`;

        const insertRes = await pool.query(insertQ, [email, username, hashedPassword]);
        const newUser = toResponseUser(insertRes.rows[0]);

        return res.status(201).json({ user: newUser });

    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).send('Internal Server Error');
    }
};

// POST /api/v1/auth/login
export const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).send('Username/password missing.');

        if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
            return res.status(400).json(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
        }

        const result = await pool.query(`SELECT * from users WHERE username = $1`, [username]);
        const user = result.rows[0];

        if (!user) return res.status(404).json({ message: "User not found." });

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) return res.status(401).json({ message: "Invalid Password." });

        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                email: user.email
            },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        const resUser = toResponseUser(user);
        return res.status(200).json({ user: resUser, token });

    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).send('Internal Server Error');
    }
};

// POST /api/v1/auth/forgot-password
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).send('Email is required.');

        const { rows } = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
        const user = rows[0];

        const token = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const expiresAt = new Date(Date.now() + TOKEN_EXP_MS);

        const insertQ = `INSERT INTO password_resets (user_id, token_hash, expires_at) 
                     VALUES ($1, $2, $3) RETURNING id`;

        if (user) {
            await pool.query(insertQ, [user.id, hashedToken, expiresAt]);
        }

        const resetLink = `${APP_BASE_URL.replace(/\/$/, '')}/api/v1/auth/reset-password?token=${encodeURIComponent(token)}`;
        
        const subject = 'Reset your password';
        const html = `
            <p>Hi ${user.username || ''},</p>
            <p>Click the link below to reset your password. This link expires in 1 hour.</p>
            <p><a href="${resetLink}">Reset password</a></p>
            <p>If you did not request this, ignore this email.</p>
        `;
        
        await sendEmail(user.email, subject, `Reset your password: ${resetLink}`, html);

        return res.status(200).json({ message: "Password reset link sent." });

    } catch (err) {
        console.error('forgotPassword error', err);
        return res.status(500).json({ message: 'Server error' });
    }
};

// POST /api/v1/auth/reset-password
export const resetPassword = async (req, res) => {
    try {
        const token = req.query.token || req.params.token;
        const { newPassword } = req.body;
        if (!token || !newPassword) {
            return res.status(400).json({ message: 'Token and new password are required.' });
        }

        if (typeof newPassword !== 'string' || newPassword.length < MIN_PASSWORD_LENGTH) {
            return res.status(400).json({ message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` });
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const selectQ = `
            SELECT pr.id as pr_id, pr.expires_at, pr.used, pr.user_id, u.email, u.username
            FROM password_resets pr
            JOIN users u ON u.id = pr.user_id
            WHERE pr.token_hash = $1
            LIMIT 1
        `;
        const { rows } = await pool.query(selectQ, [hashedToken]);
        const matched = rows[0];

        if (!matched || matched.used) {
            return res.status(400).json({ message: 'Invalid or expired token.' });
        }

        if (new Date(matched.expires_at) < new Date()) {
            return res.status(400).json({ message: 'Invalid or expired token.' });
        }

        // hash new password and update user
        const newHash = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, matched.user_id]);

        // mark the token as used
        await pool.query('UPDATE password_resets SET used = true WHERE id = $1', [matched.pr_id]);

        // sending confirmation email post password change
        try {
            const subject = 'Your password was changed';
            const text = `Hi ${matched.username || ''}, your password has been changed successfully. If you did not do this, contact support.`;
            await sendEmail(matched.email, subject, text, `<p>${text}</p>`);

        } catch (e) {
            console.warn('Confirmation email failed:', e);
        }

        return res.status(200).json({ message: 'Password updated successfully.' });
    } catch (err) {
        console.error('resetPassword error', err);
        return res.status(500).json({ message: 'Server error' });
    }
};