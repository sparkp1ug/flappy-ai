import type {World, Bird} from "./sim";
import {PIPE_WIDTH, PIPE_GAP, START_X, HEIGHT, WIDTH, FLAP_SPEED} from "./sim";

export const IN = 5, HID = 6;

export const GENOME_SIZE = IN * HID + HID + HID + 1;

export type Genome = number[];

export function randomGenome(): Genome {
    return Array.from({length: GENOME_SIZE}, () => Math.random() * 2 - 1);
}

export function think(g:Genome, inputs: number[]): number {
    if (g.length !== GENOME_SIZE) throw new Error("Genome size mismatch");

    let i = 0;
    const hidden: number[] = [];
    for (let h = 0; h < HID; h++) {
        let sum = 0;
        for (let j = 0; j < IN; j++) {
            sum += inputs[j] * g[i++];
        }
        sum += g[i++]; // bias
        hidden.push(Math.tanh(sum));
    }

    let sum = 0;
    for (const h of hidden) sum += h * g[i++];
    sum += g[i++];

    if (i !== GENOME_SIZE) throw new Error("Genome size mismatch");

    return 1 / (1 + Math.exp(-sum)); // sigmoid
}

export function getInputs(w: World, b: Bird): number[] {
    // find the next pipe
    const nextPipe = w.pipes.find(p => p.x + PIPE_WIDTH > START_X);

    // bird height
    const birdHeight = b.y / HEIGHT;

    const birdVel = b.velY / -FLAP_SPEED; // normalize velocity

    if (!nextPipe) {
        const top = ((HEIGHT - PIPE_GAP) / 2)/HEIGHT;
        const bottom = top + PIPE_GAP/HEIGHT;
        // if no pipe is found, return default inputs
        return [birdHeight, birdVel, 1, top, bottom];
    }

    // distance to the next pipes right edge, divided by width
    const distToPipeRight = (nextPipe.x + PIPE_WIDTH - START_X) / WIDTH;

    // gap top and bottom, normalized by height
    const gapTop = nextPipe.gapY / HEIGHT;
    const gapBottom = (nextPipe.gapY + PIPE_GAP) / HEIGHT;

    return [birdHeight, birdVel, distToPipeRight, gapTop, gapBottom];
}