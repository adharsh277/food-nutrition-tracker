const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const passport = require('passport');

dotenv.config(); // 🔥 MUST be before googleAuth

require('./config/googleAuth'); // AFTER dotenv

const connectDB = require('./config/db');
connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(passport.initialize());

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/food', require('./routes/food.routes'));

app.get('/', (req, res) => {
  res.send('🚀 LPU Food Scanner Backend Running');
});

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
  });
}

module.exports = app;
