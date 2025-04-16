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

    const query = 'INSERT INTO users (first_name, last_name, username, email, password) VALUES (?, ?, ?, ?, ?)';
    connection.query(query, ['Default', 'Default', username, email, password], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ id: result.insertId, username, email });
    });
});

// GET: Obtener un usuario por ID
app.get('/users/:id', (req, res) => {
    const { id } = req.params;
    connection.query('SELECT id, first_name, last_name, username, email, created_at FROM users WHERE id = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
        res.json(results[0]);
    });
});

// PUT: Actualizar un usuario
app.put('/users/:id', (req, res) => {
    const { id } = req.params;
    const { first_name, last_name, username, email, password } = req.body;
    if (!first_name && !last_name && !username && !email && !password) {
        return res.status(400).json({ error: 'No hay datos para actualizar' });
    }

    const updates = {};
    if (first_name) updates.first_name = first_name;
    if (last_name) updates.last_name = last_name;
    if (username) updates.username = username;
    if (email) updates.email = email;
    if (password) updates.password = password;

    const fields = Object.keys(updates).map(field => `${field} = ?`).join(', ');
    const values = Object.values(updates);
    values.push(id);

    const query = `UPDATE users SET ${fields} WHERE id = ?`;
    connection.query(query, values, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
        res.json({ message: 'Usuario actualizado', id });
    });
});

// DELETE: Eliminar un usuario
app.delete('/users/:id', (req, res) => {
    const { id } = req.params;
    connection.query('DELETE FROM users WHERE id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
        res.json({ message: 'Usuario eliminado', id });
    });
});

