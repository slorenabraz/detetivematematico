let currentUser = null;
let timerInterval = null;
let timeLeft = 60;

function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.getElementById(`page-${pageId}`).classList.remove('hidden');

  if (pageId === 'ranking') loadRanking();
  if (pageId === 'professores') loadProfessores();
  if (pageId === 'desafios') startEtapa1();
}

function toggleSerieSelect() {
  const tipo = document.getElementById('reg-tipo').value;
  const group = document.getElementById('group-serie');
  const emailInput = document.getElementById('reg-email');

  if (tipo === 'professor') {
    group.classList.add('hidden');
    emailInput.placeholder = "nome@professor.educacao.sp.gov.br";
  } else {
    group.classList.remove('hidden');
    emailInput.placeholder = "000...SP@aluno.educacao.sp.gov.br";
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const body = {
    nome: document.getElementById('reg-nome').value,
    tipo: document.getElementById('reg-tipo').value,
    email: document.getElementById('reg-email').value,
    senha: document.getElementById('reg-senha').value,
    serie: document.getElementById('reg-serie').value
  };

  const res = await fetch('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const data = await res.json();
  if (data.error) alert(data.error);
  else alert('Cadastro realizado com sucesso! Faça login.');
}

async function handleLogin(e) {
  e.preventDefault();
  const body = {
    email: document.getElementById('login-email').value,
    senha: document.getElementById('login-senha').value
  };

  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const data = await res.json();
  if (data.error) alert(data.error);
  else {
    currentUser = data.user;
    updateNav();
    showPage('inicio');
  }
}

function logout() {
  if (confirm("Deseja realmente sair?")) {
    currentUser = null;
    updateNav();
    showPage('inicio');
  }
}

function updateNav() {
  const isLoggedIn = !!currentUser;
  document.getElementById('btn-login').classList.toggle('hidden', isLoggedIn);
  document.getElementById('btn-logout').classList.toggle('hidden', !isLoggedIn);
  document.getElementById('nav-desafios').classList.toggle('hidden', !isLoggedIn);
  document.getElementById('nav-resultados').classList.toggle('hidden', !isLoggedIn);
  document.getElementById('nav-turmas').classList.toggle('hidden', !isLoggedIn);
}

function startEtapa1() {
  timeLeft = 60;
  const timerElem = document.getElementById('cronometro');
  const opciones = document.getElementById('quiz-opcoes');
  
  opciones.innerHTML = `
    <button onclick="checkAnswer(false)">a² = b² + c²</button>
    <button onclick="checkAnswer(true)">a² = b² - c² (Incorreta)</button>
    <button onclick="checkAnswer(false)">c² = a² + b²</button>
  `;

  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timeLeft--;
    timerElem.innerText = `Tempo: ${timeLeft}s`;
    if (timeLeft <= 10) timerElem.style.color = 'red';
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      document.getElementById('quiz-msg').innerText = "Tempo esgotado! A resposta correta foi destacada.";
    }
  }, 1000);
}

function checkAnswer(isCorrect) {
  clearInterval(timerInterval);
  if (isCorrect) {
    alert("Resposta Correta!");
  } else {
    alert("Resposta Incorreta!");
  }
}

async function loadRanking() {
  const res = await fetch('/api/ranking');
  const data = await res.json();
  const list = document.getElementById('lista-ranking');
  list.innerHTML = data.map(item => `<li>${item.nome} (${item.serie}) - ${item.total_acertos} acertos</li>`).join('');
}

async function loadProfessores() {
  const res = await fetch('/api/professores');
  const data = await res.json();
  const list = document.getElementById('lista-professores');
  list.innerHTML = data.map(p => `<li><strong>${p.nome}</strong> - Contato: ${p.email}</li>`).join('');
}