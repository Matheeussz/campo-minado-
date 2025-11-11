// Configurações Globais do Jogo
const ROWS = 8;
const COLS = 8;
const BOMBS = 10;
let isGameOver = false;
let board = [];
let cellsToReveal; // Contador para saber quando o jogador venceu

// ----------------------------------------------------
// Funções para exibição de mensagens na tela (substituindo o alert())
function exibirMensagem(texto, cor = 'white') {
    const msgElement = document.getElementById('game-message');
    msgElement.textContent = texto;
    msgElement.style.color = cor;
    msgElement.style.fontSize = '1.5em';
    msgElement.style.fontWeight = 'bold';
}

function limparMensagem() {
    document.getElementById('game-message').textContent = '';
}
// ----------------------------------------------------


// 1. Função para iniciar o jogo (chamada pelo botão "Bora jogar!")
function iniciarJogo() {
    // Esconde o conteúdo inicial dentro do 'content'
    document.querySelector('.content h2').style.display = 'none';
    document.querySelector('.content p').style.display = 'none';
    document.getElementById('start-button').style.display = 'none';

    // MOSTRA a área do jogo (tabuleiro e botão Novo Jogo)
    document.getElementById('game-area').style.display = 'flex'; 

    criarTabuleiro();
}

// 2. Função principal para criar o tabuleiro
function criarTabuleiro() {
    const gameBoard = document.getElementById('game-board');
    gameBoard.innerHTML = '';
    board = [];
    isGameOver = false;
    cellsToReveal = ROWS * COLS - BOMBS;
    limparMensagem();

    // Aplica o Grid CSS
    gameBoard.style.display = 'grid'; 
    gameBoard.style.gridTemplateColumns = `repeat(${COLS}, 30px)`;
    gameBoard.style.gap = '2px';
    
    // 2.1. Inicializa a matriz e cria os elementos HTML
    for (let r = 0; r < ROWS; r++) {
        board[r] = [];
        for (let c = 0; c < COLS; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell', 'hidden');
            cell.dataset.row = r;
            cell.dataset.col = c;

            // Adiciona eventos de clique e clique direito (bandeira)
            cell.onclick = () => revelarCelula(r, c);
            cell.oncontextmenu = (e) => { e.preventDefault(); marcarBandeira(r, c); };

            gameBoard.appendChild(cell);
            board[r][c] = { isBomb: false, count: 0, element: cell, revealed: false, flagged: false };
        }
    }

    colocarBombas();
    calcularBombasVizinhas(); 
}

// 3. Lógica para posicionar as bombas aleatoriamente
function colocarBombas() {
    let bombsPlaced = 0;
    while (bombsPlaced < BOMBS) {
        const randRow = Math.floor(Math.random() * ROWS);
        const randCol = Math.floor(Math.random() * COLS);

        if (!board[randRow][randCol].isBomb) {
            board[randRow][randCol].isBomb = true;
            bombsPlaced++;
        }
    }
}

// 4. Lógica para calcular o número de bombas vizinhas
function calcularBombasVizinhas() {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (!board[r][c].isBomb) {
                board[r][c].count = contarVizinhos(r, c);
            }
        }
    }
}

// 5. Função auxiliar para contar vizinhos de uma célula
function contarVizinhos(row, col) {
    let count = 0;
    for (let r = row - 1; r <= row + 1; r++) {
        for (let c = col - 1; c <= col + 1; c++) {
            if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
                 if (board[r][c].isBomb) {
                    count++;
                }
            }
        }
    }
    return count;
}


// 6. Função para manipular o clique e revelar a célula
function revelarCelula(row, col) {
    if (isGameOver || board[row][col].revealed || board[row][col].flagged) return;

    const cellData = board[row][col];
    const cellElement = cellData.element;

    if (cellData.isBomb) {
        // PERDEU
        cellData.revealed = true; 
        cellElement.classList.remove('hidden');
        cellElement.classList.add('revealed');
        cellElement.textContent = '💣';
        cellElement.style.backgroundColor = 'red'; // Destaque a bomba clicada

        isGameOver = true;
        revelarTodasBombas(); // REVELA TODAS AS BOMBAS AO PERDER
        
        exibirMensagem('💥 BOOM! Você explodiu! Fim de Jogo.', '#FFD700'); // Amarelo
        return;
    }

    // É SEGURO
    cellData.revealed = true;
    cellElement.classList.remove('hidden');
    cellElement.classList.add('revealed');
    cellElement.classList.add(`n${cellData.count}`);

    cellsToReveal--;

    if (cellData.count > 0) {
        cellElement.textContent = cellData.count;
    } else {
        cellElement.textContent = ''; 
        revelarVizinhosVazios(row, col); // Cascata
    }

    // Verifica condição de vitória
    if (cellsToReveal === 0) {
        isGameOver = true;
        revelarTodasBombas(); // Opcional: revela bombas mesmo ao vencer
        exibirMensagem('🎉 Parabéns! Você limpou o campo minado e venceu!', '#FFD700'); // Amarelo
    }
}

// 7. Função para revelação em cascata (Flood Fill)
function revelarVizinhosVazios(row, col) {
    for (let r = row - 1; r <= row + 1; r++) {
        for (let c = col - 1; c <= col + 1; c++) {
            if (r >= 0 && r < ROWS && c >= 0 && c < COLS && !board[r][c].revealed && !board[r][c].isBomb) {
                revelarCelula(r, c); 
            }
        }
    }
}

// 8. Função para marcar/desmarcar bandeira (Clique direito)
function marcarBandeira(row, col) {
    if (isGameOver || board[row][col].revealed) return;

    const cellData = board[row][col];
    const cellElement = cellData.element;

    cellData.flagged = !cellData.flagged;

    if (cellData.flagged) {
        cellElement.textContent = '🚩';
    } else {
        cellElement.textContent = '';
    }
}


// 9. Função para revelar todas as bombas no fim do jogo
function revelarTodasBombas() {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const cell = board[r][c];
            if (cell.isBomb) { 
                cell.element.classList.remove('hidden');
                cell.element.classList.add('revealed');
                
                // Aplica cor escura nas bombas não clicadas
                if (cell.element.style.backgroundColor !== 'red') { 
                    cell.element.textContent = '💣';
                    cell.element.style.backgroundColor = '#444'; 
                }
            }
        }
    }
}


// 10. Função para reiniciar o jogo (chamada pelo botão "Novo Jogo")
function reiniciarJogo() {
    isGameOver = false; 
    document.getElementById('game-board').innerHTML = '';
    limparMensagem();
    criarTabuleiro();
}