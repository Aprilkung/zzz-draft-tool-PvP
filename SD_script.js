import {characters, weapons, GAME_PHASES } from './Data.js';

const turnOrder = [
    { team: 'blue', type: 'ban', slot: 0 },
    { team: 'red', type: 'ban', slot: 0 },
    { team: 'blue', type: 'pick', slot: 0 },
    { team: 'red', type: 'pick', slot: 0 },
    { team: 'red', type: 'pick', slot: 1 },
    { team: 'blue', type: 'pick', slot: 1 },
    { team: 'blue', type: 'ban', slot: 1 },
    { team: 'red', type: 'ban', slot: 1 },
    { team: 'red', type: 'pick', slot: 2 },
    { team: 'blue', type: 'pick', slot: 2 },
    { team: 'blue', type: 'pick', slot: 3 },
    { team: 'red', type: 'pick', slot: 3 },
    { team: 'blue', type: 'pick', slot: 4 },
    { team: 'red', type: 'pick', slot: 4 },
    { team: 'red', type: 'pick', slot: 5 },
    { team: 'blue', type: 'pick', slot: 5 },
];

const COST_THRESHOLD = 600;

let gamePhase = GAME_PHASES.MAIN;

let gameState = {
    blue: {
        picks: Array(6).fill(null).map(() => ({ charId: null, mValue: 0, weaponId: null })),
        bans: Array(2).fill(null),
        totalCost: 0,
    },
    red: {
        picks: Array(6).fill(null).map(() => ({ charId: null, mValue: 0, weaponId: null })),
        bans: Array(2).fill(null),
        totalCost: 0,
    },
    history: [],
    currentStep: 0,
    matchResult: {
        blueTimeSeconds: 0,
        redTimeSeconds: 0,
        finalBlueTime: 0,
        finalRedTime: 0,
        winner: null,
        timePenaltyBlue: 0,
        timePenaltyRed: 0
    }
};



// DOM Elements
const charGrid = document.getElementById('char-grid');
const turnInfo = document.getElementById('turn-info');
const blueTeamCostDisplay = document.getElementById('blue-cost');
const redTeamCostDisplay = document.getElementById('red-cost');

// Message Box Elements
const messageBoxOverlay = document.getElementById('message-box-overlay');
const messageBoxText = document.getElementById('message-box-text');
const messageBoxOkBtn = document.getElementById('message-box-ok-btn');
const messageBoxCancelBtn = document.getElementById('message-box-cancel-btn');

// --- Core Logic ---

function showMessage(message) {
    messageBoxText.innerHTML = message;
    messageBoxOkBtn.classList.remove("hidden");
    messageBoxCancelBtn.classList.add("hidden");
    messageBoxOverlay.classList.add("visible");
}

function showConfirm(message) {
    return new Promise((resolve) => {
        messageBoxText.innerHTML = message;
        messageBoxOkBtn.classList.remove("hidden");
        messageBoxCancelBtn.classList.remove("hidden");

        const handleOk = () => {
            messageBoxOverlay.classList.remove("visible");
            messageBoxOkBtn.removeEventListener('click', handleOk);
            messageBoxCancelBtn.removeEventListener('click', handleCancel);
            resolve(true);
        };

        const handleCancel = () => {
            messageBoxOverlay.classList.remove("visible");
            messageBoxOkBtn.removeEventListener('click', handleOk);
            messageBoxCancelBtn.removeEventListener('click', handleCancel);
            resolve(false);
        };

        messageBoxOkBtn.addEventListener('click', handleOk);
        messageBoxCancelBtn.addEventListener('click', handleCancel);
        messageBoxOverlay.classList.add("visible");
    });
}

function renderCharacters() {
    charGrid.innerHTML = '';
    characters.forEach(char => {
        const button = document.createElement('button');
        button.innerHTML = `<img src="${char.img}" alt="${char.name}"><span>${char.name}</span>`;
        button.dataset.charId = char.id;

        const isBanned = gameState.blue.bans.includes(char.id) || gameState.red.bans.includes(char.id);
        // const isPicked = gameState.blue.picks.some(p => p.charId === char.id) || gameState.red.picks.some(p => p.charId === char.id); // บรรทัดนี้ไม่ได้ใช้งานโดยตรงในการ disable ปุ่มในตอนนี้

        if (isBanned) {
            button.classList.add('disabled');
            button.disabled = true;
        }

        button.addEventListener('click', () => handleCharSelection(char.id));
        charGrid.appendChild(button);
    });
}

