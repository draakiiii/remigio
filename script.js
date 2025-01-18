document.addEventListener('DOMContentLoaded', function() {
    loadSettings();
    setupEventListeners();
    if (localStorage.getItem('currentGame')) {
        document.getElementById('continueGameButton').style.display = 'block';

    }
    setupDarkModeToggle();
    loadGameHistory();
    updateRanking();
});

function setupEventListeners() {
    document.getElementById('settingsButton').addEventListener('click', function() {
        document.getElementById('apiKeyModal').style.display = 'block';
    });

    document.getElementById('saveApiKeyButton').onclick = function() {
        const apiKey = document.getElementById('apiKeyInput').value;
        const model = document.getElementById('modelSelect').value;
        const aiPrompt = document.getElementById('aiPromptInput').value || "Informativo. Haz un resumen de cómo va la partida de forma divertida, puedes hacer bromas de todo tipo.";
        
        localStorage.setItem('openaiApiKey', apiKey);
        localStorage.setItem('openaiModel', model);
        localStorage.setItem('aiPrompt', aiPrompt);
        
        document.getElementById('apiKeyModal').style.display = "none";
    };

    document.getElementById('continueGameButton').addEventListener('click', function() {
        currentGame = JSON.parse(localStorage.getItem('currentGame'));
        displayCurrentGame();
        document.getElementById('home').style.display = 'none';
        document.getElementById('gameContainer').style.display = 'block';
    });

    document.getElementById('newGameButton').addEventListener('click', showNewGameForm);
    document.getElementById('gameForm').addEventListener('submit', startNewGame);

    document.getElementById('historyButton').addEventListener('click', function() {
        hideAllContainers();
        document.getElementById('historyContainer').style.display = 'block';
        document.getElementById('historyContainer').classList.add('animate__fadeIn');
    });

    document.getElementById('rankingButton').addEventListener('click', function() {
        hideAllContainers();
        document.getElementById('rankingContainer').style.display = 'block';
        document.getElementById('rankingContainer').classList.add('animate__fadeIn');
    });
}

let games = [];
let currentGame = null;

function showNewGameForm() {
    document.getElementById('home').style.display = 'none';
    document.getElementById('newGame').style.display = 'block';
}

function loadSettings() {
    const apiKey = localStorage.getItem('openaiApiKey');
    const model = localStorage.getItem('openaiModel');
    const aiPrompt = localStorage.getItem('aiPrompt');

    if (apiKey) {
        document.getElementById('apiKeyInput').value = apiKey;
    }
    if (model) {
        document.getElementById('modelSelect').value = model;
    }
    if (aiPrompt) {
        document.getElementById('aiPromptInput').value = aiPrompt;
    }
}

function startNewGame(event) {
    event.preventDefault();
    const date = document.getElementById('date').value;
    const playerNames = document.getElementById('players').value.split(',').map(name => name.trim());
    const maxPoints = parseInt(document.getElementById('maxPoints').value) + 1; // Este es el valor real, perderán cuando lleguen a esta puntuación
    const maxPointsText = parseInt(document.getElementById('maxPoints').value); // Este es el valor que se muestra en el juego
    const players = playerNames.map(name => ({ name, points: [], totalPoints: 0 }));
    currentGame = { date, players, rounds: [], maxPoints, maxPointsText };
    games.push(currentGame);
    saveGame();
    document.getElementById('newGame').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'block';
    displayCurrentGame();
}

function saveGame() {
    localStorage.setItem('currentGame', JSON.stringify(currentGame));
}

