// script.js
document.getElementById('newGameButton').addEventListener('click', showNewGameForm);
document.getElementById('pastGamesButton').addEventListener('click', showPastGames);
document.getElementById('gameForm').addEventListener('submit', startNewGame);

let games = [];
let currentGame = null;

function showNewGameForm() {
    document.getElementById('home').style.display = 'none';
    document.getElementById('newGame').style.display = 'block';
}

function showPastGames() {
    document.getElementById('home').style.display = 'none';
    document.getElementById('pastGames').style.display = 'block';
    displayPastGames();
}

function startNewGame(event) {
    event.preventDefault();
    const date = document.getElementById('date').value;
    const playerNames = document.getElementById('players').value.split(',').map(name => name.trim());
    const players = playerNames.map(name => ({ name, points: [], totalPoints: 0 }));
    currentGame = { date, players, rounds: [] };
    games.push(currentGame);
    document.getElementById('newGame').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'block';
    displayCurrentGame();
}

function displayCurrentGame() {
    const gameContainer = document.getElementById('gameContainer');
    gameContainer.innerHTML = ''; // Limpia el contenedor antes de añadir nuevos elementos

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

            // Si los puntos totales superan 150 en esta ronda, aplicar la clase 'round-loser'
            if (totalPointsUpToThisRound >= 151) {
                pointCell.classList.add('round-loser');
            }

            roundRow.appendChild(pointCell);
        });
        table.appendChild(roundRow);
    }

    const totalRow = document.createElement('tr');
    totalRow.innerHTML = '<td>Total</td>';
    currentGame.players.forEach(player => {
        const totalCell = document.createElement('td');
        totalCell.textContent = player.totalPoints;

        // Aplicar clases CSS basadas en las puntuaciones totales
        if (player.totalPoints >= 151) {
            totalCell.classList.add('total-loser');
        }

        totalRow.appendChild(totalCell);
    });
    table.appendChild(totalRow);

    gameContainer.appendChild(table);

    // Añadir el formulario para nuevas rondas solo si la partida no ha terminado
    if (currentGame.players.some(player => player.totalPoints < 151)) {
        const roundForm = document.createElement('form');
        roundForm.addEventListener('submit', addRound);

        currentGame.players.forEach((player, index) => {
            if (player.totalPoints < 151) {
                const label = document.createElement('label');
                label.textContent = player.name;
                label.setAttribute('for', `player${index + 1}`);
                roundForm.appendChild(label);

                const input = document.createElement('input');
                input.type = 'number';
                input.id = `player${index + 1}`;
                input.required = true;
                input.min = 0;
                roundForm.appendChild(input);
            }
        });

        const buttonSubmitContainer = document.createElement('div');
        buttonSubmitContainer.style.display = 'flex';
        buttonSubmitContainer.style.flexDirection = 'column';
        buttonSubmitContainer.style.gap = '10px';
        roundForm.appendChild(buttonSubmitContainer);

        const submitButton = document.createElement('button');
        submitButton.type = 'submit';
        submitButton.textContent = 'Agregar Ronda';
        buttonSubmitContainer.appendChild(submitButton);

        gameContainer.appendChild(roundForm);
    }

            // Crear un contenedor para los botones que permitirá alinearlos verticalmente
            const buttonsContainer = document.createElement('div');
            buttonsContainer.style.display = 'flex';
            buttonsContainer.style.flexDirection = 'column';
            buttonsContainer.style.gap = '10px';

            // Añadir botón para exportar a CSV
            const exportButton = document.createElement('button');
            exportButton.textContent = 'Exportar a CSV';
            exportButton.onclick = exportToCSV;
            buttonsContainer.appendChild(exportButton);
    
            // Añadir botón para leer puntuaciones
            const readScoresButton = document.createElement('button');
            readScoresButton.textContent = 'Leer Puntuaciones';
            readScoresButton.onclick = readScores;
            buttonsContainer.appendChild(readScoresButton);

            // Añadir el contenedor de botones al contenedor del juego
            gameContainer.appendChild(buttonsContainer);


}

function addRound(event) {
    event.preventDefault();

    const round = [];

    currentGame.players.forEach((player, index) => {
        const inputElement = document.getElementById(`player${index + 1}`);
        let points = 0;

        if (inputElement) {
            points = parseInt(inputElement.value) || 0;
            player.points.push(points);
            player.totalPoints += points;
        } else {
            player.points.push('---'); // Añade '---' para mantener la consistencia de la longitud de la matriz de puntos
        }

        round.push({ name: player.name, points: inputElement ? points : '---' });
    });

    currentGame.rounds.push(round);

    checkWinCondition();
    displayCurrentGame();
}

function checkWinCondition() {
    const remainingPlayers = currentGame.players.filter(player => player.totalPoints < 151);

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

function displayPastGames() {
    const pastGamesContainer = document.getElementById('pastGames');
    pastGamesContainer.innerHTML = '';

    games.forEach(game => {
        const gameDiv = document.createElement('div');
        gameDiv.classList.add('game');

        const dateDiv = document.createElement('div');
        dateDiv.textContent = `Fecha: ${game.date}`;
        gameDiv.appendChild(dateDiv);

        const table = document.createElement('table');
        const headerRow = document.createElement('tr');
        headerRow.innerHTML = '<th>Jugador</th>';
        game.rounds.forEach((round, index) => {
            headerRow.innerHTML += `<th>Ronda ${index + 1}</th>`;
        });
        headerRow.innerHTML += '<th>Total Puntos</th>';
        table.appendChild(headerRow);

        game.players.forEach(player => {
            const row = document.createElement('tr');
            row.innerHTML = `<td>${player.name}</td>`;
            game.rounds.forEach(round => {
                const playerRound = round.find(r => r.name === player.name);
                const points = playerRound ? playerRound.points : '-';
                const cell = document.createElement('td');
                cell.textContent = points;
                if (points === 0) {
                    cell.classList.add('round-winner');
                }
                row.appendChild(cell);
            });
            const totalPointsCell = document.createElement('td');
            totalPointsCell.textContent = player.totalPoints;
            if (player.totalPoints >= 151) {
                totalPointsCell.classList.add('loser');
            } else if (player.totalPoints < 151 && game.players.every(p => p.totalPoints >= 151 || p === player)) {
                totalPointsCell.classList.add('winner');
            }
            row.appendChild(totalPointsCell);
            table.appendChild(row);
        });

        // Añadir fila de puntuación total
        const totalRow = document.createElement('tr');
        totalRow.innerHTML = '<td>Total</td>';
        game.players.forEach(player => {
            const totalCell = document.createElement('td');
            totalCell.textContent = player.totalPoints;
            totalRow.appendChild(totalCell);
        });
        table.appendChild(totalRow);

        gameDiv.appendChild(table);
        pastGamesContainer.appendChild(gameDiv);
    });
}

function readScores() {
    // Construir una cadena con las puntuaciones totales de forma resumida
    let scoresText = 'Puntuaciones totales: ';
    scoresText += currentGame.players
        .filter(player => player.totalPoints < 151)
        .map(player => `${player.name}, ${player.totalPoints} puntos`)
        .join(', ') + '. ';

    // Determinar quién va ganando y quién va perdiendo
    let winningPlayer = null;
    let losingPlayer = null;
    let minPoints = Infinity;
    let maxPoints = -Infinity;

    currentGame.players.forEach(player => {
        if (player.totalPoints < 151) {
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

