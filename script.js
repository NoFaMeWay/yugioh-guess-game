// 游戏状态
let gameState = {
    answerCard: null,
    guessedCards: [],
    difficulty: 'medium',
    attributes: ['暗', '光', '水', '炎', '地', '风', '神'],
    races: ['龙族', '魔法师族', '战士族', '兽战士族', '恶魔族', '天使族', '不死族', '机械族', '水族', '炎族', '岩石族', '鸟兽族', '植物族', '昆虫族', '雷族', '鱼族', '海龙族', '爬虫类族', '恐龙族', '幻神兽族', '创造神族']
};

// DOM元素
const elements = {
    difficultySelect: document.getElementById('difficulty'),
    startButton: document.getElementById('start-game'),
    gameArea: document.querySelector('.game-area'),
    guessInput: document.getElementById('guess-input'),
    submitButton: document.getElementById('submit-guess'),
    hintsDisplay: document.getElementById('hints-display'),
    matchesDisplay: document.getElementById('matches-display')
};

// 初始化游戏
function initGame() {
    // 从API获取随机怪兽卡作为答案
    fetchRandomMonsterCard().then(card => {
        gameState.answerCard = processCardData(card);
        startGame();
    }).catch(error => {
        console.error('获取卡片数据失败:', error);
        alert('无法获取卡片数据，请稍后再试');
    });
}

// 从Yugioh API获取随机怪兽卡
async function fetchRandomMonsterCard() {
    try {
        const response = await fetch('https://db.ygoprodeck.com/api/v7/randomcard.php');
        const card = await response.json();
        
        // 确保是怪兽卡
        if (card.type.includes('Monster')) {
            return card;
        } else {
            // 如果不是怪兽卡，重新获取
            return fetchRandomMonsterCard();
        }
    } catch (error) {
        throw error;
    }
}

// 处理卡片数据
function processCardData(card) {
    return {
        name: card.name,
        type: card.type,
        attribute: card.attribute,
        race: card.race,
        level: card.level || 0,
        atk: card.atk || 0,
        def: card.def || 0,
        desc: card.desc
    };
}

// 开始游戏
function startGame() {
    gameState.guessedCards = [];
    gameState.difficulty = elements.difficultySelect.value;
    
    // 显示游戏区域
    elements.gameArea.classList.remove('hidden');
    
    // 清空输入和显示
    elements.guessInput.value = '';
    elements.hintsDisplay.innerHTML = '';
    elements.matchesDisplay.innerHTML = '';
    
    // 显示属性列表和种族列表（随机顺序）
    displayRandomLists();
    
    // 设置提示数量
    const hintCount = getHintCountByDifficulty();
    elements.hintsDisplay.innerHTML += `<p>您将有 ${hintCount} 次提示机会</p>`;
}

// 根据难度获取提示数量
function getHintCountByDifficulty() {
    switch(gameState.difficulty) {
        case 'easy': return 5;
        case 'medium': return 3;
        case 'hard': return 1;
        default: return 3;
    }
}

// 显示随机顺序的属性列表和种族列表
function displayRandomLists() {
    // 随机排序属性
    const shuffledAttrs = [...gameState.attributes].sort(() => Math.random() - 0.5);
    const shuffledRaces = [...gameState.races].sort(() => Math.random() - 0.5);
    
    elements.hintsDisplay.innerHTML += `
        <div class="attribute-list">
            <p>属性列表:</p>
            ${shuffledAttrs.map(attr => `<span class="attribute-item">${attr}</span>`).join('')}
        </div>
        <div class="race-list">
            <p>种族列表:</p>
            ${shuffledRaces.map(race => `<span class="race-item">${race}</span>`).join('')}
        </div>
    `;
}