// POST: Login
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Faltan datos' });

    const query = 'SELECT id, first_name, last_name, username, email FROM users WHERE email = ? AND password = ?';
    connection.query(query, [email, password], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(401).json({ error: 'Credenciales inválidas' });
        res.json({ user: results[0] });
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

// GET: Obtener todos los colores
app.get('/colors', (req, res) => {
    const { user_id } = req.query;
    let query = 'SELECT * FROM colors';
    let params = [];

    if (user_id) {
        query += ' WHERE user_id = ?';
        params.push(user_id);
    }

    connection.query(query, params, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// GET: Obtener un color por ID
app.get('/colors/by-id/:id', (req, res) => {
    const { id } = req.params;
    connection.query('SELECT * FROM colors WHERE id = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: 'Color no encontrado' });
        res.json(results[0]);
    });
});

// PUT: Actualizar un color
app.put('/colors/:id', (req, res) => {
    const { id } = req.params;
    const { rgb } = req.body;
    if (!rgb) return res.status(400).json({ error: 'Faltan datos' });

    connection.query('UPDATE colors SET rgb = ? WHERE id = ?', [rgb, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Color no encontrado' });
        res.json({ message: 'Color actualizado', id, rgb });
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

// ---- Endpoint para Convertir Color ----
app.post('/convert-palette', (req, res) => {
    const { palette_id, toFormat } = req.body;
    if (!palette_id || !toFormat) return res.status(400).json({ error: 'Faltan datos' });

    const query = `
        SELECT c.rgb
        FROM palette_colors pc
        JOIN colors c ON pc.color_id = c.id
        WHERE pc.palette_id = ?
        ORDER BY pc.position
    `;
    connection.query(query, [palette_id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: 'Paleta no encontrada' });

        try {
            const convertedColors = results.map(color => {
                if (toFormat.toLowerCase() === 'hex') {
                    const rgb = color.rgb.split(',').map(Number);
                    if (rgb.length !== 3 || rgb.some(v => isNaN(v) || v < 0 || v > 255)) {
                        throw new Error('Formato RGB inválido');
                    }
                    return `#${rgb.map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
                } else {
                    throw new Error('Formato no soportado');
                }
            });
            res.json({ palette_id, convertedColors });
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    });
});


// POST: Convertir un color individual
app.post('/convert-color', (req, res) => {
    const { color, fromFormat, toFormat } = req.body;
    if (!color || !fromFormat || !toFormat) return res.status(400).json({ error: 'Faltan datos' });

    try {
        if (fromFormat.toLowerCase() === 'rgb' && toFormat.toLowerCase() === 'hex') {
            const rgb = color.split(',').map(Number);
            if (rgb.length !== 3 || rgb.some(v => isNaN(v) || v < 0 || v > 255)) {
                throw new Error('Formato RGB inválido');
            }
            const hex = `#${rgb.map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
            res.json({ convertedColor: hex });
        } else {
            throw new Error('Conversión no soportada');
        }
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
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
        GROUP BY p.id, p.name
    `;
    connection.query(query, [req.params.user_id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results.map(palette => ({
            id: palette.id,
            name: palette.name,
            colors: palette.colors ? palette.colors.split(',') : []
        })));
    });
});

// GET: Obtener todas las paletas
app.get('/palettes', (req, res) => {
    const { user_id } = req.query;
    let query = `
        SELECT p.id, p.name, GROUP_CONCAT(c.rgb ORDER BY pc.position) AS colors
        FROM palettes p
        LEFT JOIN palette_colors pc ON p.id = pc.palette_id
        LEFT JOIN colors c ON pc.color_id = c.id
    `;
    let params = [];

    if (user_id) {
        query += ' WHERE p.user_id = ?';
        params.push(user_id);
    }

    query += ' GROUP BY p.id, p.name';
    connection.query(query, params, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results.map(palette => ({
            id: palette.id,
            name: palette.name,
            colors: palette.colors ? palette.colors.split(',') : []
        })));
    });
});

// GET: Obtener una paleta por ID
app.get('/palettes/by-id/:id', (req, res) => {
    const { id } = req.params;
    const query = `
        SELECT p.id, p.name, GROUP_CONCAT(c.rgb ORDER BY pc.position) AS colors
        FROM palettes p
        LEFT JOIN palette_colors pc ON p.id = pc.palette_id
        LEFT JOIN colors c ON pc.color_id = c.id
        WHERE p.id = ?
        GROUP BY p.id, p.name
    `;
    connection.query(query, [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: 'Paleta no encontrada' });
        const palette = results[0];
        res.json({
            id: palette.id,
            name: palette.name,
            colors: palette.colors ? palette.colors.split(',') : []
        });
    });
});

// PUT: Actualizar una paleta
app.put('/palettes/:id', (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Faltan datos' });

    connection.query('UPDATE palettes SET name = ? WHERE id = ?', [name, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Paleta no encontrada' });
        res.json({ message: 'Paleta actualizada', id, name });
    });
});

// DELETE: Eliminar una paleta
app.delete('/palettes/:id', (req, res) => {
    const { id } = req.params;
    connection.query('DELETE FROM palettes WHERE id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Paleta no encontrada' });
        res.json({ message: 'Paleta eliminada', id });
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
        res.status(201).json({ palette_id, color_id, position: position || 0 });
    });
});

// GET: Obtener colores de una paleta
app.get('/palette_colors/:palette_id', (req, res) => {
    const { palette_id } = req.params;
    const query = `
        SELECT c.id, c.rgb, pc.position
        FROM palette_colors pc
        JOIN colors c ON pc.color_id = c.id
        WHERE pc.palette_id = ?
        ORDER BY pc.position
    `;
    connection.query(query, [palette_id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// PUT: Actualizar la posición de un color en una paleta
app.put('/palette_colors/:palette_id/:color_id', (req, res) => {
    const { palette_id, color_id } = req.params;
    const { position } = req.body;
    if (position === undefined) return res.status(400).json({ error: 'Falta la posición' });

    const query = 'UPDATE palette_colors SET position = ? WHERE palette_id = ? AND color_id = ?';
    connection.query(query, [position, palette_id, color_id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Relación no encontrada' });
        res.json({ message: 'Posición actualizada', palette_id, color_id, position });
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
