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

// Función para mostrar toast notifications
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Función para abrir modal
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = 'block';
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

// Función para cerrar modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
    document.body.style.overflow = 'auto';
}

function setupEventListeners() {
    // Configuración del modal API
    document.getElementById('settingsButton').addEventListener('click', function() {
        openModal('apiKeyModal');
    });

    // Cerrar modal con el botón X
    document.querySelector('.close').addEventListener('click', function() {
        closeModal('apiKeyModal');
    });

    // Cerrar modal con backdrop
    document.querySelector('.modal-backdrop').addEventListener('click', function() {
        closeModal('apiKeyModal');
    });

    // Cerrar modal con ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const modal = document.getElementById('apiKeyModal');
            if (modal.style.display === 'block') {
                closeModal('apiKeyModal');
            }
        }
    });

    document.getElementById('saveApiKeyButton').onclick = function() {
        const apiKey = document.getElementById('apiKeyInput').value;
        const model = document.getElementById('modelSelect').value;
        const aiPrompt = document.getElementById('aiPromptInput').value || "Informativo. Haz un resumen de cómo va la partida de forma divertida, puedes hacer bromas de todo tipo.";

        if (!apiKey) {
            showToast('Por favor, introduce una API Key válida', 'error');
            return;
        }

        localStorage.setItem('openaiApiKey', apiKey);
        localStorage.setItem('openaiModel', model);
        localStorage.setItem('aiPrompt', aiPrompt);

        closeModal('apiKeyModal');
        showToast('Configuración guardada correctamente', 'success');
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

    // Botones de volver
    document.getElementById('historyBackBtn').addEventListener('click', function() {
        hideAllContainers();
        showHome();
    });

    document.getElementById('rankingBackBtn').addEventListener('click', function() {
        hideAllContainers();
        showHome();
    });

    // Nuevos botones de navegación
    document.getElementById('statsButton').addEventListener('click', function() {
        hideAllContainers();
        document.getElementById('statsContainer').style.display = 'block';
        document.getElementById('statsContainer').classList.add('animate__fadeIn');
        displayAdvancedStats();
    });

    document.getElementById('achievementsButton').addEventListener('click', function() {
        hideAllContainers();
        document.getElementById('achievementsContainer').style.display = 'block';
        document.getElementById('achievementsContainer').classList.add('animate__fadeIn');
        displayAchievements();
    });

    document.getElementById('compareButton').addEventListener('click', function() {
        hideAllContainers();
        document.getElementById('compareContainer').style.display = 'block';
        document.getElementById('compareContainer').classList.add('animate__fadeIn');
        setupCompareView();
    });

    document.getElementById('statsBackBtn').addEventListener('click', function() {
        hideAllContainers();
        showHome();
    });

    document.getElementById('achievementsBackBtn').addEventListener('click', function() {
        hideAllContainers();
        showHome();
    });

    document.getElementById('compareBackBtn').addEventListener('click', function() {
        hideAllContainers();
        showHome();
    });

    document.getElementById('gameDetailBackBtn').addEventListener('click', function() {
        hideAllContainers();
        document.getElementById('historyContainer').style.display = 'block';
    });

    // Modal de gestión de datos
    const settingsBtn = document.getElementById('settingsButton');
    const originalSettingsClick = settingsBtn.onclick || settingsBtn.addEventListener;

    // Añadir menú contextual al botón de settings (click derecho)
    settingsBtn.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        openModal('dataModal');
    });

    // Cerrar modal de datos
    document.querySelector('.close-data').addEventListener('click', function() {
        closeModal('dataModal');
    });

    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
        backdrop.addEventListener('click', function() {
            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => {
                if (modal.style.display === 'block') {
                    closeModal(modal.id);
                }
            });
        });
    });

    // Exportar/Importar datos
    document.getElementById('exportDataButton').addEventListener('click', exportAllData);
    document.getElementById('importDataButton').addEventListener('click', function() {
        document.getElementById('importFileInput').click();
    });
    document.getElementById('importFileInput').addEventListener('change', importAllData);

    // Comparar jugadores
    document.getElementById('player1Select').addEventListener('change', comparePlayersIfReady);
    document.getElementById('player2Select').addEventListener('change', comparePlayersIfReady);
}

