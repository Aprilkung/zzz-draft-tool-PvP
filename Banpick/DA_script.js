import { characters, weapons } from './Data.js';

const GAME_PHASES = {
    BLUE_PROPOSE_1: 'BLUE_PROPOSE_1',
    RED_CHOOSE_1_FOR_BLUE_1: 'RED_CHOOSE_1_FOR_BLUE_1',
    RED_PROPOSE_1: 'RED_PROPOSE_1',
    BLUE_CHOOSE_1_FOR_RED_1: 'BLUE_CHOOSE_1_FOR_RED_1',
    RED_PROPOSE_2: 'RED_PROPOSE_2',
    BLUE_CHOOSE_1_FOR_RED_2: 'BLUE_CHOOSE_1_FOR_RED_2',
    BLUE_PROPOSE_2: 'BLUE_PROPOSE_2',
    RED_CHOOSE_1_FOR_BLUE_2: 'RED_CHOOSE_1_FOR_BLUE_2',
    RED_FREE_PICK: 'RED_FREE_PICK',
    BLUE_FREE_PICK: 'BLUE_FREE_PICK',
    GAME_OVER: 'GAME_OVER',
};

const PHASE_MESSAGES = {
    [GAME_PHASES.BLUE_PROPOSE_1]: 'Team Blue : Propose 3 agents',
    [GAME_PHASES.RED_CHOOSE_1_FOR_BLUE_1]: 'Red Team : Choose 1 agent for Blue.',
    [GAME_PHASES.RED_PROPOSE_1]: 'Team Red: Propose 3 agents',
    [GAME_PHASES.BLUE_CHOOSE_1_FOR_RED_1]: 'Blue Team : Choose 1 agent for Red.',
    [GAME_PHASES.RED_PROPOSE_2]: 'Team Red: Propose 3 agents',
    [GAME_PHASES.BLUE_CHOOSE_1_FOR_RED_2]: 'Blue Team : Choose 1 agent for Red.',
    [GAME_PHASES.BLUE_PROPOSE_2]: 'Team Blue: Propose 3 agents',
    [GAME_PHASES.RED_CHOOSE_1_FOR_BLUE_2]: 'Red Team : Choose 1 agent for Blue.',
    [GAME_PHASES.RED_FREE_PICK]: 'Red team : Last free pick',
    [GAME_PHASES.BLUE_FREE_PICK]: 'Blue team : Last free pick',
    [GAME_PHASES.GAME_OVER]: 'Draft completed! Please insert M and W-engine',
};

const TURN_MESSAGES = {
    bluePropose: 'Blue is proposing (Pick 3)',
    redChooseForBlue: 'Red is choosing for Blue (Click the circle)',
    redPropose: 'Red is proposing (Pick 3)',
    blueChooseForRed: 'Blue is choosing for Red (Click the circle)',
    redFreePick: 'Red is picking',
    blueFreePick: 'Blue is picking',
    gameOver: 'Adjust Cost & Finalize',
};

const MAX_COST = 350;

let availableCharacters = [];
let blueTeamPicks = [];
let redTeamPicks = [];
let proposedCharacters = [];
let currentPhase;
let history = [];

const availableCharactersContainer = document.getElementById('availableCharactersContainer');
const blueCostDisplay = document.getElementById('blueCostDisplay');
const redCostDisplay = document.getElementById('redCostDisplay');
const gamePhaseDisplay = document.getElementById('gamePhaseDisplay');
const currentTurnDisplay = document.getElementById('currentTurnDisplay');
const resetButton = document.getElementById('resetButton');
const undoButton = document.getElementById('undoButton');
const finalButton = document.getElementById('finalButton');
const messageBox = document.getElementById('messageBox');
const messageTextContainer = document.getElementById('messageTextContainer');
const messageButtonContainer = document.getElementById('messageButtonContainer');
const teamBlueSection = document.querySelector('.team-section.bg-blue-900');
const teamRedSection = document.querySelector('.team-section.bg-red-900');

