// БАЗА ДАННЫХ СЛОВ (6 тем по 25 слов = 150 слов)
const wordDatabase = {
    cosmos: [
        "Ракета", "Спутник", "Скафандр", "Телескоп", "Марс", "Астероид", "Галактика", "Комета", 
        "Затмение", "Орбита", "Луноход", "Звезда", "Метеорит", "Черная дыра", "Луна", "Солнце", 
        "Невесомость", "МКС", "Инопланетянин", "Квазар", "Космонавт", "Плутон", "Сатурн", "Гравитация", "Вакуум"
    ],
    sport: [
        "Футбол", "Баскетбол", "Волейбол", "Хоккей", "Теннис", "Бокс", "Плавание", "Карате", 
        "Стадион", "Тренер", "Мяч", "Ворота", "Свисток", "Медаль", "Кубок", "Олимпиада", 
        "Бег", "Штанга", "Коньки", "Лыжи", "Велосипед", "Сноуборд", "Гольф", "Арбитр", "Разминка"
    ],
    food: [
        "Пицца", "Бургер", "Суши", "Борщ", "Пельмени", "Паста", "Салат", "Мороженое", 
        "Шоколад", "Яблоко", "Банан", "Сыр", "Хлеб", "Молоко", "Кофе", "Чай", 
        "Торт", "Суп", "Стейк", "Яичница", "Картошка", "Блины", "Лимон", "Рыба", "Мед"
    ],
    professions: [
        "Доктор", "Учитель", "Пожарный", "Полицейский", "Повар", "Инженер", "Программист", "Художник", 
        "Актер", "Пилот", "Военный", "Водитель", "Строитель", "Музыкант", "Писатель", "Адвокат", 
        "Продавец", "Парикмахер", "Фермер", "Ученый", "Фотограф", "Ветеринар", "Архитектор", "Бухгалтер", "Дизайнер"
    ],
    animals: [
        "Лев", "Тигр", "Медведь", "Волк", "Лиса", "Заяц", "Слон", "Жираф", 
        "Зебра", "Обезьяна", "Кенгуру", "Панда", "Кошка", "Собака", "Лошадь", "Корова", 
        "Орёл", "Пингвин", "Дельфин", "Акула", "Кит", "Змея", "Лягушка", "Черепаха", "Крокодил"
    ],
    geography: [
        "Москва", "Париж", "Лондон", "Нью-Йорк", "Токио", "Рим", "Берлин", "Пекин", 
        "Египет", "Бразилия", "Япония", "Россия", "Франция", "Италия", "Испания", "Китай", 
        "Канада", "Австралия", "Океан", "Пустыня", "Горы", "Вулкан", "Остров", "Столица", "Карта"
    ]
};

// Игровое состояние
let config = {
    totalPlayers: 0,
    totalImposters: 0,
    duration: 0,
    secretWord: ""
};

let players = []; 
let currentIdx = 0; 
let timerId = null;
let timeLeft = 0;
let selectedVoteTarget = null;

const screens = {
    settings: document.getElementById('scr-settings'),
    roles: document.getElementById('scr-roles'),
    game: document.getElementById('scr-game'),
    voting: document.getElementById('scr-voting'),
    results: document.getElementById('scr-results'),
    modalGuess: document.getElementById('modal-guess')
};

function showScreen(screenEl) {
    Object.values(screens).forEach(s => s.classList.add('hidden'));
    screenEl.classList.remove('hidden');
}

// --- ЭКРАН 1: НАСТРОЙКИ И РАНДОМ СЛОВА ---
document.getElementById('btn-start-setup').addEventListener('click', () => {
    const pCount = parseInt(document.getElementById('inp-players').value);
    const impCount = parseInt(document.getElementById('inp-imposters').value);
    const min = parseInt(document.getElementById('inp-min').value) || 0;
    const sec = parseInt(document.getElementById('inp-sec').value) || 0;
    const selectedTheme = document.getElementById('sel-theme').value;

    if (pCount < 3) return alert('Минимум 3 игрока!');
    if (impCount < 1 || impCount >= pCount) return alert('Недопустимое количество импостеров!');
    if (min === 0 && sec === 0) return alert('Задайте время таймера!');

    // Выбор случайного слова
    const themeWords = wordDatabase[selectedTheme];
    const randomWordIdx = Math.floor(Math.random() * themeWords.length);
    const pickedWord = themeWords[randomWordIdx];

    config.totalPlayers = pCount;
    config.totalImposters = impCount;
    config.duration = (min * 60) + sec;
    config.secretWord = pickedWord;

    generateRoles(); // Запуск новой честной генерации ролей
    currentIdx = 0;
    prepareRoleScreen();
    showScreen(screens.roles);
});