let games = [];
let currentGame = null;

function showNewGameForm() {
    document.getElementById('home').style.display = 'none';
    document.getElementById('newGame').style.display = 'block';

    // Establecer fecha actual por defecto
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;
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
    funnyCommentButton.innerHTML = '<i class="fas fa-robot"></i> Generar comentario';
    funnyCommentButton.className = 'btn secondary-btn';
    const hasApiKey = localStorage.getItem('openaiApiKey');
    funnyCommentButton.style.display = hasApiKey ? 'inline-block' : 'none';
    funnyCommentButton.onclick = readAIText;
    actionButtonsContainer.appendChild(funnyCommentButton);

    const exportButton = document.createElement('button');
    exportButton.style.display = 'none';
    exportButton.textContent = 'Exportar a CSV';
    exportButton.className = 'btn secondary-btn';
    exportButton.onclick = exportToCSV;
    actionButtonsContainer.appendChild(exportButton);

    allButtonsContainer.appendChild(actionButtonsContainer);

    // Añadir botón "Volver al inicio"
    const backButtonContainer = document.createElement('div');
    backButtonContainer.className = 'button-container';
    const backToHomeButton = document.createElement('button');
    backToHomeButton.innerHTML = '<i class="fas fa-home"></i> Volver al Inicio';
    backToHomeButton.className = 'btn secondary-btn';
    backToHomeButton.onclick = function() {
        if (confirm('¿Seguro que quieres volver al inicio? Se guardará el progreso de la partida actual.')) {
            hideAllContainers();
            showHome();
        }
    };
    backButtonContainer.appendChild(backToHomeButton);
    allButtonsContainer.appendChild(backButtonContainer);

    gameContainer.appendChild(allButtonsContainer);
}

