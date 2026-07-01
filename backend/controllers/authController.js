const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sendEmail = require('../utils/sendEmail');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({ name, email, password: hashedPassword });
    if (user) {
      
      // Generate OTP
const otp = Math.floor(100000 + Math.random() * 900000);

// Email to User
const userMessage = `
    <h2>Welcome to ApnaShop, ${name}!</h2>

    <p>Thank you for registering.</p>

    <p>Your verification OTP is:</p>

    <h1>${otp}</h1>

    <p>Please do not share this OTP with anyone.</p>
`;

await sendEmail({
    email: user.email,
    subject: "Welcome to ApnaShop - OTP Verification",
    message: userMessage
});

// Email to Admin
const adminMessage = `
    <h2>🎉 New User Registered</h2>

    <table border="1" cellpadding="8" cellspacing="0">
        <tr>
            <td><b>Name</b></td>
            <td>${user.name}</td>
        </tr>
        <tr>
            <td><b>Email</b></td>
            <td>${user.email}</td>
        </tr>
        <tr>
            <td><b>User ID</b></td>
            <td>${user._id}</td>
        </tr>
    </table>

    <br>

    <p>A new customer has successfully registered on <b>ApnaShop</b>.</p>
`;

await sendEmail({
    email: process.env.ADMIN_EMAIL,
    subject: "🆕 New User Registration - ApnaShop",
    message: adminMessage
});

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id)
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, loginUser, getUsers };
