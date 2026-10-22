require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// MySQL Database Connection using Environment Variables
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Musanqenqa@2001',
    database: process.env.DB_NAME || 'hair_stylist_db',
    port: process.env.DB_PORT || 3306,
    ssl: process.env.DB_HOST ? { rejectUnauthorized: true } : false
});

db.connect((err) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
    } else {
        console.log('✅ Connected to MySQL database!');
    }
});

// GET Route: Fetch appointments
app.get('/api/appointments', (req, res) => {
    const sql = 'SELECT * FROM appointments ORDER BY session_date DESC';
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// POST Route: Log appointment
app.post('/api/appointments', (req, res) => {
    const { client_name, client_phone, style_done, amount_paid, payment_status, session_date, notes } = req.body;
    const sql = `
        INSERT INTO appointments 
        (client_name, client_phone, style_done, amount_paid, payment_status, session_date, notes) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [client_name, client_phone || null, style_done, amount_paid, payment_status || 'Paid', session_date, notes || null];

    db.query(sql, values, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Session logged successfully!', appointment_id: result.insertId });
    });
});

// GET Route: Summary totals
app.get('/api/summary', (req, res) => {
    const sql = `SELECT COUNT(*) AS total_clients, SUM(amount_paid) AS total_revenue FROM appointments`;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results[0]);
    });
});

// DELETE Route: Remove appointment
app.delete('/api/appointments/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM appointments WHERE appointment_id = ?';
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Appointment deleted successfully!' });
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});