const pickElements = {
    blue: [
        document.getElementById('redChoose1BlueSlot1'),
        document.getElementById('redChoose1BlueSlot2'),
        document.getElementById('blueFreePickSlot')
    ],
    red: [
        document.getElementById('blueChoose1RedSlot1'),
        document.getElementById('blueChoose1RedSlot2'),
        document.getElementById('redFreePickSlot')
    ]
};

function initGame() {
    availableCharacters = JSON.parse(JSON.stringify(characters));
    blueTeamPicks = [];
    redTeamPicks = [];
    proposedCharacters = [];
    currentPhase = GAME_PHASES.BLUE_PROPOSE_1;
    history = [];
    
    [...pickElements.blue, ...pickElements.red].forEach(el => {
        el.innerHTML = '<span class="text-xs">Agent</span>';
        el.className = 'character-box placeholder';
    });
    
    document.getElementById('blueScoreInput').value = '';
    document.getElementById('redScoreInput').value = '';

    saveState();
    updateUI();
}

function saveState() {
    history.push({
        availableCharacters: JSON.parse(JSON.stringify(availableCharacters)),
        blueTeamPicks: JSON.parse(JSON.stringify(blueTeamPicks)),
        redTeamPicks: JSON.parse(JSON.stringify(redTeamPicks)),
        proposedCharacters: JSON.parse(JSON.stringify(proposedCharacters)),
        currentPhase: currentPhase,
    });
}

function updateUI() {
    renderAvailableCharacters();
    renderTeamDisplay();
    renderPhaseInfo();
    updateCostDisplays();
    updateTeamTurnHighlight();
}

function renderAvailableCharacters() {
    availableCharactersContainer.innerHTML = '';
    const pickedIds = new Set([...blueTeamPicks.map(p => p.char.id),...redTeamPicks.map(p => p.char.id)]);
    const proposedIds = new Set(proposedCharacters.map(p => p.id));
    availableCharacters.forEach(character => {
        if (pickedIds.has(character.id) || proposedIds.has(character.id)) return;
        const charCard = document.createElement('div');
        charCard.dataset.characterId = character.id;
        charCard.className = `character-card rounded-lg p-2 bg-gray-700 transition duration-200 ease-in-out ${isCharacterSelectable(character) ? 'selectable' : 'picked'}`;
        charCard.innerHTML = `<img src="${character.img}" alt="${character.name}" class="w-20 h-20 rounded-md mb-1 object-cover"><span class="char-name text-sm font-semibold text-gray-200">${character.name}</span>`;
        charCard.addEventListener('click', () => handleCharacterClick(character.id));
        availableCharactersContainer.appendChild(charCard);
    });
}

function renderTeamDisplay() {
    const proposalSlotsContainer = document.getElementById('proposalSlots');
    const proposalSlots = proposalSlotsContainer.children;

    [...pickElements.blue, ...pickElements.red].forEach(el => {
        el.innerHTML = '<span class="text-xs">Agent</span>';
        el.className = 'character-box placeholder';
    });

    const isProposingOrChoosing = currentPhase.includes('PROPOSE') || currentPhase.includes('CHOOSE');
    
    if (isProposingOrChoosing) {
        const isBlueTurn = [GAME_PHASES.BLUE_PROPOSE_1, GAME_PHASES.BLUE_PROPOSE_2, GAME_PHASES.RED_CHOOSE_1_FOR_BLUE_1, GAME_PHASES.RED_CHOOSE_1_FOR_BLUE_2].includes(currentPhase);
        proposalSlotsContainer.classList.toggle('proposal-aura-blue', isBlueTurn);
        proposalSlotsContainer.classList.toggle('proposal-aura-red', !isBlueTurn);
        const isClickable = currentPhase.includes('CHOOSE');
        renderSlots(proposalSlots, proposedCharacters, isClickable);
    } else {
        proposalSlotsContainer.className = 'flex justify-around gap-2 p-2 rounded-lg';
        renderSlots(proposalSlots, [], false);
    }

    blueTeamPicks.forEach((pick, index) => renderPickResult(pickElements.blue[index], pick, 'blue', index));
    redTeamPicks.forEach((pick, index) => renderPickResult(pickElements.red[index], pick, 'red', index));
}

