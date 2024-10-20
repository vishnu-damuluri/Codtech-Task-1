// server.js
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const app = express();
const port = 3000;

// PostgreSQL Connection Pool
const pool = new Pool({
    user: 'blogo_65n2_user',
    host: 'dpg-csaa45bqf0us739rl8lg-a.singapore-postgres.render.com',
    database: 'blogo_65n2',
    password: 'HyYdf0oXccvotFxnGxgFc0o0oGvu4MQw',
    port: 5432,
    ssl: {
        rejectUnauthorized: false,
    },
});

// Middleware
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({ secret: 'your_secret', resave: false, saveUninitialized: true }));

// Routes
app.get('/', async (req, res) => {
    const result = await pool.query('SELECT * FROM blogs');
    res.render('index', { blogs: result.rows });
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/register', (req, res) => {
    res.render('register');
});

// Registration Route
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    try {
        await pool.query('INSERT INTO users (username, password) VALUES ($1, $2)', [username, hashedPassword]);
        res.redirect('/login');
    } catch (error) {
        console.error('Error registering user:', error);
        res.redirect('/register');
    }
});

// Login Route
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        const user = result.rows[0];

        if (user) {
            const match = await bcrypt.compare(password, user.password);
            if (match) {
                req.session.loggedIn = true;
                return res.redirect('/dashboard');
            }
        }
        res.redirect('/login');
    } catch (error) {
        console.error('Login error:', error);
        res.redirect('/login');
    }
});

// Dashboard Route
app.get('/dashboard', (req, res) => {
    if (!req.session.loggedIn) {
        return res.redirect('/login');
    }
    res.render('dashboard');
});

// Blog Submission Route
app.post('/submit', async (req, res) => {
    const { title, content } = req.body;
    await pool.query('INSERT INTO blogs (title, content) VALUES ($1, $2)', [title, content]);
    res.redirect('/');
});

// Route to view a specific blog post
app.get('/blog/:id', async (req, res) => {
    const blogId = req.params.id;

    try {
        const result = await pool.query('SELECT * FROM blogs WHERE id = $1', [blogId]);
        const blog = result.rows[0];

        if (blog) {
            res.render('blog', { blog }); // Render the blog view
        } else {
            res.status(404).send('Blog not found');
        }
    } catch (error) {
        console.error('Error fetching blog:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
