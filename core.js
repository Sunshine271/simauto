let addAutoBtn = document.querySelector("#coll_view_add_auto");
let delAutoBtn = document.querySelector("#coll_view_del_auto");
let addInstBtn = document.querySelector("#edit_add");
let instSelect = document.querySelector("#edit_inst_selector");
let delInstBtn = document.querySelector("#edit_del");
let autoToEdit = document.querySelector("#edit_list");
// dialogs
let dialChangeAutomaton = document.querySelector("#change_automaton");
let dialChangeAutoForm = document.querySelector("#change_automaton_form");
let dialChangeInstruction = document.querySelector("#change_instruction");
let dialChangeInstForm = document.querySelector("#change_instruction_form");


function makeCol(text) {
    let col = document.createElement("td"); 
    col.appendChild(document.createTextNode(text));
    return col;
}
function makeLabel(text, labelFor) {
    let label = document.createElement("label");
    label.for = labelFor;
    label.appendChild(document.createTextNode(text));
    return label;
}
function makeSelect(from, toIncl, defVal, name) {
    let sel = document.createElement("select");
    sel.name = name;
    for (let i = from; i <= toIncl; i++) {
        let opt = document.createElement("option");
        opt.value = i;
        opt.appendChild(document.createTextNode(i));
        sel.appendChild(opt);
    }
    sel.value = defVal;
    return sel;
}

function checkPred(p) {
    return true;
}

class MockAutomatonLine {
    constructor(id, autoId, r, v, statesN, toInitView = true) {
        // internal state
        this.id = id;
        this.autoId = autoId;
        this.r = r;
        this.v = v;
        this.statesN = statesN;

        this.left = r;
        this.right = r;
        this.state = 0;
        this.pred = "";
        this.nextState = 0;
        this.move = 0;
        
        //visual representation
        this.view = false; 
        if (toInitView) this.viewInit();
    }

    viewInit() {
        this.view = document.createElement("tr");
        this.view.appendChild(makeCol(this.id));

        let col = document.createElement("td");
        col.appendChild(prettifyKey(this.left, this.right, this.state));
        this.view.appendChild(col);

        let predCol = document.createElement("textarea");
        predCol.cols = 36; predCol.rows = 3;
        predCol.value = this.pred; predCol.style.resize = "none";
        predCol.toggleAttribute("readonly");
        col = document.createElement("td");
        col.appendChild(predCol); this.view.appendChild(col);
        
        this.view.appendChild(makeCol(this.nextState));
        this.view.appendChild(makeCol(this.move));

        let editBtn = document.createElement("button");
        editBtn.appendChild(document.createTextNode("Изменить"));
        col = document.createElement("td");
        col.appendChild(editBtn); this.view.appendChild(col);
        let currLine = this;
        editBtn.addEventListener("click", function( e ) {
            currLine.editDialogInit();
            dialChangeInstruction.showModal();
            dialChangeInstruction.style.top = Math.floor(e.pageY - (dialChangeInstruction.offsetHeight /2))+"px";
            dialChangeInstruction.style.left = Math.floor(e.pageX - dialChangeInstruction.offsetWidth)+"px";
        })
    }

    editDialogInit() {
        let currLine = this;
        document.querySelector("#auto_id").value = this.autoId;

        let leftSelect = makeSelect(0, this.r, this.left, "left_select");
        leftSelect.id = "left_select";
        document.querySelector("#left_span").appendChild(leftSelect);
        
        let rightSelect = makeSelect(0, this.r, this.right, "right_select");
        rightSelect.id = "right_select";
        document.querySelector("#right_span").appendChild(rightSelect);

        let stateSelect = makeSelect(0, this.statesN - 1, this.state, "state_select");
        stateSelect.id = "state_select";
        document.querySelector("#state_span").appendChild(stateSelect);

        let pred = document.createElement("textarea");
        pred.id = "pred_textarea"; pred.value = this.pred;
        pred.cols = 36; pred.rows = 3; pred.style.resize = "none";
        document.querySelector("#pred_div").appendChild(pred);

        let nextStateSelect = makeSelect(0, this.statesN - 1, this.nextState, "next_state_select");
        nextStateSelect.id = "next_state_select";
        document.querySelector("#next_state_span").appendChild(nextStateSelect);

        let moveSelect = makeSelect(-this.v, this.v, this.move, "move_select");
        moveSelect.id = "move_select";
        document.querySelector("#move_span").appendChild(moveSelect);

        let closeBtn = document.createElement("input");
        closeBtn.type = "button";
        closeBtn.value = "Сохранить и закрыть";
        closeBtn.id = "change_inst_close";
        dialChangeInstForm.appendChild(closeBtn);
        closeBtn.addEventListener("click", function() {
            currLine.left = Number(leftSelect.value);
            currLine.right = Number(rightSelect.value);
            currLine.state = Number(stateSelect.value);
            currLine.nextState = Number(nextStateSelect.value);
            currLine.move = Number(moveSelect.value);

            if (checkPred(pred.value)) {
                currLine.pred = pred.value;
            } else {
                alert("Условие неправильно задано.")
            }

            leftSelect.remove();
            rightSelect.remove();
            stateSelect.remove();
            pred.remove();
            nextStateSelect.remove();
            moveSelect.remove();
            closeBtn.remove();

            currLine.viewInit();
            mam.renderEdit();
            dialChangeInstruction.close();
        })
    }
}