// 提交猜测
function submitGuess() {
    const guess = elements.guessInput.value.trim();
    if (!guess) return;
    
    // 检查是否已经猜过这张卡
    if (gameState.guessedCards.includes(guess)) {
        alert('您已经猜过这张卡了');
        return;
    }
    
    // 添加到已猜列表
    gameState.guessedCards.push(guess);
    
    // 获取卡片数据
    fetchCardByName(guess).then(card => {
        if (!card) {
            alert('未找到这张卡片，请检查名称是否正确');
            return;
        }
        
        const processedCard = processCardData(card);
        displayComparison(processedCard);
        
        // 检查是否猜中
        if (processedCard.name === gameState.answerCard.name) {
            endGame(true);
        }
    }).catch(error => {
        console.error('获取卡片数据失败:', error);
        alert('获取卡片数据失败，请稍后再试');
    });
    
    elements.guessInput.value = '';
}

// 根据名称获取卡片
async function fetchCardByName(name) {
    try {
        const response = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodeURIComponent(name)}`);
        const data = await response.json();
        return data.data[0];
    } catch (error) {
        throw error;
    }
}

// 显示比较结果
function displayComparison(guessedCard) {
    const answer = gameState.answerCard;
    let html = '<div class="match-item">';
    
    // 名称比较
    if (guessedCard.name === answer.name) {
        html += `<p class="correct">名称: ${guessedCard.name} ✔</p>`;
    } else {
        html += `<p>名称: ${guessedCard.name}</p>`;
    }
    
    // 属性比较
    if (guessedCard.attribute === answer.attribute) {
        html += `<p class="correct">属性: ${guessedCard.attribute} ✔</p>`;
    } else {
        const attrIndex = gameState.attributes.indexOf(guessedCard.attribute);
        const answerIndex = gameState.attributes.indexOf(answer.attribute);
        const diff = Math.abs(attrIndex - answerIndex);
        html += `<p>属性: ${guessedCard.attribute} (差: ${diff})</p>`;
    }
    
    // 种族比较
    if (guessedCard.race === answer.race) {
        html += `<p class="correct">种族: ${guessedCard.race} ✔</p>`;
    } else {
        const raceIndex = gameState.races.indexOf(guessedCard.race);
        const answerIndex = gameState.races.indexOf(answer.race);
        const diff = Math.abs(raceIndex - answerIndex);
        html += `<p>种族: ${guessedCard.race} (差: ${diff})</p>`;
    }
    
    // 等级比较
    if (guessedCard.level == answer.level) {
        html += `<p class="correct">等级: ${guessedCard.level} ✔</p>`;
    } else {
        const diff = Math.abs(guessedCard.level - answer.level);
        html += `<p>等级: ${guessedCard.level} (差: ${diff})</p>`;
    }
    
    // 攻击力比较
    if (guessedCard.atk == answer.atk) {
        html += `<p class="correct">攻击力: ${guessedCard.atk} ✔</p>`;
    } else {
        const diff = Math.abs(guessedCard.atk - answer.atk);
        html += `<p>攻击力: ${guessedCard.atk} (差: ${diff})</p>`;
    }
    
    // 守备力比较
    if (guessedCard.def == answer.def) {
        html += `<p class="correct">守备力: ${guessedCard.def} ✔</p>`;
    } else {
        const diff = Math.abs(guessedCard.def - answer.def);
        html += `<p>守备力: ${guessedCard.def} (差: ${diff})</p>`;
    }
    
    html += '</div>';
    elements.matchesDisplay.insertAdjacentHTML('afterbegin', html);
}

// 结束游戏
function endGame(isWin) {
    if (isWin) {
        elements.matchesDisplay.insertAdjacentHTML('afterbegin', 
            `<div class="match-item correct">
                <h3>恭喜您猜对了!</h3>
                <p>正确答案是: ${gameState.answerCard.name}</p>
                <p>描述: ${gameState.answerCard.desc}</p>
            </div>`
        );
    }
    
    // 禁用输入和提交按钮
    elements.guessInput.disabled = true;
    elements.submitButton.disabled = true;
}

// 事件监听
elements.startButton.addEventListener('click', initGame);
elements.submitButton.addEventListener('click', submitGuess);
elements.guessInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') submitGuess();
});
