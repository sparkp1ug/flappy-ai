export const WIDTH = 800, HEIGHT = 600;

export const BIRD_SIZE = 30;
export const START_X = WIDTH / 2 - BIRD_SIZE / 2;
export const PIXELS_PER_METER = BIRD_SIZE / 0.3; // 100 pixels = 1 meter
export const GRAVITY = 9.81 * PIXELS_PER_METER; // pixels per second squared
export const FLAP_SPEED = -350;
export const PIPE_WIDTH = 70, PIPE_GAP = 150, PIPE_SPEED = 260;
export const PIPE_INTERVAL = 1.3;
export const MAX_GAP_SHIFT = 150; // max vertical move of a gap vs the previous one, keeps every course fair

export type Bird = {y : number, velY: number, alive: boolean, score: number};
export type Pipe = { x: number, gapY: number, passed: boolean };
export type World = {birds: Bird[], pipes: Pipe[], spawnTimer: number, lastGapY: number};

function overlaps(ax:number, ay:number, aw:number, ah:number, bx:number, by:number, bw:number, bh:number): boolean {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

export function createWorld(numBirds: number): World {
    const birds = Array.from({length: numBirds}, () => ({y: HEIGHT / 2, velY: 0, alive: true, score: 0}));
    return {birds: birds, pipes: [], spawnTimer: 0, lastGapY: (HEIGHT - PIPE_GAP) / 2};
}

export function allDead(world: World): boolean {
    return world.birds.every(bird => !bird.alive);
}

export function step(w: World, dt: number, flaps: boolean[]): void {
    for (let i = 0; i < w.birds.length; i++) {
        const bird = w.birds[i];
        if (!bird.alive) continue;

        if (flaps[i]) {
            bird.velY = FLAP_SPEED;
        }

        bird.velY += GRAVITY * dt;
        bird.y += bird.velY * dt;

        if (bird.y > HEIGHT - BIRD_SIZE) {
            bird.y = HEIGHT - BIRD_SIZE;
            bird.velY = 0;
            bird.alive = false;
        }
        if (bird.y < 0) {
            bird.y = 0;
            bird.velY = 0;
            bird.alive = false;
        }
    }

    // Spawn pipes
    w.spawnTimer += dt;

    if (w.spawnTimer >= PIPE_INTERVAL) {
        w.spawnTimer -= PIPE_INTERVAL;
        // Move the gap at most MAX_GAP_SHIFT from the previous one, staying 50px from the edges.
        const last = w.pipes[w.pipes.length - 1];
        const prevGap = last ? last.gapY : (HEIGHT - PIPE_GAP) / 2;

        let gapY = prevGap + (Math.random() * 2 - 1) * MAX_GAP_SHIFT;

        const MIN = 50;
        const MAX = HEIGHT - PIPE_GAP - 50;

        gapY = Math.max(MIN, Math.min(MAX, gapY));

        w.pipes.push({x: WIDTH, gapY: gapY, passed: false});
    }

    for (const pipe of w.pipes) {
        pipe.x -= PIPE_SPEED * dt;
    }

    while (w.pipes.length > 0 && w.pipes[0].x + PIPE_WIDTH < 0) {
        w.pipes.shift();
    }

    for (const bird of w.birds) {
        if (!bird.alive) continue;

        for (const pipe of w.pipes) {
            if (overlaps(START_X, bird.y, BIRD_SIZE, BIRD_SIZE, pipe.x, 0, PIPE_WIDTH, pipe.gapY) ||
                overlaps(START_X, bird.y, BIRD_SIZE, BIRD_SIZE, pipe.x, pipe.gapY + PIPE_GAP, PIPE_WIDTH, HEIGHT - pipe.gapY - PIPE_GAP)) {
                bird.alive = false;
                break;
            }
        }
    }

    for (const pipe of w.pipes) {
        if (pipe.x + PIPE_WIDTH < START_X && !pipe.passed) {
            pipe.passed = true;
            for (const bird of w.birds) if (bird.alive) bird.score++;
        }
    }
}