function handleCharSelection(charId) {
    if (gamePhase !== GAME_PHASES.MAIN) return;

    if (gameState.currentStep >= turnOrder.length) {
        showMessage("เกมจบแล้ว คุณสามารถดูผลผู้ชนะได้");
        return;
    }

    const currentTurn = turnOrder[gameState.currentStep];
    const targetTeam = gameState[currentTurn.team];

    // ตรวจสอบว่าตัวละครถูกแบน/เลือกไปแล้วหรือไม่ก่อนทำการเลือก
    // โค้ดส่วนนี้อาจต้องพิจารณาหากต้องการให้การเลือกตัวซ้ำได้ตามที่เขียนในกฎ
    // แต่สำหรับตอนนี้เราใช้ isBanned ใน renderCharacters() เพื่อจัดการการแสดงผล

    // Store the current state for undo (Deep copy)
    const previousState = JSON.parse(JSON.stringify(gameState)); 
    gameState.history.push(previousState);

    if (currentTurn.type === 'ban') {
        targetTeam.bans[currentTurn.slot] = charId;
    } else { // type === 'pick'
        targetTeam.picks[currentTurn.slot].charId = charId;
        const charData = characters.find(c => c.id === charId);
        if (charData && charData.mChoices && charData.mChoices.length > 0) {
            targetTeam.picks[currentTurn.slot].mValue = charData.mChoices[0]; // M0 cost
        } else {
            targetTeam.picks[currentTurn.slot].mValue = 0; // Fallback to 0
        }
        targetTeam.picks[currentTurn.slot].weaponId = null; // Reset weapon
    }

    gameState.currentStep++;
    updateUI();
}

function updateUI() {
    const currentTurn = turnOrder[gameState.currentStep];
    const turnInfoDiv = document.getElementById('turn-info');

    // Update turn info display
    if (currentTurn) {
        turnInfoDiv.textContent = `${currentTurn.team === 'blue' ? '🔵 Blue' : '🔴 Red'} Team Turn: ${currentTurn.type.charAt(0).toUpperCase() + currentTurn.type.slice(1)}`;
        turnInfoDiv.style.backgroundColor = currentTurn.team === 'blue' ? '#007bff' : '#dc3545'; // แก้ไขตรงนี้
        turnInfoDiv.classList.remove('hidden');
    } else {
        turnInfoDiv.textContent = 'การเลือกตัวละครเสร็จสิ้น';
        turnInfoDiv.style.backgroundColor = '#6c757d'; // แก้ไขตรงนี้
        turnInfoDiv.classList.remove('hidden');
    }

    renderCharacters();

    const blueCost = gameState.blue.totalCost;
    const redCost = gameState.red.totalCost;

    document.getElementById('blue-cost').textContent = `Cost: ${blueCost}/${COST_THRESHOLD}`;
    document.getElementById('red-cost').textContent = `Cost: ${redCost}/${COST_THRESHOLD}`;

    if (blueCost > COST_THRESHOLD) {
        document.getElementById('blue-cost').classList.add('cost-exceeded');
    } else {
        document.getElementById('blue-cost').classList.remove('cost-exceeded');
    }

    if (redCost > COST_THRESHOLD) {
        document.getElementById('red-cost').classList.add('cost-exceeded');
    } else {
        document.getElementById('red-cost').classList.remove('cost-exceeded');
    }

    document.querySelectorAll('.char-slot').forEach(slotElement => {
        slotElement.classList.remove('active-turn');

        const team = slotElement.dataset.team;
        const type = slotElement.dataset.type;
        const index = parseInt(slotElement.dataset.index); // แก้ไขตรงนี้

        let charIdToUpdate = null;
        let pickDataToUpdate = null;

        if (type === 'ban') {
            charIdToUpdate = gameState[team].bans[index];
            pickDataToUpdate = { charId: charIdToUpdate, mValue: null, weaponId: null };
        } else {
            pickDataToUpdate = gameState[team].picks[index];
            charIdToUpdate = pickDataToUpdate ? pickDataToUpdate.charId : null;
        }
        
        updateCharSlot(slotElement.id, pickDataToUpdate, type, team);
    });

    if (currentTurn) {
        const activeSlotId = `${currentTurn.team}-${currentTurn.type}-${currentTurn.slot + 1}`;
        const activeSlotElement = document.getElementById(activeSlotId);
        if (activeSlotElement) {
            activeSlotElement.classList.add('active-turn');
        }
    }

    if (gamePhase === GAME_PHASES.MAIN) {
        document.getElementById('main-game-phase').classList.remove('hidden');
        document.getElementById('result-phase').classList.add('hidden');
    } else if (gamePhase === GAME_PHASES.RESULT) {
        document.getElementById('main-game-phase').classList.add('hidden');
        document.getElementById('result-phase').classList.remove('hidden');
        document.getElementById('result-display').classList.add('hidden'); 
    }

    calculateAndDisplayCosts();
}