function addRound(event) {
    event.preventDefault();

    const inputs = document.querySelectorAll('input[type="number"]');
    for (let input of inputs) {
        if (input.value === '' || isNaN(input.value)) {
            showToast('Por favor, ingrese un valor numérico para todos los jugadores.', 'error');
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
    const button = document.getElementById('jokeButton');
    const originalHTML = button.innerHTML;

    // Añadir loading state
    button.classList.add('loading');
    button.disabled = true;

    try {
        const response = await openaiAPI();
        if (response) {
            const msg = new SpeechSynthesisUtterance(response);
            window.speechSynthesis.speak(msg);
            showToast('Comentario generado', 'success');
        }
    } catch (error) {
        showToast('Error al generar comentario', 'error');
        console.error(error);
    } finally {
        // Quitar loading state
        button.classList.remove('loading');
        button.disabled = false;
        button.innerHTML = originalHTML;
    }
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
        showToast("API Key no configurada. Por favor, configura tu API Key.", 'error');
        openModal('apiKeyModal');
        return Promise.reject('No API key');
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
        showToast('Error al conectar con OpenAI', 'error');
        throw error;
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
    const containers = ['home', 'newGame', 'gameContainer', 'historyContainer', 'rankingContainer',
                        'statsContainer', 'achievementsContainer', 'compareContainer', 'gameDetailContainer'];
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

    if (history.length === 0) {
        historyList.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">No hay partidas guardadas aún</p>';
        return;
    }

    history.forEach((game, index) => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.style.cursor = 'pointer';
        historyItem.innerHTML = `
            <div class="history-header">
                <i class="fas fa-calendar"></i> ${new Date(game.date).toLocaleDateString()}
            </div>
            <div class="history-details">
                <div><i class="fas fa-users"></i> Jugadores: ${game.players.map(p => p.name).join(', ')}</div>
                ${game.winner ? `<div><i class="fas fa-trophy"></i> Ganador: ${game.winner.name}</div>` : ''}
            </div>
            <div style="margin-top: 10px; font-size: 0.85em; color: var(--text-secondary);">
                <i class="fas fa-chart-line"></i> Click para ver detalles
            </div>
        `;
        historyItem.addEventListener('click', () => showGameDetail(game, index));
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

function showHome() {
    document.getElementById('home').style.display = 'block';
    document.getElementById('home').classList.add('animate__fadeIn');
}

// ==================== NUEVAS FUNCIONALIDADES ====================

// Sistema de logros
const ACHIEVEMENTS = [
    { id: 'first_win', icon: '🏆', title: 'Primera Victoria', description: 'Gana tu primera partida', check: (stats) => stats.gamesWon >= 1 },
    { id: 'five_wins', icon: '🌟', title: 'Veterano', description: 'Gana 5 partidas', check: (stats) => stats.gamesWon >= 5 },
    { id: 'ten_wins', icon: '👑', title: 'Campeón', description: 'Gana 10 partidas', check: (stats) => stats.gamesWon >= 10 },
    { id: 'win_streak_3', icon: '🔥', title: 'Racha Caliente', description: 'Gana 3 partidas seguidas', check: (stats) => stats.maxWinStreak >= 3 },
    { id: 'perfectionist', icon: '💯', title: 'Perfeccionista', description: 'Gana sin pasar de 50 puntos', check: (stats) => stats.perfectWins >= 1 },
    { id: 'comeback', icon: '⚡', title: 'Remontada Épica', description: 'Gana estando último en una partida', check: (stats) => stats.comebacks >= 1 },
    { id: 'participative', icon: '🎮', title: 'Participativo', description: 'Juega 20 partidas', check: (stats) => stats.gamesPlayed >= 20 },
    { id: 'lucky_zero', icon: '🍀', title: 'Suertudo', description: 'Consigue 5 rondas con 0 puntos en una partida', check: (stats) => stats.maxZerosInGame >= 5 },
    { id: 'social', icon: '👥', title: 'Social', description: 'Juega con 5 o más jugadores', check: (stats) => stats.maxPlayers >= 5 },
    { id: 'win_rate_70', icon: '🎯', title: 'Maestro', description: 'Alcanza 70% de victorias (mín. 10 partidas)', check: (stats) => stats.gamesPlayed >= 10 && stats.winRate >= 70 }
];

function calculatePlayerAchievements(playerName) {
    const history = JSON.parse(localStorage.getItem('gameHistory') || '[]');

    // Calcular estadísticas para el jugador
    let stats = {
        gamesPlayed: 0,
        gamesWon: 0,
        winRate: 0,
        maxWinStreak: 0,
        currentStreak: 0,
        perfectWins: 0,
        comebacks: 0,
        maxZerosInGame: 0,
        maxPlayers: 0
    };

    let currentStreak = 0;
    let maxStreak = 0;

    history.forEach((game) => {
        const player = game.players.find(p => p.name === playerName);
        if (!player) return;

        stats.gamesPlayed++;
        stats.maxPlayers = Math.max(stats.maxPlayers, game.players.length);

        // Contar victorias
        if (game.winner && game.winner.name === playerName) {
            stats.gamesWon++;
            currentStreak++;
            maxStreak = Math.max(maxStreak, currentStreak);

            // Victoria perfecta (menos de 50 puntos)
            if (player.totalPoints < 50) {
                stats.perfectWins++;
            }

            // Remontada (estaba último en algún momento)
            // (Simplificado: si ganó con más de 30 puntos, probablemente estuvo atrás)
            if (player.totalPoints > 30) {
                stats.comebacks++;
            }
        } else {
            currentStreak = 0;
        }

        // Contar rondas con 0 puntos
        const zerosInGame = player.points.filter(p => p === 0).length;
        stats.maxZerosInGame = Math.max(stats.maxZerosInGame, zerosInGame);
    });

    stats.maxWinStreak = maxStreak;
    stats.winRate = stats.gamesPlayed > 0 ? (stats.gamesWon / stats.gamesPlayed * 100) : 0;

    return stats;
}

function displayAchievements() {
    const history = JSON.parse(localStorage.getItem('gameHistory') || '[]');
    const achievementsList = document.getElementById('achievementsList');

    if (history.length === 0) {
        achievementsList.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--text-secondary);">Juega algunas partidas para desbloquear logros</p>';
        return;
    }

    // Obtener todos los jugadores únicos
    const allPlayers = new Set();
    history.forEach(game => {
        game.players.forEach(p => allPlayers.add(p.name));
    });

    // Calcular logros por jugador
    const playerAchievements = {};
    allPlayers.forEach(playerName => {
        const stats = calculatePlayerAchievements(playerName);
        const unlockedAchievements = [];

        ACHIEVEMENTS.forEach(achievement => {
            if (achievement.check(stats)) {
                const savedAchievements = JSON.parse(localStorage.getItem('achievements') || '{}');
                const key = `${playerName}_${achievement.id}`;
                if (!savedAchievements[key]) {
                    savedAchievements[key] = new Date().toISOString();
                    localStorage.setItem('achievements', JSON.stringify(savedAchievements));
                }
                unlockedAchievements.push({
                    ...achievement,
                    unlockedDate: savedAchievements[key]
                });
            }
        });

        playerAchievements[playerName] = unlockedAchievements;
    });

    // Mostrar logros
    achievementsList.innerHTML = '';

    Object.keys(playerAchievements).forEach(playerName => {
        const playerSection = document.createElement('div');
        playerSection.style.marginBottom = '30px';

        const playerTitle = document.createElement('h3');
        playerTitle.innerHTML = `<i class="fas fa-user"></i> ${playerName}`;
        playerTitle.style.color = 'var(--primary-color)';
        playerSection.appendChild(playerTitle);

        const achievementsGrid = document.createElement('div');
        achievementsGrid.className = 'achievements-grid';

        const unlocked = playerAchievements[playerName];
        const unlockedIds = unlocked.map(a => a.id);

        ACHIEVEMENTS.forEach(achievement => {
            const achievementCard = document.createElement('div');
            const isUnlocked = unlockedIds.includes(achievement.id);
            achievementCard.className = `achievement-card ${isUnlocked ? 'unlocked' : 'locked'}`;

            const unlockedAchievement = unlocked.find(a => a.id === achievement.id);

            achievementCard.innerHTML = `
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-title">${achievement.title}</div>
                <div class="achievement-description">${achievement.description}</div>
                ${isUnlocked ? `<div class="achievement-date">Desbloqueado: ${new Date(unlockedAchievement.unlockedDate).toLocaleDateString()}</div>` : '<div class="achievement-date">🔒 Bloqueado</div>'}
            `;

            achievementsGrid.appendChild(achievementCard);
        });

        playerSection.appendChild(achievementsGrid);
        achievementsList.appendChild(playerSection);
    });
}

// Estadísticas avanzadas
function displayAdvancedStats() {
    const history = JSON.parse(localStorage.getItem('gameHistory') || '[]');
    const statsList = document.getElementById('statsList');

    if (history.length === 0) {
        statsList.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--text-secondary);">No hay suficientes datos para mostrar estadísticas</p>';
        return;
    }

    // Calcular estadísticas globales
    const globalStats = {
        totalGames: history.length,
        totalPlayers: new Set(),
        totalRounds: 0,
        avgGameLength: 0,
        avgPointsPerRound: 0,
        mostActivePlayer: '',
        mostActiveGames: 0
    };

    const playerGames = {};

    history.forEach(game => {
        game.players.forEach(p => {
            globalStats.totalPlayers.add(p.name);
            playerGames[p.name] = (playerGames[p.name] || 0) + 1;
        });

        const rounds = Math.max(...game.players.map(p => p.points.length));
        globalStats.totalRounds += rounds;
    });

    globalStats.avgGameLength = (globalStats.totalRounds / globalStats.totalGames).toFixed(1);

    // Jugador más activo
    Object.keys(playerGames).forEach(name => {
        if (playerGames[name] > globalStats.mostActiveGames) {
            globalStats.mostActiveGames = playerGames[name];
            globalStats.mostActivePlayer = name;
        }
    });

    // Mostrar estadísticas
    statsList.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <h3><i class="fas fa-gamepad"></i> Total de Partidas</h3>
                <div class="stat-value">${globalStats.totalGames}</div>
                <div class="stat-label">partidas jugadas</div>
            </div>
            <div class="stat-card">
                <h3><i class="fas fa-users"></i> Jugadores Únicos</h3>
                <div class="stat-value">${globalStats.totalPlayers.size}</div>
                <div class="stat-label">personas diferentes</div>
            </div>
            <div class="stat-card">
                <h3><i class="fas fa-clock"></i> Duración Media</h3>
                <div class="stat-value">${globalStats.avgGameLength}</div>
                <div class="stat-label">rondas por partida</div>
            </div>
            <div class="stat-card">
                <h3><i class="fas fa-fire"></i> Más Activo</h3>
                <div class="stat-value">${globalStats.mostActivePlayer}</div>
                <div class="stat-label">${globalStats.mostActiveGames} partidas</div>
            </div>
        </div>

        <h3 style="margin-top: 30px; color: var(--primary-color);"><i class="fas fa-user-friends"></i> Estadísticas por Jugador</h3>
    `;

    // Estadísticas detalladas por jugador
    const playersList = Array.from(globalStats.totalPlayers);
    playersList.forEach(playerName => {
        const stats = calculateDetailedPlayerStats(playerName);

        const playerCard = document.createElement('div');
        playerCard.className = 'stat-card';
        playerCard.style.marginTop = '20px';

        playerCard.innerHTML = `
            <h3><i class="fas fa-user"></i> ${playerName}</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-top: 15px;">
                <div>
                    <div class="stat-label">Partidas jugadas</div>
                    <div class="stat-value" style="font-size: 1.5em;">${stats.gamesPlayed}</div>
                </div>
                <div>
                    <div class="stat-label">Victorias</div>
                    <div class="stat-value" style="font-size: 1.5em; color: var(--success-color);">${stats.wins}</div>
                </div>
                <div>
                    <div class="stat-label">% Victorias</div>
                    <div class="stat-value" style="font-size: 1.5em;">${stats.winRate}%</div>
                </div>
                <div>
                    <div class="stat-label">Promedio puntos</div>
                    <div class="stat-value" style="font-size: 1.5em;">${stats.avgPoints}</div>
                </div>
                <div>
                    <div class="stat-label">Mejor partida</div>
                    <div class="stat-value" style="font-size: 1.5em; color: var(--success-color);">${stats.bestGame} pts</div>
                </div>
                <div>
                    <div class="stat-label">Peor partida</div>
                    <div class="stat-value" style="font-size: 1.5em; color: var(--error-color);">${stats.worstGame} pts</div>
                </div>
            </div>
        `;

        statsList.appendChild(playerCard);
    });
}

function calculateDetailedPlayerStats(playerName) {
    const history = JSON.parse(localStorage.getItem('gameHistory') || '[]');

    let stats = {
        gamesPlayed: 0,
        wins: 0,
        winRate: 0,
        avgPoints: 0,
        bestGame: Infinity,
        worstGame: 0,
        totalPoints: 0
    };

    history.forEach(game => {
        const player = game.players.find(p => p.name === playerName);
        if (!player) return;

        stats.gamesPlayed++;
        stats.totalPoints += player.totalPoints;
        stats.bestGame = Math.min(stats.bestGame, player.totalPoints);
        stats.worstGame = Math.max(stats.worstGame, player.totalPoints);

        if (game.winner && game.winner.name === playerName) {
            stats.wins++;
        }
    });

    stats.avgPoints = stats.gamesPlayed > 0 ? (stats.totalPoints / stats.gamesPlayed).toFixed(1) : 0;
    stats.winRate = stats.gamesPlayed > 0 ? ((stats.wins / stats.gamesPlayed) * 100).toFixed(1) : 0;
    stats.bestGame = stats.bestGame === Infinity ? 0 : stats.bestGame;

    return stats;
}

// Comparar jugadores
function setupCompareView() {
    const history = JSON.parse(localStorage.getItem('gameHistory') || '[]');
    const player1Select = document.getElementById('player1Select');
    const player2Select = document.getElementById('player2Select');

    // Limpiar opciones anteriores
    player1Select.innerHTML = '<option value="">Selecciona Jugador 1</option>';
    player2Select.innerHTML = '<option value="">Selecciona Jugador 2</option>';

    // Obtener jugadores únicos
    const allPlayers = new Set();
    history.forEach(game => {
        game.players.forEach(p => allPlayers.add(p.name));
    });

    // Añadir opciones
    allPlayers.forEach(name => {
        const option1 = document.createElement('option');
        option1.value = name;
        option1.textContent = name;
        player1Select.appendChild(option1);

        const option2 = document.createElement('option');
        option2.value = name;
        option2.textContent = name;
        player2Select.appendChild(option2);
    });
}

function comparePlayersIfReady() {
    const player1 = document.getElementById('player1Select').value;
    const player2 = document.getElementById('player2Select').value;

    if (player1 && player2 && player1 !== player2) {
        comparePlayers(player1, player2);
    }
}

function comparePlayers(player1Name, player2Name) {
    const stats1 = calculateDetailedPlayerStats(player1Name);
    const stats2 = calculateDetailedPlayerStats(player2Name);

    const history = JSON.parse(localStorage.getItem('gameHistory') || '[]');

    // Enfrentamientos directos
    let headToHead = { player1Wins: 0, player2Wins: 0, ties: 0 };
    history.forEach(game => {
        const p1 = game.players.find(p => p.name === player1Name);
        const p2 = game.players.find(p => p.name === player2Name);

        if (p1 && p2 && game.winner) {
            if (game.winner.name === player1Name) headToHead.player1Wins++;
            else if (game.winner.name === player2Name) headToHead.player2Wins++;
        }
    });

    const compareResults = document.getElementById('compareResults');
    compareResults.innerHTML = `
        <div class="game-detail-header" style="text-align: center;">
            <h3>Enfrentamientos Directos</h3>
            <div style="font-size: 2em; margin: 10px 0;">
                ${headToHead.player1Wins} - ${headToHead.player2Wins}
            </div>
            <div style="font-size: 0.9em;">
                ${player1Name} vs ${player2Name}
            </div>
        </div>

        <div class="compare-stats">
            <div class="player-stats">
                <h3>${player1Name}</h3>
                <div style="margin-top: 15px;">
                    <div style="margin: 10px 0;">
                        <div class="stat-name">Partidas Jugadas</div>
                        <div class="stat-comparison-value ${stats1.gamesPlayed > stats2.gamesPlayed ? 'winner-indicator' : ''}">${stats1.gamesPlayed}</div>
                    </div>
                    <div style="margin: 10px 0;">
                        <div class="stat-name">Victorias</div>
                        <div class="stat-comparison-value ${stats1.wins > stats2.wins ? 'winner-indicator' : ''}">${stats1.wins}</div>
                    </div>
                    <div style="margin: 10px 0;">
                        <div class="stat-name">% Victorias</div>
                        <div class="stat-comparison-value ${parseFloat(stats1.winRate) > parseFloat(stats2.winRate) ? 'winner-indicator' : ''}">${stats1.winRate}%</div>
                    </div>
                    <div style="margin: 10px 0;">
                        <div class="stat-name">Promedio Puntos</div>
                        <div class="stat-comparison-value ${parseFloat(stats1.avgPoints) < parseFloat(stats2.avgPoints) ? 'winner-indicator' : ''}">${stats1.avgPoints}</div>
                    </div>
                    <div style="margin: 10px 0;">
                        <div class="stat-name">Mejor Partida</div>
                        <div class="stat-comparison-value ${stats1.bestGame < stats2.bestGame ? 'winner-indicator' : ''}">${stats1.bestGame}</div>
                    </div>
                </div>
            </div>

            <div class="stat-comparison">
                <div style="font-size: 3em; color: var(--primary-color);">⚔️</div>
            </div>

            <div class="player-stats">
                <h3>${player2Name}</h3>
                <div style="margin-top: 15px;">
                    <div style="margin: 10px 0;">
                        <div class="stat-name">Partidas Jugadas</div>
                        <div class="stat-comparison-value ${stats2.gamesPlayed > stats1.gamesPlayed ? 'winner-indicator' : ''}">${stats2.gamesPlayed}</div>
                    </div>
                    <div style="margin: 10px 0;">
                        <div class="stat-name">Victorias</div>
                        <div class="stat-comparison-value ${stats2.wins > stats1.wins ? 'winner-indicator' : ''}">${stats2.wins}</div>
                    </div>
                    <div style="margin: 10px 0;">
                        <div class="stat-name">% Victorias</div>
                        <div class="stat-comparison-value ${parseFloat(stats2.winRate) > parseFloat(stats1.winRate) ? 'winner-indicator' : ''}">${stats2.winRate}%</div>
                    </div>
                    <div style="margin: 10px 0;">
                        <div class="stat-name">Promedio Puntos</div>
                        <div class="stat-comparison-value ${parseFloat(stats2.avgPoints) < parseFloat(stats1.avgPoints) ? 'winner-indicator' : ''}">${stats2.avgPoints}</div>
                    </div>
                    <div style="margin: 10px 0;">
                        <div class="stat-name">Mejor Partida</div>
                        <div class="stat-comparison-value ${stats2.bestGame < stats1.bestGame ? 'winner-indicator' : ''}">${stats2.bestGame}</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Vista detallada de partida con gráfico
function showGameDetail(game, index) {
    hideAllContainers();
    const detailContainer = document.getElementById('gameDetailContainer');
    const detailContent = document.getElementById('gameDetailContent');

    detailContainer.style.display = 'block';
    detailContainer.classList.add('animate__fadeIn');

    const maxRounds = Math.max(...game.players.map(p => p.points.length));

    detailContent.innerHTML = `
        <div class="game-detail-header">
            <div class="game-detail-info">
                <div class="detail-item">
                    <div class="detail-label">Fecha</div>
                    <div class="detail-value">${new Date(game.date).toLocaleDateString()}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Jugadores</div>
                    <div class="detail-value">${game.players.length}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Rondas</div>
                    <div class="detail-value">${maxRounds}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Ganador</div>
                    <div class="detail-value">${game.winner ? game.winner.name : 'N/A'}</div>
                </div>
            </div>
        </div>

        <div class="chart-container">
            <canvas id="gameProgressChart"></canvas>
        </div>

        <div style="margin-top: 20px;">
            <button class="btn primary-btn" onclick="shareGameResult(${index})">
                <i class="fas fa-share"></i> Compartir Resultado
            </button>
        </div>
    `;

    // Crear gráfico
    createProgressChart(game);
}

function createProgressChart(game) {
    const ctx = document.getElementById('gameProgressChart');
    if (!ctx) return;

    const maxRounds = Math.max(...game.players.map(p => p.points.length));
    const labels = Array.from({ length: maxRounds }, (_, i) => `Ronda ${i + 1}`);

    const datasets = game.players.map((player, index) => {
        const colors = ['#4CAF50', '#2196F3', '#FF9800', '#E91E63', '#9C27B0', '#00BCD4', '#FFEB3B', '#795548'];
        const color = colors[index % colors.length];

        // Calcular puntos acumulados
        const cumulativePoints = [];
        let total = 0;
        player.points.forEach(points => {
            if (points === '---') {
                cumulativePoints.push(total);
            } else {
                total += points;
                cumulativePoints.push(total);
            }
        });

        return {
            label: player.name,
            data: cumulativePoints,
            borderColor: color,
            backgroundColor: color + '20',
            tension: 0.3,
            fill: false,
            borderWidth: 3,
            pointRadius: 5,
            pointHoverRadius: 7
        };
    });

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: document.body.classList.contains('dark-mode') ? '#f4f4f4' : '#333',
                        font: {
                            size: 12
                        }
                    }
                },
                title: {
                    display: true,
                    text: 'Progresión de Puntos',
                    color: document.body.classList.contains('dark-mode') ? '#f4f4f4' : '#333',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Puntos Acumulados',
                        color: document.body.classList.contains('dark-mode') ? '#f4f4f4' : '#333'
                    },
                    ticks: {
                        color: document.body.classList.contains('dark-mode') ? '#f4f4f4' : '#333'
                    },
                    grid: {
                        color: document.body.classList.contains('dark-mode') ? '#555' : '#ddd'
                    }
                },
                x: {
                    ticks: {
                        color: document.body.classList.contains('dark-mode') ? '#f4f4f4' : '#333'
                    },
                    grid: {
                        color: document.body.classList.contains('dark-mode') ? '#555' : '#ddd'
                    }
                }
            }
        }
    });
}

