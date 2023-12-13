class Predicate { /*
Predicate string template:
p <- [!]W{id}_P{pos}[_Q{state}]
c <- p & p & p ...
e <- c | c | c ...
p is expressed by: negation, id, position, state
c is expressed by: results of p (start and end index in array noninclusive)
e is expressed by: results of c (similarly)
*/
    constructor(exp) {
        this.empty = (exp === ""); 
        if (this.empty) return;

        this.exp = exp;
        this.pN = 0; this.cN = 1;
        for (let i = 0; i < exp.length; i++) {
            if (exp[i] === 'P') this.pN += 1;
            else if (exp[i] === '|') this.cN += 1;
        }

        // [negate id pos state ... negate id pos state start start/end ... start/end end]
        // array that stores predicate information with a space for its results
        this.storage = new Array(4*this.pN + this.cN + 1 + this.pN + this.cN);
        this.pInfo = this.storage.slice(0, 4*this.pN);
        this.cInfo = this.storage.slice(4*this.pN, 4*this.pN + this.cN + 1);
        this.pRes = this.storage.slice(4*this.pN + this.cN + 1, 4*this.pN + this.cN + 1 + this.pN);
        this.cRes = this.storage.slice(5*this.pN + this.cN + 1, 5*this.pN + 2*this.cN + 1)
        // finished preallocating memory and setting up views into memory

        // Parsing string
        let splitExp = exp.split('|');
        for (let i = 0; i < splitExp.length; i++) {
            splitExp[i] = splitExp[i].trim().split('&');
            for (let j = 0; j < splitExp[i].length; j++) {
                splitExp[i][j] = splitExp[i][j].trim().split('_');
            }
        }
        
        let psIn = 0; this.cInfo[0] = 0;
        for (let i = 0; i < splitExp.length; i++) {
            for (let j = 0; j < splitExp[i].length; j++) {
                let pred = splitExp[i][j];
                this.pInfo[4*psIn] = (pred[0][0] === '!'); 
                this.pInfo[4*psIn+1] = (pred[0][0] === '!') ? Number(pred[0].slice(2)) : Number(pred[0].slice(1));
                this.pInfo[4*psIn+2] = Number(pred[1].slice(1));
                this.pInfo[4*psIn+3] = (pred.length === 3) ? Number(pred[2].slice(1)) : false;
                psIn++;
            }
            this.cInfo[i+1] = psIn;
        }
    }

    eval(positions, states, currId) {
        if (this.empty) return true;

        let currPos = positions[currId];
        let targetId, targetPos, targetState;
        for (let i = 0; i < this.pN; i++) {
            targetId = this.pInfo[4*i+1];
            targetPos = positions[targetId];
            targetState = states[targetId];
            this.pRes[i] = ((targetPos - currPos) === this.pInfo[4*i+2]) && 
                (this.pInfo[4*i+3] === false ? true: targetState === this.pInfo[4*i+3]);
            this.pRes[i] = this.pInfo[4*i] ? !this.pRes[i]: this.pRes[i];
        }
        for (let i = 0; i < this.cN; i++) {
            this.cRes[i] = true;
            for (let j = this.cInfo[i]; j < this.cInfo[i+1]; j++) {
                this.cRes[i] = this.cRes[i] && this.pRes[j];
                if (!this.cRes[i]) break;
            }
        }
        let result = false;
        for (let i = 0; i < this.cN; i++) {
            result = result || this.cRes[i];
            if (!result) break;
        }
        return result;
    }
}
const emptyPredicate = new Predicate("");


function makeKey(freeLeft, freeRight, state) {
    return `${Math.abs(freeLeft)}_${Math.abs(freeRight)}_${Math.abs(state)}`;
}
function decodeKey(key) {
    key = key.split('_');
    return [Number(key[0]), Number(key[1]), Number(key[2])];
}
function prettifyKey(freeLeft, freeRight, state) {
    let sp = document.createElement("span");
    sp.appendChild(document.createTextNode(`Клеток свободно: ${freeLeft}<, ${freeRight}>`));
    sp.appendChild(document.createElement("br"));
    sp.appendChild(document.createTextNode(`Состояние: ${state}`));
    return sp;
}

class Automaton {
    constructor(id, radius = 1, velocity = 1, statesN = 1) {
        this.id = id;
        this.table = new Map();
        this.r = radius;
        this.v = velocity;
        this.statesN = statesN;
        this.state = 0;
    }
    addEntry(freeLeft, freeRight, fromState, predicate, toState, move) {
        let key = makeKey(freeLeft, freeRight, fromState);
        let pred = (predicate === false) ? emptyPredicate: new Predicate(predicate);
        
        if (this.table.has(key)) this.table.get(key).push(pred, toState, move);
        else                     this.table.set(key, [pred, toState, move]);
    }
}