// НАСТОЯЩИЙ РАНДОМ: Алгоритм Фишера-Йетса
function generateRoles() {
    players = [];
    let rolePool = [];

    // 1. Создаем заготовленный набор ролей под настройки
    for (let i = 0; i < config.totalImposters; i++) {
        rolePool.push('imposter');
    }
    for (let i = 0; i < (config.totalPlayers - config.totalImposters); i++) {
        rolePool.push('crew');
    }

    // 2. Перемешиваем этот набор в случайном порядке
    for (let i = rolePool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [rolePool[i], rolePool[j]] = [rolePool[j], rolePool[i]]; // Меняем элементы местами
    }

    // 3. Раздаем перемешанные роли игрокам по порядку от 1 до X
    for (let i = 1; i <= config.totalPlayers; i++) {
        players.push({ 
            id: i, 
            role: rolePool[i - 1], 
            votedFor: null 
        });
    }
}

// --- ЭКРАН 2: РАЗДАЧА РОЛЕЙ (УДЕРЖАНИЕ КАРТЫ) ---
const roleCard = document.getElementById('role-card');
const nextPlayerBtn = document.getElementById('btn-next-player');

function prepareRoleScreen() {
    nextPlayerBtn.disabled = true;
    roleCard.classList.remove('flipped');
    
    document.getElementById('role-player-title').innerText = `Игрок ${players[currentIdx].id}, твоя очередь`;
    
    const contentBox = document.getElementById('card-role-content');
    const p = players[currentIdx];

    if (p.role === 'crew') {
        contentBox.innerHTML = `
            <div class="role-title role-crew">Ты МИРНЫЙ</div>
            <div class="secret-word-box">
                Секретное слово:
                <span class="word-highlight">${config.secretWord}</span>
            </div>
        `;
    } else {
        contentBox.innerHTML = `
            <div class="role-title role-imposter">Ты ИМПОСТЕР!</div>
            <p style="font-size:0.9rem; text-align:center;">Ты не знаешь слово. Слушай обсуждения, узнай слово или выживи!</p>
        `;
    }

    if (currentIdx === players.length - 1) {
        nextPlayerBtn.innerText = "Начать игру";
    } else {
        nextPlayerBtn.innerText = "Следующий игрок";
    }
}

const flipCardUp = (e) => {
    e.preventDefault(); 
    roleCard.classList.add('flipped');
};

const flipCardDown = () => {
    if (roleCard.classList.contains('flipped')) {
        roleCard.classList.remove('flipped');
        nextPlayerBtn.disabled = false; 
    }
};

roleCard.addEventListener('mousedown', flipCardUp);
roleCard.addEventListener('mouseup', flipCardDown);
roleCard.addEventListener('mouseleave', flipCardDown);
roleCard.addEventListener('touchstart', flipCardUp);
roleCard.addEventListener('touchend', flipCardDown);
roleCard.addEventListener('touchcancel', flipCardDown);

nextPlayerBtn.addEventListener('click', () => {
    if (currentIdx < players.length - 1) {
        currentIdx++;
        prepareRoleScreen();
    } else {
        startGameplay();
    }
});

// --- ЭКРАН 3: ИГРОВОЙ ПРОЦЕСС И ТАЙМЕР ---
function startGameplay() {
    timeLeft = config.duration;
    updateTimerDisplay();
    showScreen(screens.game);

    timerId = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        if (timeLeft <= 0) {
            clearInterval(timerId);
            startVoting(); 
        }
    }, 1000);
}

function updateTimerDisplay() {
    const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    const s = (timeLeft % 60).toString().padStart(2, '0');
    document.getElementById('timer-box').innerText = `${m}:${s}`;
}

document.getElementById('btn-trigger-guess').addEventListener('click', () => {
    screens.modalGuess.classList.remove('hidden');
});

document.getElementById('btn-close-guess').addEventListener('click', () => {
    screens.modalGuess.classList.add('hidden');
});

document.getElementById('btn-submit-guess').addEventListener('click', () => {
    const typedWord = document.getElementById('inp-guess-word').value.trim().toLowerCase();
    screens.modalGuess.classList.add('hidden');
    clearInterval(timerId);

    if (typedWord === config.secretWord.toLowerCase()) {
        endGame("ИМПОСТЕРЫ ВЫИГРАЛИ!", `Импостер правильно угадал секретное слово ("${config.secretWord}")!`);
    } else {
        endGame("МИРНЫЕ ВЫИГРАЛИ!", `Импостер назвал неверное слово ("${typedWord}")! Правильное слово было: "${config.secretWord}".`);
    }
    document.getElementById('inp-guess-word').value = "";
});

document.getElementById('btn-trigger-vote').addEventListener('click', () => {
    clearInterval(timerId);
    startVoting();
});

