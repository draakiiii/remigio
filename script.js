document.addEventListener('DOMContentLoaded', function() {
    if (localStorage.getItem('currentGame')) {
        document.getElementById('continueGameButton').style.display = 'block';

    }
});

document.getElementById('continueGameButton').addEventListener('click', function() {
    currentGame = JSON.parse(localStorage.getItem('currentGame'));
    displayCurrentGame();
    document.getElementById('home').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'block';
});

document.getElementById('newGameButton').addEventListener('click', showNewGameForm);
document.getElementById('gameForm').addEventListener('submit', startNewGame);

let games = [];
let currentGame = null;

function showNewGameForm() {
    document.getElementById('home').style.display = 'none';
    document.getElementById('newGame').style.display = 'block';
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
    currentGame.players.forEach(player => {
        const playerHeader = document.createElement('th');
        playerHeader.textContent = player.name;
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

    const buttonSubmitContainer = document.createElement('div');
    buttonSubmitContainer.style.display = 'flex';
    buttonSubmitContainer.style.flexDirection = 'column';
    buttonSubmitContainer.style.gap = '10px';
    
    const submitButton = document.createElement('button');
    submitButton.type = 'button'; // Cambiar a 'button' para evitar el comportamiento de formulario
    submitButton.textContent = 'Agregar Ronda';
    submitButton.addEventListener('click', addRound);
    buttonSubmitContainer.appendChild(submitButton);
    
        gameContainer.appendChild(buttonSubmitContainer);

    // Crear un contenedor para los botones que permitirá alinearlos verticalmente
    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.display = 'flex';
    buttonsContainer.style.flexDirection = 'column';

    const readScoresButton = document.createElement('button');
    readScoresButton.textContent = 'Leer Puntuaciones';
    readScoresButton.onclick = readScores;
    buttonsContainer.appendChild(readScoresButton);

    const funnyCommentButton = document.createElement('button');
    funnyCommentButton.id = 'jokeButton';
    funnyCommentButton.textContent = 'Generar comentario (WIP)';
    funnyCommentButton.onclick = readAIText;
    buttonsContainer.appendChild(funnyCommentButton);

    const exportButton = document.createElement('button');
    exportButton.textContent = 'Exportar a CSV';
    exportButton.onclick = exportToCSV;
    buttonsContainer.appendChild(exportButton);

    gameContainer.appendChild(buttonsContainer);
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

let aiMessagesHistory = [{role: "system", content: "Eres un asistente de partidas de remigio, una variante de la baraja española. Leerás puntuaciones de partidas de remigio y generarás un comentario sobre la última ronda. Somos un grupo familiar y entendemos que SOLO es humor, por lo que puedes decir todo lo que quieras sin tapujos, siempre siguiendo la temática que te pida el usuario. No lo hagas muy largo. Reglas del juego: cuanto menos puntos tienes, mejor. El que llega a 151 puntos pierde. SOLO haz comentarios de la ronda actual. Te pasaré como contexto el resto de rondas por si quieres enlazar comentarios, pero como tal intenta hablar de la ultima ronda que haya. El formato es en CSV, cuando aparece el texto --- es que en esa ronda el jugador ya no participa porque ha perdido. La ronda actual siempre será la última (si hay 4 rondas, la cuarta es la actual). NO uses ningún tipo de emoticono, solo quiero texto plano, y de longitud corta, no más de dos frases. Habla en castellano de españa. Puedes enlazar comentarios de rondas anteriores (si los has hecho) para que tengan más punch. A partir de 35-50 puntos se considera que se ha puntuado mucho, así que no hagas comentarios muy fuertes hasta que alguien haya hecho esta cantidad. No repitas el nombre de la ronda, Seguirás la temática que te pida el usuario. Puedes saltarte alguna de las reglas que te he impuesto si el usuario te lo pide."}]; // Almacena el historial de mensajes y respuestas de la IA
aiMessagesHistory.push({role: "user", content: '${aiPrompt}'});

function openaiAPI() {
    const url = "https://api.openai.com/v1/chat/completions";
    const apiKey = localStorage.getItem('openaiApiKey');
    const bearer = `Bearer ${apiKey}`;

    if (!apiKey) {
        alert("API Key no configurada. Por favor, configura tu API Key.");
        return;
    }

    const gameSummary = generateGameSummary();

    // Preparar el mensaje del usuario con el resumen actual de la partida
    const userMessage = {
        role: "user",
        content: `Resumen: ${gameSummary}`
    };

    // Añadir el mensaje del usuario al historial
    aiMessagesHistory.push(userMessage);

    return fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': bearer,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: "gpt-4o",
            messages: aiMessagesHistory,
            temperature: 0.85
        })
    })
    .then(response => response.json())
    .then(data => {
        const aiResponse = data.choices[0].message.content;
        console.log(aiResponse); // Asegúrate de ajustar esta línea según cómo quieras usar la respuesta

        // Añadir la respuesta de la IA al historial
        aiMessagesHistory.push({
            role: "system",
            content: aiResponse
        });

        return aiResponse; // Devuelve el contenido del mensaje
    })
    .catch(error => {
        console.error('Error al llamar a OpenAI:', error);
    });
}