class MockAutomaton {
    constructor(id, env, toInitView = true) {
        // internal state
        this.id = id;
        this.pos = env.defaultPos();
        this.states = 1;
        this.r = 1;
        this.v = 1;
        this.lines = [ new MockAutomatonLine(0, this.id, this.r, this.v, this.states) ];

        // visual representation
        this.view = false; 
        if (toInitView) this.viewInit();
    }

    viewInit() {
        this.view = document.createElement("tr");
        this.view.appendChild(makeCol(this.id));
        this.view.appendChild(makeCol(this.pos));
        this.view.appendChild(makeCol(this.states));
        this.view.appendChild(makeCol(this.r));
        this.view.appendChild(makeCol(this.v));

        let editBtn = document.createElement("button");
        editBtn.appendChild(document.createTextNode("Изменить"));
        let col = document.createElement("td");
        col.appendChild(editBtn); this.view.appendChild(col);
        let currAuto = this;
        editBtn.addEventListener("click", function( e ) {
            currAuto.editDialogInit();
            dialChangeAutomaton.showModal();
            dialChangeAutomaton.style.top = Math.floor(e.pageY - (dialChangeAutomaton.offsetHeight / 2))+"px";
            dialChangeAutomaton.style.left = Math.floor(e.pageX - (dialChangeAutomaton.offsetWidth / 2))+"px";
        })
    }

    editDialogInit() {
        let startPos = document.createElement("input");
        startPos.type = "number"; startPos.value = this.pos;
        startPos.name = "pos_input"; startPos.id = "pos_input";
        document.querySelector("#pos_span").appendChild(startPos);

        let statesNInput = document.createElement("input");
        statesNInput.type = "number"; statesNInput.value = this.states;
        statesNInput.name = "states_n_input"; statesNInput.id = "states_n_input"; 
        document.querySelector("#states_n_span").appendChild(statesNInput);

        let rInput = document.createElement("input");
        rInput.type = "number"; rInput.value = this.r;
        rInput.name = "r_input"; rInput.id = "r_input";
        document.querySelector("#r_span").appendChild(rInput);
        
        let vInput = document.createElement("input");
        vInput.type = "number"; vInput.value = this.v;
        vInput.name = "v_input"; vInput.id = "v_input";
        document.querySelector("#v_span").appendChild(vInput);

        let closeBtn = document.createElement("input");
        closeBtn.type = "button";
        closeBtn.value = "Сохранить и закрыть";
        closeBtn.id = "change_auto_close";
        dialChangeAutoForm.appendChild(closeBtn);
        let currAuto = this;
        closeBtn.addEventListener("click", function() {
            let posIn = Number(startPos.value);
            let stNIn = Number(statesNInput.value);
            let rIn = Number(rInput.value);
            let vIn = Number(vInput.value);

            if (!(isNaN(posIn) || isNaN(stNIn) || isNaN(rIn) || isNaN(vIn)) &&
                currEnv.validPos(posIn) && (stNIn >= currAuto.states) && 
                (rIn >= currAuto.r) && (vIn >= currAuto.v)
            ) {
                currAuto.pos = posIn;
                currAuto.states = stNIn;
                currAuto.r = rIn;
                currAuto.v = vIn;

                let lines = currAuto.lines;
                let linesLen = lines.length;
                for (let i = 0; i < linesLen; i++) {
                    lines[i].r = rIn;
                    lines[i].v = vIn;
                    lines[i].statesN = stNIn;
                    lines[i].viewInit();
                }
            } else {
                let line1 = "Неправильно введены данные:\n";
                let line2 = "1) Вводить можно только цифры\n";
                let line3 = "2) Начальное положение должно быть в допустимых пределах\n";
                let line4 = "3) Кол-во состояний, радиус обзора и скорость перемещения можно менять только в большую сторону";
                alert(line1+line2+line3+line4);
            }

            startPos.remove();
            statesNInput.remove();
            rInput.remove();
            vInput.remove();
            closeBtn.remove();

            currAuto.viewInit();
            mam.renderColl();
            if (mam.currAuto === currAuto.id) mam.renderEdit();
            dialChangeAutomaton.close();
        })
    }
}