function renderSlots(slots, charactersToRender, isClickable) {
    Array.from(slots).forEach((slot, index) => {
        slot.innerHTML = '';
        slot.className = 'character-slot relative w-16 h-16 bg-gray-600 rounded-full flex flex-col items-center justify-center border-2 border-dashed border-gray-500';
        slot.onclick = null;
        const char = charactersToRender[index];
        if (char) {
            slot.innerHTML = `<img src="${char.img}" alt="${char.name}" class="w-full h-full rounded-full object-cover">`;
            if (isClickable) {
                slot.classList.add('selectable');
                slot.onclick = () => handleSlotClick(char.id);
            }
        }
    });
}

function renderPickResult(element, pick, team, pickIndex) {
    if (!pick) return;
    
    if (currentPhase === GAME_PHASES.GAME_OVER) {
        element.className = 'character-box-configured';
        renderPostDraftUI(element, pick, team, pickIndex);
    } else {
        element.className = 'character-box';
        updateCharacterBox(element, pick.char);
    }
}

function updateCharacterBox(element, character) {
    if (character) {
        element.innerHTML = `<img src="${character.img}" alt="${character.name}" class="w-16 h-16 rounded-md mb-1 object-cover"><span class="char-name text-xs font-semibold">${character.name}</span>`;
    }
}

function calculateTeamCost(teamPicks) {
    return teamPicks.reduce((total, pick) => {
        if (!pick) return total;
        let cost = pick.char.baseCost;
        cost += pick.char.mChoices[pick.mLevel];
        if (pick.weapon) {
            cost += pick.weapon.ownerCharId.toLowerCase() === pick.char.id.toLowerCase() ? pick.weapon.costOwner : pick.weapon.costOther;
        }
        return total + cost;
    }, 0);
}

function updateCostDisplays() {
    const blueCost = calculateTeamCost(blueTeamPicks);
    const redCost = calculateTeamCost(redTeamPicks);
    blueCostDisplay.textContent = `${blueCost}/${MAX_COST}`;
    redCostDisplay.textContent = `${redCost}/${MAX_COST}`;
    blueCostDisplay.className = `cost-display ${blueCost > MAX_COST ? 'cost-exceeded' : 'cost-ok'}`;
    redCostDisplay.className = `cost-display ${redCost > MAX_COST ? 'cost-exceeded' : 'cost-ok'}`;
}

function handleCharacterClick(characterId) {
    const character = availableCharacters.find(c => c.id === characterId);
    if (!character || !isCharacterSelectable(character)) return;

    if (currentPhase.includes('PROPOSE')) {
        if (proposedCharacters.length < 3) {
            saveState();
            proposedCharacters.push(character);
            updateUI();
            if (proposedCharacters.length === 3) {
                setTimeout(() => {
                    advancePhase();
                }, 0);
            }
        }
    } else if (currentPhase.includes('FREE_PICK')) {
        saveState();
        const team = currentPhase === GAME_PHASES.BLUE_FREE_PICK ? 'blue' : 'red';
        const pickData = { char: character, mLevel: 0, weapon: null };
        if (team === 'blue') blueTeamPicks.push(pickData);
        else redTeamPicks.push(pickData);
        
        setTimeout(() => {
            advancePhase();
        }, 0);
    }
}

function handleSlotClick(characterId) {
    const character = characters.find(c => c.id === characterId);
    if (!character) return;
    saveState();
    const pickData = { char: character, mLevel: 0, weapon: null };
    if (currentPhase.startsWith('RED_CHOOSE')) blueTeamPicks.push(pickData);
    else if (currentPhase.startsWith('BLUE_CHOOSE')) redTeamPicks.push(pickData);
    proposedCharacters = [];
    advancePhase();
}