// Compartir resultados
function shareGameResult(gameIndex) {
    const history = JSON.parse(localStorage.getItem('gameHistory') || '[]');
    const game = history[gameIndex];

    if (!game) return;

    const text = generateShareText(game);

    // Intentar usar la API de compartir nativa
    if (navigator.share) {
        navigator.share({
            title: 'Resultado de Remigio',
            text: text
        }).catch(() => {
            // Si falla, copiar al portapapeles
            copyToClipboard(text);
        });
    } else {
        copyToClipboard(text);
    }
}

function generateShareText(game) {
    const date = new Date(game.date).toLocaleDateString();
    const winner = game.winner ? game.winner.name : 'N/A';

    let text = `🎴 Partida de Remigio - ${date}\n\n`;
    text += `🏆 Ganador: ${winner}\n\n`;
    text += `📊 Resultados finales:\n`;

    const sortedPlayers = [...game.players].sort((a, b) => a.totalPoints - b.totalPoints);
    sortedPlayers.forEach((player, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
        text += `${medal} ${player.name}: ${player.totalPoints} puntos\n`;
    });

    return text;
}

function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Resultado copiado al portapapeles', 'success');
        });
    } else {
        // Fallback para navegadores antiguos
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('Resultado copiado al portapapeles', 'success');
    }
}