class MockAutomatonsManager {
    constructor(env, toInitView = true) {
        this.env = env; 
        this.autos = [ new MockAutomaton(0, this.env) ];
        this.currAuto = 0;
    
        this.collT = document.querySelector("#coll_view");
        this.collTbody = false;
        this.editT = document.querySelector("#edit_table");
        this.editTbody = false;
        
        this.instSelector = false;
        this.autoToEdit = false;
    
        if (toInitView) {
            this.renderColl();
            this.renderEdit();
        }
    }
    removeSelf() {
        this.instSelector.remove();
        this.autoToEdit.remove();
        this.collTbody.remove();
        this.editTbody.remove();
    }
    renderColl() {
        if (this.collTbody !== false) this.collTbody.remove();
        this.collTbody = document.createElement("tbody");
        for (let i = 0; i < this.autos.length; i++) {
            this.collTbody.appendChild(this.autos[i].view);
        }
        this.collT.appendChild(this.collTbody);

        if (this.autoToEdit !== false) this.autoToEdit.remove();
        this.autoToEdit = document.createElement("select");
        this.autoToEdit.name = "edit_list";
        for (let i = 0; i < this.autos.length; i++) {
            let opt = document.createElement("option");
            opt.value = i;
            opt.appendChild(document.createTextNode(i));
            this.autoToEdit.appendChild(opt);
        }
        this.autoToEdit.value = this.currAuto;
        autoToEdit.appendChild(this.autoToEdit);
    }
    renderEdit() {
        let id = this.currAuto;

        if (this.editTbody !== false) this.editTbody.remove();
        this.editTbody = document.createElement("tbody");
        if (this.autos.length > id)
        for(let i = 0; i < this.autos[id].lines.length; i++) {
            this.editTbody.appendChild(this.autos[id].lines[i].view);
        }
        this.editT.appendChild(this.editTbody);

        if (this.instSelector !== false) this.instSelector.remove();
        this.instSelector = document.createElement("select");
        this.instSelector.name = "inst_selector";
        if (this.autos.length > id)
        for (let i = 0; i < this.autos[id].lines.length; i++) {
            let opt = document.createElement("option");
            opt.value = i;
            opt.appendChild(document.createTextNode(i));
            this.instSelector.appendChild(opt);
        }
        instSelect.append(this.instSelector);
    }
    addAuto() {
        this.autos.push(new MockAutomaton(this.autos.length, this.env));
        if (this.autos.length - 1 === this.currAuto) this.renderEdit();
        this.renderColl();
    }
    addLine() {
        let auto = this.autos[this.currAuto];
        auto.lines.push(new MockAutomatonLine(auto.lines.length, auto.id, auto.r, auto.v, auto.states));
        this.renderEdit();
    }
}

let currEnv = new Environment(0);
let mam = new MockAutomatonsManager(currEnv);


autoToEdit.addEventListener("change", function() {
    let autoId = Number(mam.autoToEdit.value);
    mam.currAuto = autoId;
    mam.renderEdit();
})

addAutoBtn.addEventListener("click", function() { mam.addAuto(); });
delAutoBtn.addEventListener("click", function() {
    let lastI = mam.autos.length - 1;
    if (mam.currAuto === lastI) mam.currAuto = 0;
    mam.autos.splice(lastI, 1);
    mam.renderColl();
    mam.renderEdit();
});

