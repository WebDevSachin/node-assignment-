import express, { json, urlencoded } from 'express';
import mongoose from 'mongoose';
import { createClient } from 'redis';

// Connect to the Redis server
const client = createClient({
  socket: {
    host: '127.0.0.1',
    port: 6379,
  },
});

await client.connect();

// Connect to the Redis server
client.on('connect', function () {
  console.log('Connected to Redis');
});

client.on('error', function () {
  console.log('Connected to Redis');
});

// await client.set('key', 'dd');
// const value = await client.get('key');
// console.log(value);

// Connect to the MongoDB database
mongoose.connect('mongodb://localhost/assignment-db', { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true });

const app = express();

// Parse incoming request bodies in a middleware before your handlers
app.use(json());
app.use(urlencoded({ extended: true }));

// Define a schema for the user collection
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

// Create a model for the user collection
const User = mongoose.model('User', userSchema);

// 3rd party service function that returns a random boolean value
function thirdPartyService() {
  return Math.random() % 2 === 0;
}

// Signup API that creates a new user in the database
app.post('/signup', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = new User({ username, password });
    await user.save();
    res.sendStatus(200);
  } catch (error) {
    res.status(400).send({ error: 'Error creating user' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username, password });
    if (!user) {
      throw new Error('Invalid username or password');
    }
    // Increment the login counter in Redis

    const countOfLogin = await client.incr('login_counter');

    if (countOfLogin % 5 === 0) {
      throw new Error('Login blocked');
    }

    // Check with the 3rd party service
    const thirdPartyResult = thirdPartyService();

    if (!thirdPartyResult) {
      throw new Error('Third party service denied login');
    }

    res.sendStatus(200);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});
