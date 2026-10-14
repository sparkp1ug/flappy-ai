import {BIRD_SIZE, PIPE_GAP, PIPE_WIDTH, START_X, createWorld, allDead, step} from "./sim";
import {getInputs, think} from "./brain";
import bestbrain from "../best-brain.json";

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

let last = performance.now();
let world = createWorld(1);
let flapQueued = false;
let aiMode = false;


window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();

        if (allDead(world)) {
            world = createWorld(1);
        } else {
            flapQueued = true;
        }
    }
    if(e.code === 'KeyA') {
        aiMode = !aiMode;
    }
});

function render(){
    ctx.fillStyle = "skyblue";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "green";
    for (const pipe of world.pipes) {
        ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.gapY);
        ctx.fillRect(pipe.x, pipe.gapY + PIPE_GAP, PIPE_WIDTH, canvas.height - (pipe.gapY + PIPE_GAP));
    }

    ctx.fillStyle = "gold";
    for (const bird of world.birds) {
        ctx.fillRect(START_X, bird.y, BIRD_SIZE, BIRD_SIZE);
    }

    const bestScore = Math.max(...world.birds.map(b => b.score));

    ctx.save();
    ctx.fillStyle = "black";
    ctx.font = "48px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Best Score: " + bestScore, canvas.width / 2, 50);
    ctx.textAlign = "left";
    ctx.fillText(aiMode ? "AI" : "You", 50, 50)
    ctx.restore();

    if (allDead(world)) {
        ctx.save();
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.fillStyle = "black";
        ctx.font = "48px sans-serif";
        ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2);
        ctx.restore();
    }
}

function gameLoop(now: number) {
    const dt = Math.min((now - last) / 1000, 0.05); // Convert to seconds
    last = now;

    if(!allDead(world))
        step(world, dt, [aiMode ? think(bestbrain, getInputs(world, world.birds[0])) > 0.5 : flapQueued]);
    flapQueued = false;

    render();

    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);