function updateCharSlot(slotId, pickOrBanData, type, teamName) {
    const slotElement = document.getElementById(slotId);
    if (!slotElement) return;

    slotElement.innerHTML = '';
    slotElement.classList.remove('has-char', 'banned-char', 'empty-slot-number');
    
    let charId = null;
    let pickData = null;

    if (type === 'ban') {
        charId = pickOrBanData.charId;
        if (charId) {
            slotElement.classList.add('banned-char');
        }
    } else {
        pickData = pickOrBanData;
        charId = pickData ? pickData.charId : null;
    }

    if (charId) {
        const char = characters.find(c => c.id === charId);
        if (char) {
            const img = document.createElement('img');
            img.src = char.img;
            img.alt = char.name;
            slotElement.appendChild(img);

            const nameSpan = document.createElement('span');
            nameSpan.textContent = char.name;
            slotElement.appendChild(nameSpan);

            slotElement.classList.add('has-char');

            const existingControls = slotElement.querySelector('.m-weapon-controls');
            if (existingControls) {
                existingControls.remove();
            }

            if (type === 'pick' && pickData) {
                const controlsDiv = document.createElement('div');
                controlsDiv.classList.add('m-weapon-controls');

                const mSelectContainer = document.createElement('div');
                mSelectContainer.classList.add('m-select-container');
                const mLabel = document.createElement('label');
                mLabel.textContent = 'M :';
                mSelectContainer.appendChild(mLabel);

                const mSelect = document.createElement('select');
                mSelect.innerHTML = `<option value="">M</option>`;

                for (let i = 0; i <= 6; i++) {
                    if (char.mChoices && char.mChoices.length > i) {
                        const option = document.createElement('option');
                        option.value = `M${i}`;
                        option.textContent = `M${i}`;
                        if (pickData.mValue === char.mChoices[i]) {
                            option.selected = true;
                        }
                        mSelect.appendChild(option);
                    } else if (i === 0) {
                        const option = document.createElement('option');
                        option.value = `M0`;
                        option.textContent = `M0`;
                        if (pickData.mValue === 0) {
                            option.selected = true;
                        }
                        mSelect.appendChild(option);
                    }
                }
                
                mSelect.addEventListener('change', (e) => {
                    const selectedMText = e.target.value;
                    const mIndex = parseInt(selectedMText.replace('M', ''));

                    const characterData = characters.find(c => c.id === pickData.charId);
                    if (characterData && characterData.mChoices && mIndex < characterData.mChoices.length) {
                        pickData.mValue = characterData.mChoices[mIndex];
                    } else {
                        pickData.mValue = 0;
                    }
                    calculateAndDisplayCosts();
                });
                mSelectContainer.appendChild(mSelect);
                controlsDiv.appendChild(mSelectContainer);

                const weaponSelectContainer = document.createElement('div');
                weaponSelectContainer.classList.add('weapon-select-container');
                const weaponLabel = document.createElement('label');
                weaponLabel.textContent = 'W :';
                weaponSelectContainer.appendChild(weaponLabel);

                const weaponInput = document.createElement('input');
                weaponInput.setAttribute('list', 'weapon-list');
                weaponInput.setAttribute('type', 'text');
                weaponInput.classList.add('weapon-search-input');
                weaponInput.value = pickData.weaponId || '';
                weaponSelectContainer.appendChild(weaponInput);

                const datalist = document.createElement('datalist');
                datalist.id = 'weapon-list';
                weapons.forEach(weapon => {
                    const option = document.createElement('option');
                    option.value = weapon.id;
                    option.textContent = weapon.name;
                    datalist.appendChild(option);
                });
                weaponSelectContainer.appendChild(datalist);

                weaponInput.addEventListener('change', (e) => {
                    const selectedWeaponId = e.target.value;
                    const weapon = weapons.find(w => w.id === selectedWeaponId);
                    if (weapon) {
                        pickData.weaponId = weapon.id;
                    } else {
                        pickData.weaponId = null;
                    }
                    calculateAndDisplayCosts();
                });
                controlsDiv.appendChild(weaponSelectContainer);
                slotElement.appendChild(controlsDiv);
            }
        }
    } else {
        const existingControls = slotElement.querySelector('.m-weapon-controls');
        if (existingControls) {
            existingControls.remove();
        }
        
        const team = slotElement.dataset.team;
        const type = slotElement.dataset.type;
        const index = parseInt(slotElement.dataset.index); // แก้ไขตรงนี้

        const currentSlotInTurnOrder = turnOrder.find(turn => 
            turn.team === team && 
            turn.type === type && 
            turn.slot === index
        );

        if (currentSlotInTurnOrder) {
            const displayOrder = turnOrder.indexOf(currentSlotInTurnOrder) + 1; // แก้ไขตรงนี้
            slotElement.textContent = displayOrder;
            slotElement.classList.add('empty-slot-number');
        }
    }
}