function displayCurrentGame() {
    const gameContainer = document.getElementById('gameContainer');
    gameContainer.innerHTML = `<h2>Partida a ${currentGame.maxPointsText} puntos</h2>`;

    const table = document.createElement('table');
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = '<th>Jugador</th>';

    // Encontrar jugadores con menor y mayor puntuación
    let minPoints = Infinity;
    let maxPoints = -1;
    let leadersIndexes = [];
    let losersIndexes = [];

    if (currentGame.rounds.length > 0) {
        // Verificar si hay un ganador (solo queda un jugador)
        const remainingPlayers = currentGame.players.filter(p => p.totalPoints < currentGame.maxPoints);
        
        if (remainingPlayers.length === 1) {
            // Si solo queda un jugador, es el ganador
            const winnerIndex = currentGame.players.findIndex(p => p.totalPoints < currentGame.maxPoints);
            leadersIndexes = [winnerIndex];
            losersIndexes = [];
        } else {
            // Si hay más de un jugador, encontrar los puntos mínimos y máximos
            currentGame.players.forEach((player, index) => {
                if (player.totalPoints < currentGame.maxPoints) {
                    if (player.totalPoints < minPoints) {
                        minPoints = player.totalPoints;
                    }
                    if (player.totalPoints > maxPoints) {
                        maxPoints = player.totalPoints;
                    }
                }
            });

            // Luego encontramos todos los jugadores que empatan en esos puntos
            currentGame.players.forEach((player, index) => {
                if (player.totalPoints < currentGame.maxPoints) {
                    if (player.totalPoints === minPoints) {
                        leadersIndexes.push(index);
                    }
                    if (player.totalPoints === maxPoints) {
                        losersIndexes.push(index);
                    }
                }
            });
        }
    }

    currentGame.players.forEach((player, index) => {
        const playerHeader = document.createElement('th');
        playerHeader.textContent = player.name;
        
        // Añadir iconos para líderes y perdedores
        if (currentGame.rounds.length > 0) {
            if (leadersIndexes.includes(index)) {
                playerHeader.innerHTML += ' <span class="crown-icon">👑</span>';
                playerHeader.classList.add('tied-leader');
            }
            if (losersIndexes.includes(index) && !leadersIndexes.includes(index)) {
                playerHeader.innerHTML += ' <span class="skull-icon">💀</span>';
                playerHeader.classList.add('tied-loser');
            }
        }
        headerRow.appendChild(playerHeader);
    });
    table.appendChild(headerRow);

    const maxRounds = Math.max(...currentGame.players.map(p => p.points.length));
    for (let i = 0; i < maxRounds; i++) {
        const roundRow = document.createElement('tr');
        roundRow.innerHTML = `<td>Ronda ${i + 1}</td>`;
        currentGame.players.forEach((player, playerIndex) => {
            const points = player.points[i] !== undefined ? player.points[i] : '---';
            const pointCell = document.createElement('td');
            pointCell.textContent = points;

            // Hacer las celdas editables si son de rondas anteriores y el jugador no estaba eliminado en esa ronda
            if (i < currentGame.rounds.length) {
                // Calcular puntos totales hasta esta ronda
                const totalUpToThisRound = player.points.slice(0, i).reduce((acc, curr) => {
                    return acc + (curr === '---' ? 0 : curr);
                }, 0);

                // La celda es editable si:
                // 1. Es una ronda anterior
                // 2. El jugador no estaba eliminado en esta ronda específica
                if (totalUpToThisRound < currentGame.maxPoints) {
                    pointCell.classList.add('editable');
                    pointCell.dataset.round = i;
                    pointCell.dataset.player = playerIndex;
                    pointCell.addEventListener('click', editCell);
                }
            }

            if (points === 0 && pointCell.textContent !== '---') {
                pointCell.classList.add('round-winner');
            }

            let totalPointsUpToThisRound = player.points.slice(0, i + 1).reduce((acc, curr) => {
                return acc + (curr === '---' ? 0 : curr);
            }, 0);
            
            if (totalPointsUpToThisRound >= currentGame.maxPoints && player.points[i] !== '---') {
                pointCell.classList.add('round-loser');
            }

            roundRow.appendChild(pointCell);
        });
        table.appendChild(roundRow);
    }

    const newRoundRow = document.createElement('tr');
    newRoundRow.innerHTML = `<td>Ronda ${currentGame.rounds.length + 1}</td>`;
    currentGame.players.forEach((player, playerIndex) => {
        const inputCell = document.createElement('td');
        if (player.totalPoints >= currentGame.maxPoints) {
            inputCell.textContent = '---';
        } else {
            const input = document.createElement('input');
            input.type = 'number';
            input.id = `player${playerIndex + 1}`;
            input.required = true;
            input.min = 0;
            inputCell.appendChild(input);
        }
        newRoundRow.appendChild(inputCell);
    });
    table.appendChild(newRoundRow);

    const totalRow = document.createElement('tr');
    totalRow.innerHTML = '<td>Total</td>';
    currentGame.players.forEach(player => {
        const totalCell = document.createElement('td');
        totalCell.textContent = player.totalPoints;

        if (player.totalPoints >= currentGame.maxPoints) {
            totalCell.classList.add('total-loser');
        }

        totalRow.appendChild(totalCell);
    });
    table.appendChild(totalRow);

    gameContainer.appendChild(table);

    // Resto del código existente para los botones...
    const allButtonsContainer = document.createElement('div');
    allButtonsContainer.className = 'all-buttons-container';

    const addRoundContainer = document.createElement('div');
    addRoundContainer.className = 'button-container';
    
    const submitButton = document.createElement('button');
    submitButton.type = 'button';
    submitButton.textContent = 'Agregar Ronda';
    submitButton.className = 'btn primary-btn';
    submitButton.addEventListener('click', addRound);
    addRoundContainer.appendChild(submitButton);
    
    allButtonsContainer.appendChild(addRoundContainer);

    const actionButtonsContainer = document.createElement('div');
    actionButtonsContainer.className = 'button-container';

    const readScoresButton = document.createElement('button');
    readScoresButton.textContent = 'Leer Puntuaciones';
    readScoresButton.className = 'btn secondary-btn';
    readScoresButton.onclick = readScores;
    actionButtonsContainer.appendChild(readScoresButton);

    const funnyCommentButton = document.createElement('button');
    funnyCommentButton.id = 'jokeButton';
    funnyCommentButton.textContent = 'Generar comentario';
    funnyCommentButton.className = 'btn secondary-btn';
    funnyCommentButton.style.display = 'none';
    funnyCommentButton.onclick = readAIText;
    actionButtonsContainer.appendChild(funnyCommentButton);

    const exportButton = document.createElement('button');
    exportButton.style.display = 'none';
    exportButton.textContent = 'Exportar a CSV';
    exportButton.className = 'btn secondary-btn';
    exportButton.onclick = exportToCSV;
    actionButtonsContainer.appendChild(exportButton);

    allButtonsContainer.appendChild(actionButtonsContainer);
    gameContainer.appendChild(allButtonsContainer);
}