// Exportar/Importar datos
function exportAllData() {
    const data = {
        currentGame: localStorage.getItem('currentGame'),
        gameHistory: localStorage.getItem('gameHistory'),
        achievements: localStorage.getItem('achievements'),
        openaiApiKey: localStorage.getItem('openaiApiKey'),
        openaiModel: localStorage.getItem('openaiModel'),
        aiPrompt: localStorage.getItem('aiPrompt'),
        darkMode: localStorage.getItem('darkMode'),
        exportDate: new Date().toISOString(),
        version: '2.0'
    };

    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `remigio-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('Datos exportados correctamente', 'success');
    closeModal('dataModal');
}

function importAllData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);

            // Validar que tenga la estructura correcta
            if (!data.version || !data.gameHistory) {
                showToast('Archivo de respaldo inválido', 'error');
                return;
            }

            // Confirmar importación
            if (!confirm('¿Estás seguro de que quieres importar estos datos? Esto sobrescribirá todos los datos actuales.')) {
                return;
            }

            // Restaurar datos
            Object.keys(data).forEach(key => {
                if (key !== 'exportDate' && key !== 'version' && data[key]) {
                    localStorage.setItem(key, data[key]);
                }
            });

            showToast('Datos importados correctamente. Recargando...', 'success');

            // Recargar página después de 2 segundos
            setTimeout(() => {
                location.reload();
            }, 2000);

        } catch (error) {
            showToast('Error al importar datos: ' + error.message, 'error');
        }
    };

    reader.readAsText(file);
    event.target.value = ''; // Reset input
}