function isCharacterSelectable(character) {
    const isPicked = blueTeamPicks.some(p => p.char.id === character.id) || redTeamPicks.some(p => p.char.id === character.id);
    if (isPicked) return false;
    const isProposed = proposedCharacters.some(p => p.id === character.id);
    if (isProposed) return false;
    return currentPhase.includes('PROPOSE') || currentPhase.includes('FREE_PICK');
}

function advancePhase() {
    const phaseOrder = [
        GAME_PHASES.BLUE_PROPOSE_1, GAME_PHASES.RED_CHOOSE_1_FOR_BLUE_1,
        GAME_PHASES.RED_PROPOSE_1, GAME_PHASES.BLUE_CHOOSE_1_FOR_RED_1,
        GAME_PHASES.RED_PROPOSE_2, GAME_PHASES.BLUE_CHOOSE_1_FOR_RED_2,
        GAME_PHASES.BLUE_PROPOSE_2, GAME_PHASES.RED_CHOOSE_1_FOR_BLUE_2,
        GAME_PHASES.RED_FREE_PICK, GAME_PHASES.BLUE_FREE_PICK, GAME_PHASES.GAME_OVER
    ];
    const currentIndex = phaseOrder.indexOf(currentPhase);
    if (currentIndex < phaseOrder.length - 1) {
        currentPhase = phaseOrder[currentIndex + 1];
    }
    if (currentPhase === GAME_PHASES.GAME_OVER) {
        blueTeamPicks.sort((a,b) => a.char.name.localeCompare(b.char.name));
        redTeamPicks.sort((a,b) => a.char.name.localeCompare(b.char.name));
    }
    updateUI();
}

function renderPostDraftUI(element, pick, team, pickIndex) {
    const { char, mLevel, weapon } = pick;
    element.innerHTML = `
        <img src="${char.img}" alt="${char.name}" class="w-16 h-16 rounded-md mb-1 object-cover">
        <span class="char-name text-xs font-semibold">${char.name}</span>
        <div class="post-draft-controls">
            <div class="control-row">
                <label>W:</label>
                <div class="weapon-search-container" id="weapon-search-${team}-${pickIndex}">
                    <input type="text" placeholder="search..." value="${weapon ? weapon.name : ''}">
                    <div class="weapon-dropdown hidden"></div>
                </div>
                <label class="ml-2">M:</label>
                <select id="m-level-${team}-${pickIndex}">${[0,1,2,3,4,5,6].map(m => `<option value="${m}" ${m===mLevel ? 'selected' : ''}>M${m}</option>`).join('')}</select>
            </div>
        </div>`;
    setupPostDraftEventListeners(element, team, pickIndex);
}

function setupPostDraftEventListeners(element, team, pickIndex) {
    element.querySelector(`#m-level-${team}-${pickIndex}`).addEventListener('change', (e) => {
        const teamPicks = team === 'blue' ? blueTeamPicks : redTeamPicks;
        teamPicks[pickIndex].mLevel = parseInt(e.target.value, 10);
        updateCostDisplays();
    });
    const weaponInput = element.querySelector(`#weapon-search-${team}-${pickIndex} input`);
    const weaponDropdown = element.querySelector(`#weapon-search-${team}-${pickIndex} .weapon-dropdown`);
    const filterWeapons = () => {
        const searchTerm = weaponInput.value.toLowerCase();
        weaponDropdown.innerHTML = '';
        const filtered = weapons.filter(w => w.name.toLowerCase().includes(searchTerm));
        filtered.forEach(w => {
            const item = document.createElement('div');
            item.className = 'weapon-dropdown-item';
            item.textContent = w.name;
            item.addEventListener('click', () => {
                const teamPicks = team === 'blue' ? blueTeamPicks : redTeamPicks;
                teamPicks[pickIndex].weapon = w;
                weaponInput.value = w.name;
                weaponDropdown.classList.add('hidden');
                updateCostDisplays();
            });
            weaponDropdown.appendChild(item);
        });
        weaponDropdown.classList.toggle('hidden', filtered.length === 0 && weaponInput.value !== '');
    };
    weaponInput.addEventListener('input', filterWeapons);
    weaponInput.addEventListener('focus', filterWeapons);
    document.addEventListener('click', (e) => {
        if (!element.querySelector(`#weapon-search-${team}-${pickIndex}`).contains(e.target)) {
            weaponDropdown.classList.add('hidden');
        }
    });
}