class Environment {
    /**
    *    0 - line, 1 - ray
    */
    constructor(type) {
        this.type = type;
    }
    defaultPos() {
        return 0;
    }
    validPos(pos) {
        switch (this.type) {
            case 0: return true;
            case 1: return pos >= 0;
        }
    }
}

class Collective {
    constructor(env) {
        this.env = env;
        this.length = 0;
        this.automatons = [];
        this.positions = [];
    }
    addAutomaton(a, pos) {
        this.length += 1;
        this.automatons.push(a);
        this.positions.push(pos);
    }
    simulateStep() {
        let nextPositions = new Array(this.length);
        let nextStates = new Array(this.length);
        let currStates = new Array(this.length);
        for (let i = 0; i < this.length; i++) {
            currStates[i] = this.automatons[i].state;
        }

        for (let i = 0; i < this.length; i++) {
            let a = this.automatons[i];
            let key;
            if (this.env.type === 0)
                key = makeKey(a.r, a.r, a.state);
            else {
                key = makeKey(this.positions[i] > a.r ? a.r: this.positions[i], a.r, a.state);
            }
            if (!(a.table.has(key))) {
                return [false, `Нет подобного ключа: (${key}) для автомата ${i}`];
            }
        
            let rowsByKey = a.table.get(key);
            let matchFound = false;
            for (let j = 0; j < rowsByKey.length; j+=3) {
                let pred = rowsByKey[j];
                if (pred.eval(this.positions, currStates, i)) {
                    matchFound = true;
                    if ((this.env.type === 1) && (this.positions[i] + rowsByKey[j+2] < 0)) {
                        return [false, `Автомат ${i} хочет выйти за границы луча. Ключ: ${key}`];
                    }
                    nextStates[i] = (rowsByKey[j + 1]);
                    nextPositions[i] = (this.positions[i] + rowsByKey[j + 2]);
                    break;
                }
            }
            if (!matchFound) {
                return [false, `Ни один из условий не подошел для автомата ${i}. Ключ: ${key}`];
            }
        }
        for (let i = 0; i < this.length; i++) {
            this.automatons[i].state = nextStates[i];
            this.positions[i] = nextPositions[i];
        }
        return [true, true];
    }
}


class CollectiveSimulationHistory {
    constructor(c) {
        this.jsonDict = false;
        this.length = c.length;
        this.collective = c;
        this.currentTick = 0;
        this.simulatedTicks = 0;
        this.positionsHistory = new Array();
        this.statesHistory = new Array();
        this.positions = new Int32Array(this.length);
        for (let i = 0; i < this.length; i++) {
            this.positionsHistory.push(c.positions[i]);
            this.statesHistory.push(c.automatons[i].state);
            this.positions[i] = c.positions[i];
        }
    }
    addedAuto() {
        this.length += 1;
        this.currentTick = 0;
        this.simulatedTicks = 0;
        this.positionsHistory = new Array();
        this.statesHistory = new Array();
        this.positions = new Int32Array(this.length);
        for (let i = 0; i < this.length; i++) {
            this.positionsHistory.push(this.collective.positions[i]);
            this.statesHistory.push(this.collective.automatons[i].state);
            this.positions[i] = this.collective.positions[i];
        }
    }
    simulationForward() {
        this.currentTick += 1;
        if (this.currentTick > this.simulatedTicks) {
            for (let i = 0; i < 10; i++) {
                let [success, msg] = this.collective.simulateStep();
                if (!success) {
                    window.alert(msg);
                    this.simulatedTicks += i;
                    return;
                }
                for (let j = 0; j < this.length; j++) {
                    this.positionsHistory.push(this.collective.positions[j]);
                    this.statesHistory.push(this.collective.automatons[j].state);
                }
            }
            this.simulatedTicks += 10;
        }
        for (let i = 0; i < this.length; i++) {
            this.positions[i] = this.positionsHistory[this.currentTick*this.length+i];
        }

        clearStateViewTable();
        populateStateViewTable();
    }
    simulationBackward() {
        if (this.currentTick === 0) return
        this.currentTick -= 1;
        for (let i = 0; i < this.length; i++) {
            this.positions[i] = this.positionsHistory[this.currentTick*this.length+i];
        }

        clearStateViewTable();
        populateStateViewTable();
    }
}