// --- ЭКРАН 4: ПОШАГОВОЕ ГОЛОСОВАНИЕ ---
function startVoting() {
    currentIdx = 0;
    showScreen(screens.voting);
    prepareVoteTurn();
}

function prepareVoteTurn() {
    selectedVoteTarget = null;
    const nextVoteBtn = document.getElementById('btn-next-vote');
    nextVoteBtn.disabled = true;

    const votingPlayer = players[currentIdx];
    document.getElementById('vote-player-title').innerText = `Игрок ${votingPlayer.id}, выбери : Кто Импостер?`;

    const optionsBox = document.getElementById('vote-options-box');
    optionsBox.innerHTML = "";

    players.forEach(p => {
        if (p.id !== votingPlayer.id) {
            const b = document.createElement('button');
            b.className = 'vote-btn';
            b.innerText = `Игрок ${p.id}`;
            b.addEventListener('click', () => {
                document.querySelectorAll('.vote-btn').forEach(btn => btn.classList.remove('selected'));
                b.classList.add('selected');
                selectedVoteTarget = p.id;
                nextVoteBtn.disabled = false;
            });
            optionsBox.appendChild(b);
        }
    });

    if (currentIdx === players.length - 1) {
        nextVoteBtn.innerText = "Показать ответы";
    } else {
        nextVoteBtn.innerText = "Следующий";
    }
}

document.getElementById('btn-next-vote').addEventListener('click', () => {
    players[currentIdx].votedFor = selectedVoteTarget;

    if (currentIdx < players.length - 1) {
        currentIdx++;
        prepareVoteTurn();
    } else {
        calculateResults();
    }
});

// --- ЭКРАН 5: ПОДСЧЕТ РЕЗУЛЬТАТОВ И ФИНАЛ ---
function calculateResults() {
    const imposterIds = players.filter(p => p.role === 'imposter').map(p => p.id);
    
    const voteCounts = {};
    players.forEach(p => { voteCounts[p.id] = 0; });
    players.forEach(p => {
        if (p.votedFor) voteCounts[p.votedFor]++;
    });

    let maxVotes = -1;
    for (let id in voteCounts) {
        if (voteCounts[id] > maxVotes) maxVotes = voteCounts[id];
    }

    const kickedPlayers = [];
    for (let id in voteCounts) {
        if (voteCounts[id] === maxVotes) kickedPlayers.push(parseInt(id));
    }

    let title = "";
    let description = "";

    if (kickedPlayers.length > 1) {
        title = "ПОБЕДА ИМПОСТЕРОВ!";
        description = "Голоса разделились поровну. Мирные не смогли договориться!";
    } else {
        const kickedId = kickedPlayers[0];
        if (imposterIds.includes(kickedId)) {
            const remainingImposters = imposterIds.filter(id => id !== kickedId);
            if (remainingImposters.length === 0) {
                title = "ПОБЕДА МИРНЫХ!";
                description = `Вы смогли вычислить и исключить Импостера (Игрок ${kickedId})!`;
            } else {
                title = "ПОБЕДА ИМПОСТЕРОВ!";
                description = `Вы угадали одного Импостера (Игрок ${kickedId}), но в игре остались еще предатели!`;
            }
        } else {
            title = "ПОБЕДА ИМПОСТЕРОВ!";
            description = `Вы исключили невиновного Игрока ${kickedId}! Импостеры празднуют триумф.`;
        }
    }

    endGame(title, description);
}

function endGame(title, desc) {
    const banner = document.getElementById('winner-banner');
    banner.innerText = title;
    
    if (title.includes("МИРНЫХ")) {
        banner.className = "winner-title win-crew";
    } else {
        banner.className = "winner-title win-imposter";
    }

    const impostersList = players.filter(p => p.role === 'imposter').map(p => p.id);
    document.getElementById('imposters-reveal-text').innerHTML = `
        ${desc}<br>
        <span style="font-size:1.1rem; color:#fff;">Загаданное слово было: <b style="color:#00ffff">"${config.secretWord}"</b></span><br>
        <span style="font-size:1.1rem; color:#fff;">Настоящие импостеры: <b style="color:#ff2a2a">Игрок ${impostersList.join(', ')}</b></span>
    `;

    const statsBox = document.getElementById('stats-box');
    statsBox.innerHTML = "";
    players.forEach(p => {
        const line = document.createElement('div');
        line.className = "stat-line";
        line.innerHTML = `👤 Игрок ${p.id} проголосовал за ➡️ <span class="accent-text">Игрок ${p.votedFor}</span>`;
        statsBox.appendChild(line);
    });

    showScreen(screens.results);
}

document.getElementById('btn-restart').addEventListener('click', () => {
    showScreen(screens.settings);
});