function calculateTeamCost(team) {
    let totalCost = 0;
    team.picks.forEach(pick => {
        if (pick.charId) {
            const charData = characters.find(c => c.id === pick.charId);
            if (charData) {
                totalCost += charData.baseCost;
                totalCost += pick.mValue;
            }

            if (pick.weaponId) {
                const weaponData = weapons.find(w => w.id === pick.weaponId);
                if (weaponData) {
                    const normalizedOwnerId = weaponData.ownerCharId ? weaponData.ownerCharId.toLowerCase() : '';
                    const normalizedPickCharId = pick.charId ? pick.charId.toLowerCase() : '';

                    if (normalizedOwnerId === normalizedPickCharId) {
                        totalCost += weaponData.costOwner;
                    } else {
                        totalCost += weaponData.costOther;
                    }
                }
            }
        }
    });
    return totalCost;
}

function calculateAndDisplayCosts() {
    gameState.blue.totalCost = calculateTeamCost(gameState.blue);
    gameState.red.totalCost = calculateTeamCost(gameState.red);

    blueTeamCostDisplay.textContent = `Cost: ${gameState.blue.totalCost}/${COST_THRESHOLD}`;
    redTeamCostDisplay.textContent = `Cost: ${gameState.red.totalCost}/${COST_THRESHOLD}`;

    if (gameState.blue.totalCost > COST_THRESHOLD) {
        blueTeamCostDisplay.classList.add('cost-exceeded');
    } else {
        blueTeamCostDisplay.classList.remove('cost-exceeded');
    }

    if (gameState.red.totalCost > COST_THRESHOLD) {
        redTeamCostDisplay.classList.add('cost-exceeded');
    } else {
        redTeamCostDisplay.classList.remove('cost-exceeded');
    }
}

async function undo() {
    if (gameState.history.length > 0) {
        const previousState = gameState.history.pop();
        gameState = previousState; 
        updateUI();
    } else {
        showMessage("cannot undo");
    }
}

