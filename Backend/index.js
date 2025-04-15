const express = require('express');
const mysql = require('mysql');
const cors = require('cors');

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

// Configuración de conexión a MySQL
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Yolo.pwd01G3rr911',
    database: 'color_app'
});

connection.connect((err) => {
    if (err) {
        console.error('Error conectando a MySQL:', err);
        return;
    }
    console.log('Conexión exitosa a MySQL');
});

// ---- Endpoints para Users ----
// GET: Obtener todos los usuarios
app.get('/users', (req, res) => {
    connection.query('SELECT * FROM users', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// POST: Crear un usuario
app.post('/users', (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: "Faltan datos" });

    const query = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
    connection.query(query, [username, email, password], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ id: result.insertId, username, email });
    });
});

// ---- Endpoints para Colors ----
// POST: Guardar un color (resultado de una imagen)
app.post('/colors', (req, res) => {
    const { user_id, rgb } = req.body;
    if (!user_id || !rgb) return res.status(400).json({ error: "Faltan datos" });

    const query = 'INSERT INTO colors (user_id, rgb) VALUES (?, ?)';
    connection.query(query, [user_id, rgb], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ id: result.insertId, user_id, rgb });
    });
});

// GET: Obtener colores de un usuario
app.get('/colors/:user_id', (req, res) => {
    connection.query('SELECT * FROM colors WHERE user_id = ?', [req.params.user_id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// DELETE: Eliminar un color
app.delete('/colors/:id', (req, res) => {
    connection.query('DELETE FROM colors WHERE id = ?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Color no encontrado' });
        res.json({ message: 'Color eliminado', id: req.params.id });
    });
});

// ---- Endpoints para Palettes ----
// POST: Crear una paleta
app.post('/palettes', (req, res) => {
    const { user_id, name } = req.body;
    if (!user_id || !name) return res.status(400).json({ error: "Faltan datos" });

    const query = 'INSERT INTO palettes (user_id, name) VALUES (?, ?)';
    connection.query(query, [user_id, name], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ id: result.insertId, user_id, name });
    });
});

// GET: Obtener paletas de un usuario con colores
app.get('/palettes/:user_id', (req, res) => {
    const query = `
        SELECT p.id, p.name, GROUP_CONCAT(c.rgb ORDER BY pc.position) AS colors
        FROM palettes p
        LEFT JOIN palette_colors pc ON p.id = pc.palette_id
        LEFT JOIN colors c ON pc.color_id = c.id
        WHERE p.user_id = ?
        GROUP BY p.id
    `;
    connection.query(query, [req.params.user_id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// ---- Endpoints para Palette_Colors ----
// POST: Agregar un color a una paleta
app.post('/palette_colors', (req, res) => {
    const { palette_id, color_id, position } = req.body;
    if (!palette_id || !color_id) return res.status(400).json({ error: "Faltan datos" });

    const query = 'INSERT INTO palette_colors (palette_id, color_id, position) VALUES (?, ?, ?)';
    connection.query(query, [palette_id, color_id, position || 0], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ id: result.insertId, palette_id, color_id, position });
    });
});

// DELETE: Eliminar un color de una paleta
app.delete('/palette_colors/:palette_id/:color_id', (req, res) => {
    const { palette_id, color_id } = req.params;
    const query = 'DELETE FROM palette_colors WHERE palette_id = ? AND color_id = ?';
    
    connection.query(query, [palette_id, color_id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Relación no encontrada' });
        res.json({ message: 'Color eliminado de la paleta', palette_id, color_id });
    });
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