function addRound(event) {
    event.preventDefault();

    const inputs = document.querySelectorAll('input[type="number"]');
    for (let input of inputs) {
        if (input.value === '' || isNaN(input.value)) {
            alert('Por favor, ingrese un valor numérico para todos los jugadores.');
            return;
        }
    }

    const round = [];

    currentGame.players.forEach((player, index) => {
        const inputElement = document.getElementById(`player${index + 1}`);
        if (inputElement) {
            const points = parseInt(inputElement.value) || 0;
            player.points.push(points);
            player.totalPoints += points;
            
            // Añadir clase para animación
            const cells = document.querySelectorAll('td');
            const lastCell = cells[cells.length - currentGame.players.length + index];
            if (lastCell) {
                lastCell.classList.add('new-score');
                setTimeout(() => lastCell.classList.remove('new-score'), 500);
            }
        } else {
            player.points.push('---');
        }
    });

    currentGame.rounds.push(round);

    saveGame();
    checkWinCondition();
    displayCurrentGame();
}

function checkWinCondition() {
    const remainingPlayers = currentGame.players.filter(player => player.totalPoints < currentGame.maxPoints);

    if (remainingPlayers.length === 1) {
        const winner = remainingPlayers[0];
        
        // Guardar la partida en el historial
        saveGameToHistory(currentGame);
        
        // Mostrar confeti
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });

        // Mostrar mensaje de victoria con animación
        const message = document.createElement('div');
        message.className = 'winner-message animate__animated animate__bounceIn';
        message.innerHTML = `
            <h2><i class="fas fa-trophy"></i> ¡${winner.name} ha ganado la partida!</h2>
        `;
        document.getElementById('gameContainer').appendChild(message);

        // Ocultar el formulario de nueva ronda
        document.querySelector('form').style.display = 'none';
    }
}