function renderPhaseInfo() {
    gamePhaseDisplay.textContent = PHASE_MESSAGES[currentPhase] || '';
    let currentTurnKey = Object.keys(TURN_MESSAGES).find(key => {
        const simplePhase = currentPhase.toLowerCase().replace(/_1|_2/g, '');
        const simpleKey = key.toLowerCase().replace('forblue', '').replace('forred', '');
        return simplePhase.includes(simpleKey);
    });
    currentTurnDisplay.textContent = TURN_MESSAGES[currentTurnKey || 'gameOver'];
}

function updateTeamTurnHighlight() {
    teamBlueSection.classList.remove('active-turn', 'red-turn');
    teamRedSection.classList.remove('active-turn', 'red-turn');
    const blueTurnPhases = [GAME_PHASES.BLUE_PROPOSE_1, GAME_PHASES.BLUE_PROPOSE_2, GAME_PHASES.BLUE_CHOOSE_1_FOR_RED_1, GAME_PHASES.BLUE_CHOOSE_1_FOR_RED_2, GAME_PHASES.BLUE_FREE_PICK];
    const redTurnPhases = [GAME_PHASES.RED_PROPOSE_1, GAME_PHASES.RED_PROPOSE_2, GAME_PHASES.RED_CHOOSE_1_FOR_BLUE_1, GAME_PHASES.RED_CHOOSE_1_FOR_BLUE_2, GAME_PHASES.RED_FREE_PICK];
    if (blueTurnPhases.includes(currentPhase)) teamBlueSection.classList.add('active-turn');
    else if (redTurnPhases.includes(currentPhase)) teamRedSection.classList.add('active-turn', 'red-turn');
}

function undoLastAction() {
    if (history.length > 1) {
        history.pop();
        const lastState = history[history.length - 1];
        availableCharacters = JSON.parse(JSON.stringify(lastState.availableCharacters));
        blueTeamPicks = JSON.parse(JSON.stringify(lastState.blueTeamPicks));
        redTeamPicks = JSON.parse(JSON.stringify(lastState.redTeamPicks));
        proposedCharacters = JSON.parse(JSON.stringify(lastState.proposedCharacters));
        currentPhase = lastState.currentPhase;
        updateUI();
    }
}

function showMessage(htmlContent) {
    messageTextContainer.innerHTML = htmlContent;
    const okButtonHTML = `<button id="popupOkBtn" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">ok</button>`;
    messageButtonContainer.innerHTML = okButtonHTML;
    document.getElementById('popupOkBtn').addEventListener('click', () => {
        messageBox.classList.add('hidden');
    });
    messageBox.classList.remove('hidden');
}

function showConfirmation(message, onConfirm) {
    messageTextContainer.innerHTML = `<p class="text-xl font-semibold text-white">${message}</p>`;
    const buttonsHTML = `
        <div class="flex justify-center gap-4">
            <button id="confirmBtn" class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg">Confirm</button>
            <button id="cancelBtn" class="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">Cancel</button>
        </div>
    `;
    messageButtonContainer.innerHTML = buttonsHTML;
    document.getElementById('confirmBtn').addEventListener('click', () => {
        onConfirm();
        messageBox.classList.add('hidden');
    });
    document.getElementById('cancelBtn').addEventListener('click', () => {
        messageBox.classList.add('hidden');
    });
    messageBox.classList.remove('hidden');
}

