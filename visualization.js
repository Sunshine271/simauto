let pallete = [
    'hsl(0, 100%, 50%)', 'hsl(40, 100%, 50%)', 'hsl(80, 100%, 50%)',
    'hsl(120, 100%, 50%)', 'hsl(160, 100%, 50%)', 'hsl(200, 100%, 50%)',
    'hsl(240, 100%, 50%)', 'hsl(280, 100%, 50%)', 'hsl(320, 100%, 50%)'];
let visCanvas = document.querySelector("#vis_canvas");
let visCanvasCtx = visCanvas.getContext("2d");    
visCanvasCtx.strokeStyle = "black";
visCanvas.width = 1600;
visCanvas.height = 100;       

function findLimits() {
    let c = history;
    if (c.length <= 0) {
        console.log("Returning early from findLimits");
        return [0, 10];
    }

    let min = c.positions[0], min_id = 0;
    let max = c.positions[0], max_id = 0;
    for (let i = 0; i < c.length; i++) {
        if (c.positions[i] < min) {
            min = c.positions[i];
            min_id = i;
        }
        if (c.positions[i] > max) {
            max = c.positions[i];
            max_id = i;
        }
    }
    min = min - c.collective.automatons[min_id].r - 3;
    if (history.collective.env.type === 1) {
        if (min < 0) {
            max += Math.abs(min);
            min = 0;
        }
    }
    max = max + c.collective.automatons[max_id].r + 3;
    return [min, max];
}
function sortedPositions() {
    let positions = [];
    let c = history.collective;
    for (let i = 0; i < c.length; i++) {
        positions.push([history.positions[i], i]);
    }
    positions = positions.sort(function(a, b) { 
        return a[0] < b[0] ? -1: (a[0] > b[0] ? 1: 0);
    });
    let better_positions = [positions[0]];
    for (let i = 1; i < positions.length; i++) {
        if (positions[i][0] === better_positions.at(-1)[0]) {
            better_positions.at(-1).push(positions[i][1]);
        } else {
            better_positions.push(positions[i]);
        }
    }
    return better_positions
}
function drawAutos(leftLimit, rectSize, horOffset, verOffset) {
    let positions = sortedPositions();
    let counts = [];
    for (let i = 0; i < positions.length; i++) counts.push(positions[i].length - 1);
    let scalingFactors = [];
    for (let i = 0; i < counts.length; i++) {
        let x = 1;
        while((x*x) < counts[i]) x+=1;
        scalingFactors.push(x);
    }
    let rectOffset = Math.floor(rectSize * 0.1);
    for (let i = 0; i < positions.length; i++) {
        let pos = positions[i][0] - leftLimit;
        let thisSize = Math.floor((rectSize - 2*rectOffset) / scalingFactors[i]);
        for (let j = 0; j < counts[i]; j++) {
            let row = Math.floor(j / scalingFactors[i]);
            let col = j % scalingFactors[i];
            visCanvasCtx.fillStyle = pallete[positions[i][1+j] % pallete.length];
            let x = horOffset + pos * rectSize + col * thisSize + rectOffset;
            let y = verOffset + row * thisSize + rectOffset;
            visCanvasCtx.fillRect(x, y, thisSize, thisSize);
            let fontsize = Math.floor(thisSize * 0.75)
            visCanvasCtx.font = `bold ${fontsize}pt serif`;
            visCanvasCtx.fillStyle = pallete[(positions[i][1+j] + 5) % pallete.length]
            visCanvasCtx.fillText(`${positions[i][1+j]}`, x, y+fontsize, thisSize)
        }    
    }
}

function drawCells() {
    let c = history;
    visCanvasCtx.clearRect(0, 0, visCanvas.width, visCanvas.height);
    let limits = findLimits(c);
    let nCells = limits[1] - limits[0] + 1;
    let rect_height = Math.floor((visCanvas.height) * 0.9);
    let rect_width = Math.floor((visCanvas.width) / nCells);
    let rect_size = Math.min(rect_height, rect_width);
    let ver_offset = Math.floor((visCanvas.height - rect_size) * 0.5);
    let hor_offset = Math.floor((visCanvas.width - rect_size * nCells) * 0.5);
    for (let i = 0; i < nCells; i++) {
        visCanvasCtx.strokeRect(hor_offset+i*rect_size, ver_offset, rect_size, rect_size);
    }
    if (history.collective.env.type === 1) {
        visCanvasCtx.fillStyle="black";
        let leftX = hor_offset, leftCell = limits[0] - 1;
        while (leftX > 0 && leftCell > 0) {
            leftX -= rect_size;
            visCanvasCtx.strokeRect(leftX, ver_offset, rect_size, rect_size);
            leftCell -= 1;
        }
        if (leftX > 0)
            visCanvasCtx.fillRect(0, ver_offset, leftX, rect_size);
    } else {
        let leftX = hor_offset;
        visCanvasCtx.strokeStyle="black";
        while (leftX > 0) {
            leftX -= rect_size;
            visCanvasCtx.strokeRect(leftX, ver_offset, rect_size, rect_size);
        }
    }
    {
        let rightX = hor_offset + (nCells -1) * rect_size;
        while (rightX < visCanvas.width) {
            rightX += rect_size;
            visCanvasCtx.strokeRect(rightX, ver_offset, rect_size, rect_size);
        }
    }
    drawAutos(limits[0], rect_size, hor_offset, ver_offset);
}