function readScores() {
    const activePlayers = currentGame.players.filter(player => player.totalPoints < currentGame.maxPoints);
    
    // Si solo queda un jugador, es el ganador
    if (activePlayers.length === 1) {
        const msg = new SpeechSynthesisUtterance(
            `¡${activePlayers[0].name} ha ganado la partida!`
        );
        window.speechSynthesis.speak(msg);
        return;
    }

    // Ordenar jugadores por puntuación (menor a mayor, ya que menos puntos es mejor)
    const sortedPlayers = [...activePlayers].sort((a, b) => a.totalPoints - b.totalPoints);
    
    // Construir el texto con todos los jugadores
    let scoresText = '';
    
    if (sortedPlayers.length === 2) {
        scoresText = `${sortedPlayers[0].name} va primero con ${sortedPlayers[0].totalPoints} puntos y ${sortedPlayers[1].name} va segundo con ${sortedPlayers[1].totalPoints} puntos`;
    } else {
        // Para 3 o más jugadores
        const positions = ['primero', 'segundo', 'tercero', 'cuarto', 'quinto', 'sexto', 'séptimo', 'octavo'];
        
        scoresText = sortedPlayers.map((player, index) => {
            const position = positions[index] || `${index + 1}º`;
            return `${player.name} va ${position} con ${player.totalPoints} puntos`;
        }).join(', ').replace(/,([^,]*)$/, ' y$1');
    }

    const msg = new SpeechSynthesisUtterance(scoresText);
    window.speechSynthesis.speak(msg);
}

async function readAIText() {
    const response = await openaiAPI();
    const msg = new SpeechSynthesisUtterance(response);
    window.speechSynthesis.speak(msg);
}