async function reset() {
    const confirmed = await showConfirm("Are you sure to reset?");
    if (!confirmed) {
        return;
    }
    gameState.blue.picks = Array(6).fill(null).map(() => ({ charId: null, mValue: 0, weaponId: null }));
    gameState.blue.bans.fill(null);
    gameState.blue.totalCost = 0;

    gameState.red.picks = Array(6).fill(null).map(() => ({ charId: null, mValue: 0, weaponId: null }));
    gameState.red.bans.fill(null);
    gameState.red.totalCost = 0;

    gameState.history = [];
    gameState.currentStep = 0;
    gamePhase = GAME_PHASES.MAIN;

    gameState.matchResult = {
        blueTimeSeconds: 0,
        redTimeSeconds: 0,
        finalBlueTime: 0,
        finalRedTime: 0,
        winner: null,
        timePenaltyBlue: 0,
        timePenaltyRed: 0
    };

    document.getElementById('blue-time-seconds').value = 0;
    document.getElementById('red-time-seconds').value = 0;
    document.getElementById('result-display').classList.add('hidden');

    document.querySelectorAll('.char-slot').forEach(slotElement => {
        slotElement.innerHTML = '';
        slotElement.classList.remove('has-char', 'banned-char', 'active-turn');

        const team = slotElement.dataset.team;
        const type = slotElement.dataset.type;
        const index = parseInt(slotElement.dataset.index); // แก้ไขตรงนี้
        
        const currentSlotInTurnOrder = turnOrder.find(turn => 
            turn.team === team && 
            turn.type === type && 
            turn.slot === index
        );

        if (currentSlotInTurnOrder) {
            const displayOrder = turnOrder.indexOf(currentSlotInTurnOrder) + 1; // แก้ไขตรงนี้
            slotElement.textContent = displayOrder;
            slotElement.classList.add('empty-slot-number');
        } else {
            slotElement.classList.remove('empty-slot-number');
        }
    });

    updateUI();
}

function calculateResults() {
    let blueTimeSeconds = parseInt(document.getElementById('blue-time-seconds').value) || 0;
    let redTimeSeconds = parseInt(document.getElementById('red-time-seconds').value) || 0;

    let winnerText = '';
    let winner = null;

    let timePenaltyBlue = 0;

if (gameState.blue.totalCost > COST_THRESHOLD) {
    const excessCost = gameState.blue.totalCost - COST_THRESHOLD;
    timePenaltyBlue += 10; 
    const percentageIncrease = excessCost * 0.005; 
    timePenaltyBlue += (percentageIncrease * blueTimeSeconds);
}

let timePenaltyRed = 0; 
if (gameState.red.totalCost > COST_THRESHOLD) {
    const excessCost = gameState.red.totalCost - COST_THRESHOLD;
    timePenaltyRed += 10;
    const percentageIncrease = excessCost * 0.005;
    timePenaltyRed += (percentageIncrease * redTimeSeconds);
}

const finalBlueTime = blueTimeSeconds + timePenaltyBlue;
const finalRedTime = redTimeSeconds + timePenaltyRed;

    if (finalBlueTime < finalRedTime) {
        winnerText = `🏆 Blue Team Win!`;
        winner = 'blue';
    } else if (finalRedTime < finalBlueTime) {
        winnerText = `🏆 Red Team Win!`;
        winner = 'red';
    } else {
        winnerText = `เสมอ!`;
        winner = 'draw';
    }

    gameState.matchResult = {
        blueTimeSeconds: blueTimeSeconds,
        redTimeSeconds: redTimeSeconds,
        finalBlueTime,
        finalRedTime,
        winner: winner,
        timePenaltyBlue,
        timePenaltyRed
    };

    document.getElementById('winner-text').textContent = winnerText;
    document.getElementById('blue-penalty-text').textContent = `Blue Team Cost Penalty: +${timePenaltyBlue} second`;
    document.getElementById('red-penalty-text').textContent = `Red Team Cost Penalty: +${timePenaltyRed} second`;
    document.getElementById('final-blue-time-text').textContent = ` Total Time Blue Team use : ${finalBlueTime} second`;
    document.getElementById('final-red-time-text').textContent = `Total Time Red Team use: ${finalRedTime} second`;

    document.getElementById('result-display').classList.remove('hidden');
}


function setupControls() {
    document.getElementById('undo-btn').addEventListener('click', undo);
    document.getElementById('reset-btn').addEventListener('click', reset);
    document.getElementById('go-to-result-btn').addEventListener('click', () => {
        if (gameState.currentStep < turnOrder.length) {
            showMessage("Please draft all character in the boxes first");
            return;
        }
        gamePhase = GAME_PHASES.RESULT;
        updateUI();
    });
    document.getElementById('calculate-result-btn').addEventListener('click', calculateResults);
    document.getElementById('back-to-main-btn').addEventListener('click', () => {
        gamePhase = GAME_PHASES.MAIN;
        updateUI();
    });
    document.getElementById('reset-game-from-result-btn').addEventListener('click', reset);

    messageBoxOkBtn.addEventListener('click', () => {
        messageBoxOverlay.classList.remove("visible");
    });
}

document.addEventListener('DOMContentLoaded', () => {
    setupControls();
    updateUI();
});