addInstBtn.addEventListener("click", function() { mam.addLine(); });
delInstBtn.addEventListener("click", function() {
    let id = Number(mam.instSelector.value);
    let lines = mam.autos[mam.currAuto].lines;
    lines.splice(id, 1);
    let len = lines.length;
    for (let i = 0; i < len; i++) {
        lines[i].id = i;
        lines[i].viewInit();
    }
    mam.renderEdit();
});

dialChangeInstruction.addEventListener("cancel", function() {
    document.querySelector("#left_select").remove();
    document.querySelector("#right_select").remove();
    document.querySelector("#state_select").remove();
    document.querySelector("#next_state_select").remove();
    document.querySelector("#move_select").remove();
    document.querySelector("#change_inst_close").remove();
    document.querySelector("#pred_textarea").remove();
});
dialChangeAutomaton.addEventListener("cancel", function() {
    document.querySelector("#pos_input").remove();
    document.querySelector("#states_n_input").remove();
    document.querySelector("#r_input").remove();
    document.querySelector("#v_input").remove();
    document.querySelector("#change_auto_close").remove();
})








let forwardButton = document.querySelector("#vis_forward");
let backwardButton = document.querySelector("#vis_backward");
forwardButton.addEventListener("click", simForward);
backwardButton.addEventListener("click", simBackward);

let history = false;

let stateViewHead = document.querySelector("#state_view_head");
let stateViewState = document.querySelector("#state_view_state");
let stateViewPos = document.querySelector("#state_view_pos");
let stateViewTable = document.querySelector("#state_view_table");
stateViewTable.style.display = "none";
stateViewPos.children[1].remove();

function clearStateViewTable() {
    for (let i = stateViewHead.children.length - 1; i >= 1; i--) {
        stateViewHead.children[i].remove();
        stateViewPos.children[i].remove();
        stateViewState.children[i].remove();
    }
}
function populateStateViewTable() {
    for (let i = 0; i < history.collective.automatons.length; i++) {
        let currAuto = history.collective.automatons[i];

        let headTh = document.createElement("th");
        headTh.appendChild(document.createTextNode(`W ${currAuto.id}`))
        stateViewHead.appendChild(headTh);
    
        let stateTd = document.createElement("td");
        let currState = history.statesHistory[history.length * history.currentTick + i];
        stateTd.appendChild(document.createTextNode(`${currState}`));
        stateViewState.appendChild(stateTd);

        let posTd = document.createElement("td");
        posTd.appendChild(document.createTextNode(`${history.positions[i]}`));
        stateViewPos.appendChild(posTd);

    }
}

let compileBtn = document.querySelector("#compile");

compileBtn.addEventListener("click", function() {
    document.querySelector("#vis_canvas_sect").style.display = "block";
    document.querySelector("#state_view_table").style.display = "block";
    document.querySelector("#vis_controls").style.display = "flex";
    document.querySelector("#vis_hr").style.display = "block";
    document.querySelector("#visualization_toggle").childNodes[0].data = "Убрать визуализацию";
    document.querySelector("#current_tick").value = "0";

    let envtype = Number(document.querySelector("#lab_type").value);
    let env = new Environment(envtype);
    let coll = new Collective(env);
    
    for (let i = 0; i < mam.autos.length; i++) {
        let mamAuto = mam.autos[i];
        let tempAuto = new Automaton(mamAuto.id, mamAuto.r, mamAuto.v, mamAuto.states);
        for (let j = 0; j < mamAuto.lines.length; j++) {
            let currLine = mamAuto.lines[j];
            let predicate = currLine.pred === "" ? false: currLine.pred;
            tempAuto.addEntry(currLine.left, currLine.right, currLine.state, predicate, currLine.nextState, currLine.move);
        }
        coll.addAutomaton(tempAuto, mamAuto.pos);
    }
    
    history = new CollectiveSimulationHistory(coll);
    history.jsonDict = makeCollDict();
    
    stateViewTable.style.display = "block";
    clearStateViewTable();
    populateStateViewTable();
    drawCells();
});



