// backend/routes/registration/registrationRoutes.js
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const pool = require('../../database');
const { sendEmail, handleError } = require('../../utils');
const User = require('../../models/user.model');
require('dotenv').config();
const router = express.Router();
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user account
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: The username of the user
 *               email:
 *                 type: string
 *                 format: email
 *                 description: The email of the user
 *               password:
 *                 type: string
 *                 description: The password of the user
 *               subscriptionOption:
 *                  type: string
 *                  description: The subcription type of the user.
 *               studentId:
 *                  type: string
 *                  description: The student id of the user if a student
 *               idCard:
 *                 type: string
 *                 format: binary
 *                 description: the id card of student to upload
 *             example:
 *               username: johndoe
 *               email: johndoe@example.com
 *               password: Password123
 *               subscriptionOption: Individual
 *               studentId: 12345
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user_id:
 *                   type: string
 *                   description: unique id of the user
 *                 username:
 *                    type: string
 *                    description: user name of the user
 *                 email:
 *                    type: string
 *                    description: email address of the user
 *             example:
 *               user_id: 3a821c3c-5102-4379-a184-516d3591997b
 *               username: johndoe
 *               email: johndoe@example.com
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *             example:
 *               message: 'Username, email and password are required'
 *       500:
 *         description: Internal server error
 *         content:
 *            application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *             example:
 *               message: 'Registration failed.'
 */
const createUser = async (userData) => { // Create a helper method to create a new user
  const { username, email, password, subscriptionOption, studentId } = userData;
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({
    user_id: uuidv4(),
    username: username,
    email: email,
    hashed_password: hashedPassword,
    subscriptionOption: subscriptionOption,
    studentId: studentId
  });
  try {
    const result = await pool.insertRecord('users', newUser, [
          'user_id',
         'username',
          'email',
          'hashed_password',
          'subscriptionOption',
           'studentId'
    ]);
    if (!result) {
      throw new Error('Failed to register new user.');
    }
    return new User(newUser);
  } catch (error) {
    console.error("Error during user registration", error);
    throw error; // rethrow error with specific message
  }
}
router.post('/register', upload.single('idCard'), async (req, res) => {
  const { username, email, password, subscriptionOption, studentId } = req.body;
  if (!username || !email || !password || !subscriptionOption) return res.status(400).json({ message: 'Username, email and password and subscription type are required' });
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email format.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
  }
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long, have uppercase, lowercase, number, and special character' })
  }
  if (username.length < 3) {
    return res.status(400).json({ message: 'Username must be at least 3 characters long.' });
  }
  try {
    // Check if the email or username exists
    const [existingUser] = await pool.query('SELECT * FROM users WHERE email = ? OR username = ?', [email, username]);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'Email or username already registered.' });
    }
    const registeredUser = await createUser(req.body);
    const emailContent = `Thank you for registering an account, ${username}! Your subscription type is ${subscriptionOption}, Student Id is ${studentId || ''}`
    await sendEmail({
      to: email,
      subject: 'New User Registration Confirmation',
      body: emailContent
    })
    await sendEmail({
      to: 'admin@reviewhub.net.et',
      subject: 'New User Registration Confirmation',
      body: `A new user has registered. Username:${username}, Email: ${email}. Subscription type:${subscriptionOption}, Student Id: ${studentId || ''}`
    })
    res.status(201).json(registeredUser.toJSON());
  } catch (error) {
    console.error('Error during user registration:', error);
    res.status(500).json({ message: 'Registration failed.' });
  }
});

module.exports = router;