function exportToCSV() {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Jugador,";

    // Añadir encabezados de rondas
    const maxRounds = Math.max(...currentGame.players.map(p => p.points.length));
    for (let i = 0; i < maxRounds; i++) {
        csvContent += `Ronda ${i + 1},`;
    }
    csvContent += "Total Puntos\n";

    // Añadir datos de jugadores
    currentGame.players.forEach(player => {
        csvContent += `${player.name},`;
        player.points.forEach(points => {
            csvContent += `${points},`;
        });
        csvContent += `${player.totalPoints}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "partida_remigio.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
function generateGameSummary() {
    let summary = "Resumen de la partida:\n";
    const maxRounds = Math.max(...currentGame.players.map(p => p.points.length));

    // Añadir encabezados de rondas
    summary += "Jugador, ";
    for (let i = 0; i < maxRounds; i++) {
        summary += `Ronda ${i + 1}, `;
    }
    summary += "Total Puntos\n";

    // Añadir datos de jugadores
    currentGame.players.forEach(player => {
        summary += `${player.name}, `;
        player.points.forEach(points => {
            summary += `${points}, `;
        });
        summary += `${player.totalPoints}\n`;
    });

    return summary;
}

let maxPoints = currentGame ? currentGame.maxPointsText || 151 : 151;
let aiMessagesHistory = [{role: "system", content: `Eres un asistente de partidas de remigio, una variante de la baraja española. Leerás puntuaciones de partidas de remigio y generarás un comentario sobre la ltima ronda. Somos un grupo familiar y entendemos que SOLO es humor, por lo que puedes decir todo lo que quieras sin tapujos, siempre siguiendo la temática que te pida el usuario y sin asumir las relaciones familiares ya que a veces añadiremos a amigos a la partida. No lo hagas muy largo. Reglas del juego: cuanto menos puntos tienes, mejor (usualmente la gente que solo realiza entre 1 y 10 puntos no ha tenido una mala ronda, lo preocupante es hacer más de 25). El que llega a ${maxPoints} puntos pierde. En cada ronda habrá un jugador que consiga 0 puntos, ese jugador habrá ganado esa ronda en cuestión. SOLO haz comentarios de la ronda actual. Te pasaré como contexto el resto de rondas por si quieres enlazar comentarios, pero como tal intenta hablar de la ultima ronda que haya. El formato es en CSV, cuando aparece el texto --- es que en esa ronda el jugador ya no participa porque ha perdido. La ronda actual siempre será la ltima (si hay 4 rondas, la cuarta es la actual). NO uses ningun tipo de emoticono, solo quiero texto plano, y de longitud corta, no más de dos frases. Habla en castellano de españa. Puedes enlazar comentarios de rondas anteriores (si los has hecho) para que tengan más punch. A partir de 25 puntos se considera que se ha puntuado mucho y se ha tenido una mala ronda, así que no hagas comentarios muy fuertes hasta que alguien haya hecho esta cantidad. No repitas el nombre de la ronda, Seguirás la temática que te pida el usuario. Puedes saltarte alguna de las reglas que te he impuesto si el usuario te lo pide, pero las reglas del remigio SIEMPRE tienes que tenerlas claras (más puntos, peor). NO asumas la edad de nadie, la descendencia de nadie, ni que todos son familia. La puntuación no tiene nada que ver con las cartas, es solo un valor, por lo que no digas cosas como "acumular cartas" ni cosas que no tengan sentido. NO HAGAS MÁS DE DOS FRASES`}]; // Almacena el historial de mensajes y respuestas de la IA
const aiPrompt = localStorage.getItem('aiPrompt');
aiMessagesHistory.push({role: "user", content: "Tipo de mensaje: " + aiPrompt});

function openaiAPI() {
    const url = "https://api.openai.com/v1/chat/completions";
    const apiKey = localStorage.getItem('openaiApiKey');
    const model = localStorage.getItem('openaiModel') || 'gpt-4o';
    const bearer = `Bearer ${apiKey}`;

    if (!apiKey) {
        alert("API Key no configurada. Por favor, configura tu API Key.");
        return;
    }

    const gameSummary = generateGameSummary();

    const userMessage = {
        role: "user",
        content: `Resumen: ${gameSummary}`
    };

    aiMessagesHistory.push(userMessage);

    return fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': bearer,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: model,
            messages: aiMessagesHistory,
            temperature: 0.85
        })
    })
    .then(response => response.json())
    .then(data => {
        const aiResponse = data.choices[0].message.content;

        aiMessagesHistory.push({
            role: "system",
            content: aiResponse
        });

        return aiResponse;
    })
    .catch(error => {
        console.error('Error al llamar a OpenAI:', error);
    });
}

function setupDarkModeToggle() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    const body = document.body;

    // Verificar si el modo oscuro está guardado en localStorage
    if (localStorage.getItem('darkMode') === 'enabled') {
        body.classList.add('dark-mode');
    }

    darkModeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-mode');

        // Guardar la preferencia en localStorage
        if (body.classList.contains('dark-mode')) {
            localStorage.setItem('darkMode', 'enabled');
        } else {
            localStorage.setItem('darkMode', null);
        }
    });
}

function editCell(event) {
    const cell = event.target;
    const currentValue = cell.textContent;
    const round = parseInt(cell.dataset.round);
    const playerIndex = parseInt(cell.dataset.player);

    const input = document.createElement('input');
    input.type = 'number';
    input.value = currentValue === '---' ? 0 : currentValue;
    input.min = 0;
    input.style.width = '50px';
    
    cell.textContent = '';
    cell.appendChild(input);
    input.focus();

    function saveEdit() {
        const newValue = parseInt(input.value) || 0;
        
        // Actualizar los puntos en el objeto del juego
        currentGame.players[playerIndex].points[round] = newValue;
        
        // Recalcular todos los puntos totales y actualizar las rondas posteriores
        let total = 0;
        for (let i = 0; i < currentGame.players[playerIndex].points.length; i++) {
            let points = currentGame.players[playerIndex].points[i];
            if (i <= round) {
                // Mantener los puntos reales hasta la ronda editada
                total += points === '---' ? 0 : points;
            } else {
                // Para rondas posteriores
                if (total >= currentGame.maxPoints) {
                    currentGame.players[playerIndex].points[i] = '---';
                } else if (currentGame.players[playerIndex].points[i] === '---') {
                    // Si era '---' pero ahora el jugador no está eliminado, restaurar a 0
                    currentGame.players[playerIndex].points[i] = 0;
                }
                total += currentGame.players[playerIndex].points[i] === '---' ? 0 : currentGame.players[playerIndex].points[i];
            }
        }
        
        // Actualizar el total final
        currentGame.players[playerIndex].totalPoints = total;
        
        // Guardar el juego actualizado
        saveGame();
        
        // Actualizar la visualización
        displayCurrentGame();
    }

    input.addEventListener('blur', saveEdit);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveEdit();
        }
    });
}

function hideAllContainers() {
    const containers = ['home', 'newGame', 'gameContainer', 'historyContainer', 'rankingContainer'];
    containers.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = 'none';
            element.classList.remove('animate__fadeIn');
        }
    });
}

function saveGameToHistory(game) {
    let history = JSON.parse(localStorage.getItem('gameHistory') || '[]');
    history.unshift({
        date: game.date,
        players: game.players,
        winner: findWinner(game),
        timestamp: new Date().getTime()
    });
    localStorage.setItem('gameHistory', JSON.stringify(history));
    updateRanking();
}

function findWinner(game) {
    const remainingPlayers = game.players.filter(player => player.totalPoints < game.maxPoints);
    return remainingPlayers.length === 1 ? remainingPlayers[0] : null;
}

function loadGameHistory() {
    const history = JSON.parse(localStorage.getItem('gameHistory') || '[]');
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';

    history.forEach((game, index) => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <div class="history-header">
                <i class="fas fa-calendar"></i> ${new Date(game.date).toLocaleDateString()}
            </div>
            <div class="history-details">
                <div><i class="fas fa-users"></i> Jugadores: ${game.players.map(p => p.name).join(', ')}</div>
                ${game.winner ? `<div><i class="fas fa-trophy"></i> Ganador: ${game.winner.name}</div>` : ''}
            </div>
        `;
        historyList.appendChild(historyItem);
    });
}