function makeCollDict() {
    let saveDict = {
        "env_type": mam.env.type,
        "autos_length": mam.autos.length,
    }
    for (let i = 0; i < mam.autos.length; i++) {
        let auto = mam.autos[i];
        saveDict[`autos_${i}`] = {
            "id": auto.id, 
            "pos": auto.pos, 
            "states": auto.states, 
            "r": auto.r, 
            "v": auto.v, 
            "lines_length": auto.lines.length
        }
        for (let j = 0; j < auto.lines.length; j++) {
            let line = auto.lines[j];
            saveDict[`autos_${i}_line_${j}`] = {
                "id": line.id,
                "autoId": line.autoId,
                "r": line.r,
                "v": line.v,
                "statesN": line.statesN,
                "left": line.left,
                "right": line.right,
                "state": line.state,
                "pred": line.pred,
                "nextState": line.nextState,
                "move": line.move
            }
        }
    }
    return saveDict;
}
document.querySelector("#save").addEventListener("click", function() {
    if (history === false) {
        alert("Для сохранения коллектива, необходимо сначала запустить симуляцию");
        return;
    }

    let saveDict = history.jsonDict;
    saveDict["simulatedTicks"] = history.simulatedTicks+1;
    saveDict["positionsHistory"] = history.positionsHistory;
    saveDict["statesHistory"] = history.statesHistory;

    let d = document.querySelector("#save_dialogue");
    for (let i = d.children.length - 1; i >= 0; i -= 1) {
        d.children[i].remove();
    }
    let p = document.createElement("p");
    p.append(document.createTextNode(JSON.stringify(saveDict)));
    d.append(p);

    let closeBtn = document.createElement("button");
    closeBtn.addEventListener("click", function() {
        d.close();
    })
    closeBtn.append(document.createTextNode("Закрыть"));

    d.append(closeBtn);
    d.showModal();
});
document.querySelector("#load").addEventListener("click", function() {
    let textArea = document.createElement("textarea");
    textArea.rows = 10;
    textArea.cols = 100;
    textArea.id = "load_data";
    
    let d = document.querySelector("#load_dialogue");
    for (let i = d.children.length - 1; i >= 0; i -= 1) {
        d.children[i].remove();
    }
    let head = document.createElement("h3");
    head.append(document.createTextNode("Вставьте текст сохранения:"));
    let closeBtn = document.createElement("button");
    closeBtn.addEventListener("click", function() {
        d.close();
    })
    closeBtn.append(document.createTextNode("Закрыть"));

    d.append(head);
    d.append(textArea);
    d.append(document.createElement("br"));
    d.append(closeBtn);
    d.showModal();
})

document.querySelector("#load_dialogue").addEventListener("close", function() { 
    let data = document.querySelector("#load_data").value;
    if (data === "") return;
    
    mam.removeSelf();

    data = JSON.parse(data);
    mam = new MockAutomatonsManager(new Environment(data.env_type), false);
    for (let i = 1; i < data.autos_length; i++) {
        mam.autos.push(new MockAutomaton(0, mam.env, false));
    }
    for (let i = 0; i < data.autos_length; i++) {
        let key = `autos_${i}`;
        let auto = mam.autos[i];
        auto.id = data[key].id;
        auto.pos = data[key].pos;
        auto.states = data[key].states;
        auto.r = data[key].r;
        auto.v = data[key].v;
        for (let j = 1; j < data[key].lines_length; j++) {
            auto.lines.push(new MockAutomatonLine(0, 0, 0, 0, 0, false));
        }
        for (let j = 0; j < data[key].lines_length; j++) {
            let lineKey = `autos_${i}_line_${j}`;
            let line = auto.lines[j];
            line.id = data[lineKey].id;
            line.autoId = data[lineKey].autoId;
            line.r = data[lineKey].r;
            line.v = data[lineKey].v;
            line.statesN = data[lineKey].statesN;
            line.left = data[lineKey].left;
            line.right = data[lineKey].right;
            line.state = data[lineKey].state;
            line.pred = data[lineKey].pred;
            line.nextState = data[lineKey].nextState;
            line.move = data[lineKey].move;
        }
    }

    for (let i = 0; i < mam.autos.length; i++) {
        for (let j = 0; j < mam.autos[i].lines.length; j++) {
            mam.autos[i].lines[j].viewInit();
        }
        mam.autos[i].viewInit();
    }
    for (let i = 0; i < mam.autos.length; i++) 
        mam.renderColl();
    mam.renderEdit();

    autoToEdit.children[1].value = "0";
});


document.querySelector("#lab_type").addEventListener("change", function() {
    let envtype = Number(document.querySelector("#lab_type").value);
    currEnv = new Environment(envtype);
})