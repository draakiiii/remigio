document.addEventListener('DOMContentLoaded', function() {
    loadSettings();
    setupEventListeners();
    if (localStorage.getItem('currentGame')) {
        document.getElementById('continueGameButton').style.display = 'block';

    }
    setupDarkModeToggle();
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

    // Encontrar al jugador con menos puntos y al jugador con más puntos (pero sin superar el máximo)
    let minPoints = Infinity;
    let maxPoints = -1;
    let leaderIndex = -1;
    let loserIndex = -1;
    if (currentGame.rounds.length > 0) {
        currentGame.players.forEach((player, index) => {
            if (player.totalPoints < currentGame.maxPoints) {
                if (player.totalPoints < minPoints) {
                    minPoints = player.totalPoints;
                    leaderIndex = index;
                }
                if (player.totalPoints > maxPoints) {
                    maxPoints = player.totalPoints;
                    loserIndex = index;
                }
            }
        });
    }

    currentGame.players.forEach((player, index) => {
        const playerHeader = document.createElement('th');
        playerHeader.textContent = player.name;
        if (currentGame.rounds.length > 0) {
            if (index === leaderIndex) {
                playerHeader.textContent += ' 👑'; // Añadir corona al líder
            } else if (index === loserIndex) {
                playerHeader.textContent += ' 💀'; // Añadir símbolo de perdedor
            }
        }
        headerRow.appendChild(playerHeader);
    });
    table.appendChild(headerRow);

    const maxRounds = Math.max(...currentGame.players.map(p => p.points.length));
    for (let i = 0; i < maxRounds; i++) {
        const roundRow = document.createElement('tr');
        roundRow.innerHTML = `<td>Ronda ${i + 1}</td>`;
        currentGame.players.forEach(player => {
            const points = player.points[i] !== undefined ? player.points[i] : '---';
            const pointCell = document.createElement('td');
            pointCell.textContent = points;

            // Aplicar clase CSS para puntos de ronda igual a 0, pero no para '---'
            if (points === 0 && pointCell.textContent !== '---') {
                pointCell.classList.add('round-winner');
            }

            // Calcular puntos totales hasta esta ronda
            let totalPointsUpToThisRound = player.points.slice(0, i + 1).reduce((acc, curr) => acc + curr, 0);

            // Si los puntos totales superan 150 en esta ronda, aplicar color rojo
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

        // Aplicar clases CSS basadas en las puntuaciones totales
        if (player.totalPoints >= currentGame.maxPoints) {
            totalCell.classList.add('total-loser');
        }

        totalRow.appendChild(totalCell);
    });
    table.appendChild(totalRow);

    gameContainer.appendChild(table);

    // Crear un contenedor principal para todos los botones
    const allButtonsContainer = document.createElement('div');
    allButtonsContainer.className = 'all-buttons-container';

    // Contenedor para el botón de agregar ronda
    const addRoundContainer = document.createElement('div');
    addRoundContainer.className = 'button-container';
    
    const submitButton = document.createElement('button');
    submitButton.type = 'button'; // Cambiar a 'button' para evitar el comportamiento de formulario
    submitButton.textContent = 'Agregar Ronda';
    submitButton.className = 'btn primary-btn';
    submitButton.addEventListener('click', addRound);
    addRoundContainer.appendChild(submitButton);
    
    allButtonsContainer.appendChild(addRoundContainer);

    // Contenedor para los botones de acción
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
    funnyCommentButton.style.display = 'none'; // Botón oculto porque la API está deshabilitada
    funnyCommentButton.onclick = readAIText;
    actionButtonsContainer.appendChild(funnyCommentButton);

    const exportButton = document.createElement('button');
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
        let points = 0;

        if (inputElement) {
            points = parseInt(inputElement.value) || 0;
            player.points.push(points);
            player.totalPoints += points;
        } else {
            player.points.push('---');
        }

        round.push({ name: player.name, points: inputElement ? points : '---' });
    });

    currentGame.rounds.push(round);

    saveGame();
    checkWinCondition();
    displayCurrentGame();
}

function checkWinCondition() {
    const remainingPlayers = currentGame.players.filter(player => player.totalPoints < currentGame.maxPoints);

    if (remainingPlayers.length === 1) {
        // Oculta el formulario de entrada de puntos
        const form = document.querySelector('form');
        if (form) {
            form.style.display = 'none';
        }

        const winner = remainingPlayers[0];
        alert(`¡${winner.name} ha ganado la partida!`);
        document.querySelector('form').style.display = 'none'; // Oculta solo el formulario de nueva ronda
    }
}

function readScores() {
    // Construir una cadena con las puntuaciones totales de forma resumida
    let scoresText = 'Puntuaciones totales: ';
    scoresText += currentGame.players
        .filter(player => player.totalPoints < currentGame.maxPoints)
        .map(player => `${player.name}, ${player.totalPoints} puntos`)
        .join(', ') + '. ';

    // Determinar quién va ganando y quién va perdiendo
    let winningPlayer = null;
    let losingPlayer = null;
    let minPoints = Infinity;
    let maxPoints = -Infinity;

    currentGame.players.forEach(player => {
        if (player.totalPoints < currentGame.maxPoints) {
            if (player.totalPoints < minPoints) {
                minPoints = player.totalPoints;
                winningPlayer = player;
            }
            if (player.totalPoints > maxPoints) {
                maxPoints = player.totalPoints;
                losingPlayer = player;
            }
        }
    });

    if (winningPlayer) {
        scoresText += `Va ganando ${winningPlayer.name} con ${winningPlayer.totalPoints} puntos y `;
    }
    if (losingPlayer) {
        scoresText += `va perdiendo ${losingPlayer.name} con ${losingPlayer.totalPoints} puntos.`;
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