function calculatePenalty(rawScore, totalCost) {
    if (totalCost <= MAX_COST) {
        return { basePenalty: 0, percentagePenaltyPoints: 0, finalScore: rawScore, penaltyPercent: 0 };
    }
    const basePenalty = 1000;
    const costOver = totalCost - MAX_COST;
    const percentPenaltyPerPoint = 0.0025;
    let totalPercentPenalty = costOver * percentPenaltyPerPoint;
    const cappedPercentPenalty = Math.min(totalPercentPenalty, 0.60);
    const percentagePenaltyPoints = rawScore * cappedPercentPenalty;
    const finalScore = rawScore - (basePenalty + percentagePenaltyPoints);
    return {
        basePenalty: basePenalty,
        percentagePenaltyPoints: Math.round(percentagePenaltyPoints),
        finalScore: Math.round(finalScore),
        penaltyPercent: (cappedPercentPenalty * 100).toFixed(2)
    };
}

document.addEventListener('DOMContentLoaded', initGame);

resetButton.addEventListener('click', () => {
    showConfirmation('Are you sure you want to reset?', initGame);
});
undoButton.addEventListener('click', undoLastAction);

document.querySelector('a[href="./index.html"]').addEventListener('click', function(e) {
    e.preventDefault();
    window.location.href = this.href;
});

finalButton.addEventListener('click', () => {
    if (currentPhase !== GAME_PHASES.GAME_OVER) {
        currentPhase = GAME_PHASES.GAME_OVER;
        updateUI();
    } else {
        const rawBlueScore = parseInt(document.getElementById('blueScoreInput').value) || 0;
        const rawRedScore = parseInt(document.getElementById('redScoreInput').value) || 0;
        const blueCost = calculateTeamCost(blueTeamPicks);
        const redCost = calculateTeamCost(redTeamPicks);
        const blueResult = calculatePenalty(rawBlueScore, blueCost);
        const redResult = calculatePenalty(rawRedScore, redCost);
        const winner = blueResult.finalScore > redResult.finalScore ? 'Blue Team' : 'Red Team';
        const isTie = blueResult.finalScore === redResult.finalScore;

        const bluePenaltyText = blueResult.basePenalty > 0
            ? `<span>- ${blueResult.percentagePenaltyPoints.toLocaleString()} - 1,000</span>`
            : `<span>- 0</span>`;
        
        const redPenaltyText = redResult.basePenalty > 0
            ? `<span>- ${redResult.percentagePenaltyPoints.toLocaleString()} - 1,000</span>`
            : `<span>- 0</span>`;

        const resultHTML = `
            <div class="result-popup-content">
                <h3>${isTie ? 'Draw!' : `Winner : ${winner}!`}</h3>
                <div class="result-team-score ${winner === 'Blue Team' && !isTie ? 'winner' : ''}">
                    <p><strong>Blue Team</strong></p>
                    <p><span>score:</span> <span>${rawBlueScore.toLocaleString()}</span></p>
                    <p class="penalty"><span>Blue Team Cost Penalty (${blueResult.penaltyPercent}%):</span> ${bluePenaltyText}</p>
                    <p><span>Final score:</span> <span><strong>${blueResult.finalScore.toLocaleString()}</strong></span></p>
                </div>
                <div class="result-team-score ${winner === 'Red Team' && !isTie ? 'winner' : ''}">
                    <p><strong>Red Team</strong></p>
                    <p><span>score:</span> <span>${rawRedScore.toLocaleString()}</span></p>
                    <p class="penalty"><span>Red Team Cost Penalty(${redResult.penaltyPercent}%):</span> ${redPenaltyText}</p>
                    <p><span>Final Score:</span> <span><strong>${redResult.finalScore.toLocaleString()}</strong></span></p>
                </div>
            </div>`;
        showMessage(resultHTML);
    }
});