function updateRanking() {
    const history = JSON.parse(localStorage.getItem('gameHistory') || '[]');
    const playerStats = {};

    // Calcular estadísticas
    history.forEach(game => {
        game.players.forEach(player => {
            if (!playerStats[player.name]) {
                playerStats[player.name] = {
                    name: player.name,
                    gamesPlayed: 0,
                    gamesWon: 0,
                    winRate: 0
                };
            }
            playerStats[player.name].gamesPlayed++;
            if (game.winner && game.winner.name === player.name) {
                playerStats[player.name].gamesWon++;
            }
        });
    });

    // Calcular porcentajes y ordenar
    const ranking = Object.values(playerStats)
        .map(player => ({
            ...player,
            winRate: (player.gamesWon / player.gamesPlayed * 100).toFixed(1)
        }))
        .sort((a, b) => b.winRate - a.winRate);

    // Mostrar ranking
    const rankingList = document.getElementById('rankingList');
    rankingList.innerHTML = '';

    ranking.forEach((player, index) => {
        const rankingItem = document.createElement('div');
        rankingItem.className = 'ranking-item';
        
        const medalIcon = index < 3 ? `<i class="fas fa-medal ranking-${index + 1}"></i>` : `<span class="ranking-position">${index + 1}</span>`;
        
        rankingItem.innerHTML = `
            <div class="ranking-info">
                ${medalIcon}
                <span class="player-name">${player.name}</span>
            </div>
            <div class="ranking-stats">
                <div>Victorias: ${player.gamesWon}/${player.gamesPlayed}</div>
                <div>Ratio: ${player.winRate}%</div>
            </div>
        `;
        rankingList.appendChild(rankingItem);
    });
}