const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Inicialização do Banco de Dados SQLite
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) console.error("Erro ao conectar ao BD:", err.message);
  else console.log("Banco de dados SQLite conectado.");
});

db.serialize(() => {
  // Tabela de Usuários
  db.run(`CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT,
    email TEXT UNIQUE,
    senha TEXT,
    tipo TEXT, -- 'aluno' ou 'professor'
    serie TEXT
  )`);

  // Tabela de Desempenho / Resultados
  db.run(`CREATE TABLE IF NOT EXISTS resultados (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER,
    etapa TEXT,
    acertos INTEGER,
    erros INTEGER,
    tempo_medio REAL,
    FOREIGN KEY(usuario_id) REFERENCES usuarios(id)
  )`);
});

// Cadastrar Aluno / Professor
app.post('/api/register', (req, res) => {
  const { nome, email, senha, tipo, serie } = req.body;

  // Validação do e-mail de acordo com as regras anotadas
  if (tipo === 'aluno') {
    const regexAluno = /^[0-9]+SP@aluno\.educacao\.sp\.gov\.br$/i;
    if (!regexAluno.test(email)) {
      return res.status(400).json({ error: "E-mail inválido. Deve seguir o padrão: 000...SP@aluno.educacao.sp.gov.br" });
    }
  } else if (tipo === 'professor') {
    const regexProf = /^[a-zA-Z0-9._%+-]+@professor\.educacao\.sp\.gov\.br$/i;
    if (!regexProf.test(email)) {
      return res.status(400).json({ error: "E-mail de professor deve seguir o padrão: nome@professor.educacao.sp.gov.br" });
    }
    if (senha.length < 3 || senha.length > 8) {
      return res.status(400).json({ error: "A senha do professor deve ter entre 3 e 8 caracteres." });
    }
  }

  const stmt = db.prepare(`INSERT INTO usuarios (nome, email, senha, tipo, serie) VALUES (?, ?, ?, ?, ?)`);
  stmt.run([nome, email, senha, tipo, serie || 'N/A'], function(err) {
    if (err) return res.status(400).json({ error: "E-mail já cadastrado ou dados inválidos." });
    res.json({ success: true, id: this.lastID });
  });
});

// Login
app.post('/api/login', (req, res) => {
  const { email, senha } = req.body;
  db.get(`SELECT id, nome, email, tipo, serie FROM usuarios WHERE email = ? AND senha = ?`, [email, senha], (err, row) => {
    if (err || !row) {
      return res.status(401).json({ error: "E-mail ou senha incorretos." });
    }
    res.json({ success: true, user: row });
  });
});

// Salvar Resultado
app.post('/api/resultados', (req, res) => {
  const { usuario_id, etapa, acertos, erros, tempo_medio } = req.body;
  const stmt = db.prepare(`INSERT INTO resultados (usuario_id, etapa, acertos, erros, tempo_medio) VALUES (?, ?, ?, ?, ?)`);
  stmt.run([usuario_id, etapa, acertos, erros, tempo_medio], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Ranking Público
app.get('/api/ranking', (req, res) => {
  const query = `
    SELECT u.nome, u.serie, SUM(r.acertos) as total_acertos
    FROM usuarios u
    JOIN resultados r ON u.id = r.usuario_id
    WHERE u.tipo = 'aluno'
    GROUP BY u.id
    ORDER BY total_acertos DESC
    LIMIT 10
  `;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Lista de Professores (Ordem Alfabética)
app.get('/api/professores', (req, res) => {
  db.all(`SELECT nome, email FROM usuarios WHERE tipo = 'professor' ORDER BY nome ASC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));