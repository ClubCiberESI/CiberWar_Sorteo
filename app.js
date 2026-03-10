// lógica principal de la aplicación de sorteo

const STORAGE_KEY = "participants";
let participants = [];

async function loadInitialData() {
    try {
        const resp = await fetch('/api/participants');
        if (resp.ok) {
            participants = await resp.json();
        } else {
            participants = [];
        }
    } catch (e) {
        console.error('error loading participants from server', e);
        participants = [];
    }
    renderParticipants();
    renderTeams();
}

async function save() {
    try {
        await fetch('/api/participants', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(participants, null, 2)
        });
    } catch (e) {
        console.error('error saving participants to server', e);
    }
}

function renderParticipants() {
    const list = document.getElementById('participant-list');
    list.innerHTML = '';
    participants.forEach((p, index) => {
        const li = document.createElement('li');
        li.textContent = p.name;
        // color according to team if assigned, else keep default
        if (p.team === 'red') {
            li.classList.add('team-red');
        } else if (p.team === 'blue') {
            li.classList.add('team-blue');
        }
        // keep in-raffle state for visual indicator but not color
        if (p.inRaffle && !p.team) {
            li.classList.add('in-raffle');
        }

        // two team assignment buttons
        const redBtn = document.createElement('button');
        redBtn.textContent = 'Red Team';
        redBtn.addEventListener('click', () => {
            p.team = 'red';
            p.manual = true;
            p.inRaffle = false;
            save();
            renderParticipants();
            renderTeams();
        });

        const blueBtn = document.createElement('button');
        blueBtn.textContent = 'Blue Team';
        blueBtn.addEventListener('click', () => {
            p.team = 'blue';
            p.manual = true;
            p.inRaffle = false;
            save();
            renderParticipants();
            renderTeams();
        });

        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'Remove';
        removeBtn.addEventListener('click', () => {
            participants.splice(index, 1);
            save();
            renderParticipants();
        });

        li.appendChild(redBtn);
        li.appendChild(blueBtn);
        li.appendChild(removeBtn);
        list.appendChild(li);
    });
}

function addParticipant(name) {
    // por defecto, se añade directamente al sorteo
    participants.push({ name, inRaffle: true, team: null });
    save();
    renderParticipants();
}


let isAnimating = false;

function assignTeamsRandom() {
    // si ya hay una animación en curso, ignorar
    if (isAnimating) return;
    const pool = participants.filter(p => p.inRaffle && !p.manual && !p.team);
    if (pool.length === 0) return;

    // extraer un participante al azar
    const idx = Math.floor(Math.random() * pool.length);
    const candidate = pool[idx];

    isAnimating = true;
    showFloatingName(candidate.name, team => {
        // asignación ponderada usando conteo de equipos previo al push
        candidate.team = team;
        candidate.manual = false; // no manual, es resultado de random
        candidate.inRaffle = false;
        save();
        renderParticipants();
        renderTeams();
        isAnimating = false;
    });
}

function chooseTeamWeighted() {
    const redCount = participants.filter(p => p.team === 'red').length;
    const blueCount = participants.filter(p => p.team === 'blue').length;
    // if no one assigned yet, toss a fair coin
    if (redCount + blueCount === 0) return Math.random() < 0.5 ? 'red' : 'blue';
    // enforce absolute balance: if one side already exceeds other by 1,
    // always assign to the smaller side
    if (redCount > blueCount + 1) return 'blue';
    if (blueCount > redCount + 1) return 'red';
    // otherwise use weighted probability favouring the smaller team
    const probRed = blueCount / (redCount + blueCount);
    return Math.random() < probRed ? 'red' : 'blue';
}

function showFloatingName(name, callback) {
    const overlay = document.createElement('div');
    overlay.className = 'floating';
    overlay.textContent = name;
    document.body.appendChild(overlay);

    setTimeout(() => {
        const team = chooseTeamWeighted();
        overlay.classList.add(team);
        overlay.classList.add(team === 'red' ? 'to-left' : 'to-right');
        overlay.addEventListener('transitionend', () => {
            overlay.remove();
            callback(team);
        });
    }, 3000);
}



function renderTeams() {
    const redUl = document.querySelector('#team-red ul');
    const blueUl = document.querySelector('#team-blue ul');
    redUl.innerHTML = '';
    blueUl.innerHTML = '';
    participants.forEach(p => {
        if (p.team === 'red') {
            const li = document.createElement('li');
            li.textContent = p.name;
            redUl.appendChild(li);
        } else if (p.team === 'blue') {
            const li = document.createElement('li');
            li.textContent = p.name;
            blueUl.appendChild(li);
        }
    });
}

function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}

// eventos

window.addEventListener('DOMContentLoaded', () => {
    loadInitialData();
    document.getElementById('add-participant-form').addEventListener('submit', e => {
        e.preventDefault();
        const nameInput = document.getElementById('participant-name');
        let name = nameInput.value.trim();
        if (name) {
            name = name.toUpperCase();
            addParticipant(name);
            nameInput.value = '';
        }
    });

    // make the VS badge clickable to randomize
    const vs = document.querySelector('.vs-badge');
    if (vs) {
        vs.addEventListener('click', assignTeamsRandom);
    }
});