let jumpLen = Number(document.querySelector("#jump_len").value);
document.querySelector("#jump_len").addEventListener("change", function() {
    jumpLen = Number(this.value);
})

let currentTick = document.querySelector("#current_tick");
function simForward() {
    for (let i = 0; i < jumpLen; i++) 
        history.simulationForward();
    currentTick.value = history.currentTick;
    drawCells();
}
function simBackward() {
    for (let i = 0; i < jumpLen; i++)
        history.simulationBackward();
    currentTick.value = history.currentTick;
    drawCells();
}


let play = false;
let speed = 1000, play_forward = true;

function change_speed(val) {
    switch(val) {
        case "1": speed = 1000; play_forward = true; break;
        case "2": speed = 500; play_forward = true; break;
        case "5": speed = 200; play_forward = true; break;
        case "10": speed = 100; play_forward = true; break;
        case "50": speed = 20; play_forward = true; break;
        case "-1": speed = 1000; play_forward = false; break;
        case "-2": speed = 500; play_forward = false; break;
        case "-5": speed = 200; play_forward = false; break;
        case "-10": speed = 100; play_forward = false; break;
        case "-50": speed = 20; play_forward = false; break;
        }
}

async function playVisualization() {
    change_speed(document.querySelector("#playback_speed").value);
    play = true;
    while (play) {
        await new Promise(resolve => {
            setTimeout(() => {
            resolve('resolved');
            }, speed);
        });
        if (play_forward) simForward();
        else simBackward();

        let same = true;
        for (let i = 0; i < history.length; i++) {
            let currPos = history.positionsHistory[history.currentTick * history.length + i];
            let prevPos = history.positionsHistory[(history.currentTick-1) * history.length + i];
            let currState = history.statesHistory[history.currentTick * history.length + i];
            let prevState = history.statesHistory[(history.currentTick-1) * history.length + i];
            if (currPos !== prevPos || currState !== prevState) {
                same = false;
                break;
            }
        }
        if (same) {
            document.querySelector("#play_pause").value = "Воспроизвести";
            play = false;
        }
    }
    return;
}
document.querySelector("#play_pause").addEventListener("click", function() {
    if (this.value === "Воспроизвести") {
        playVisualization();
        this.value = "Пауза";
    } else {
        this.value = "Воспроизвести";
        play = false;
    }
} );


document.querySelector("#instructions_toggle").addEventListener("click", function() {
    if (this.childNodes[0].data === "Убрать инструкцию") {
        document.querySelector("#instructions").style.display = "none";
        document.querySelector("#instructions_hr").style.display = "none";
        this.childNodes[0].data = "Открыть инструкцию";
    } else {
        document.querySelector("#instructions").style.display = "block";
        document.querySelector("#instructions_hr").style.display = "block";
        this.childNodes[0].data = "Убрать инструкцию";
    }
});

document.querySelector("#visualization_toggle").addEventListener("click", function() {
    if (this.childNodes[0].data === "Убрать визуализацию") {
        document.querySelector("#vis_canvas_sect").style.display = "none";
        document.querySelector("#state_view_table").style.display = "none";
        document.querySelector("#vis_controls").style.display = "none";
        document.querySelector("#vis_hr").style.display = "none";
        // ставим симуляцию на паузу
        document.querySelector("#play_pause").value = "Возобновить";
        play = false;
        this.childNodes[0].data = "Показать визуализацию";
    } else {
        document.querySelector("#vis_canvas_sect").style.display = "block";
        document.querySelector("#state_view_table").style.display = "block";
        document.querySelector("#vis_controls").style.display = "flex";
        document.querySelector("#vis_hr").style.display = "block";
        this.childNodes[0].data = "Убрать визуализацию";
    }
});