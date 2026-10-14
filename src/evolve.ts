import type { Genome } from "./brain";
import {think, getInputs, randomGenome} from "./brain";
import { allDead, createWorld, step } from "./sim";

const MAX_FRAMES = 60 * 60;
const MUT_RATE = 0.1;
const MUT_SIZE = 0.5;
const ELITE = 5;

export function runGeneration(genoms: Genome[]):number[]{
    const world = createWorld(genoms.length);
    // Array of zeros
    const aliveFrames: number[] = new Array(world.birds.length).fill(0);

    let frame = 0;
    while (!allDead(world) && frame < MAX_FRAMES){

        const flaps: boolean[] = [];
        for(let k = 0; k < world.birds.length; k++) {
            const b = world.birds[k];
            flaps[k] = b.alive && think(genoms[k], getInputs(world, b)) > 0.5;
            if(b.alive) aliveFrames[k] += 1;
        }

        step(world, 1 / 60, flaps);

        frame++;
    }

    const fitness: number[] = [];
    for(let k = 0; k < world.birds.length; k++){
        fitness.push(aliveFrames[k] + 1000 * world.birds[k].score);
    }

    return fitness;
}

export function crossOver(a: Genome, b: Genome): Genome {
    return a.map((v, i) => Math.random() < 0.5 ? v : b[i]);
}

export function mutate(g: Genome): Genome{
    return g.map((v) => Math.random() < MUT_RATE ? v + ((Math.random() * 2 - 1) * MUT_SIZE) : v);
}

export function pick(genoms: Genome[], fit: number[]): Genome {
    let bestIndex = Math.floor(Math.random() * genoms.length);

    for(let i = 0; i < 3; i++){
        const randomIndex = Math.floor(Math.random() * genoms.length)
        if(fit[randomIndex] > fit[bestIndex]) {
            bestIndex = randomIndex;
        }
    }

    return genoms[bestIndex];
}

export function nextGeneration(genomes: Genome[], fit: number[]): Genome[]{
    const order = genomes.map((_, i) => i).sort((a, b) => fit[b] - fit[a]);
    const next: Genome[] = [];

    // a) ELITE: for rank 0..ELITE-1, push a COPY of genomes[order[rank]]
    for(let rank = 0; rank < ELITE; rank++){
        next.push([...genomes[order[rank]]])
    }

    // b) until next.length === genomes.length: push a mutated crossOver of two picks
    while(next.length < genomes.length) {
        const mum = pick(genomes, fit);
        const dad = pick(genomes, fit);

        next.push(mutate(crossOver(mum, dad)));
    }

    return next;
}

// Runs only for `bun src/evolve.ts`, not when another file imports this one.
if(import.meta.main) {
    let genomes = Array.from({length: 100}, () => randomGenome())

    let bestEver = -1;
    let bestGenome: Genome = []

    for(let gen = 0; gen < 150; gen++){
        const fit = runGeneration(genomes);
        const bestFit = Math.max(...fit);
        console.log(`gen ${gen}: best ${bestFit} (${Math.floor(bestFit / 1000)} pipes)`);

        if(bestFit > bestEver) {
            bestEver = bestFit;
            bestGenome = genomes[fit.indexOf(bestFit)];
        }

        genomes = nextGeneration(genomes, fit);
    }

    await Bun.write("best-brain.json", JSON.stringify(bestGenome));
    console.log(`saved best brain. fitness`, bestEver);

    // const genomes = Array.from({length: 100}, () => randomGenome());
    // const fitness = runGeneration(genomes);
    // console.log("best fitness:", Math.max(...fitness));

    // // --- crossover test ---
    // const testA = randomGenome();
    // const testB = randomGenome();
    // const copyA = [...testA], copyB = [...testB];
    // const child = crossOver(testA, testB);

    // let fromA = 0, fromB = 0, fromNeither = 0;
    // for (let i = 0; i < child.length; i++) {
    //     if (child[i] === testA[i]) fromA++;
    //     else if (child[i] === testB[i]) fromB++;
    //     else fromNeither++;
    // }
    // console.log("crossover: length", child.length,
    //     "| from A:", fromA, "| from B:", fromB, "| from neither:", fromNeither,
    //     "| parents unchanged:", testA.every((v, i) => v === copyA[i]) && testB.every((v, i) => v === copyB[i]));

    // // --- mutate test ---
    // const original = randomGenome();
    // const originalCopy = [...original];
    // const mutated = mutate(original);

    // let changed = 0, biggestNudge = 0;
    // for (let i = 0; i < mutated.length; i++) {
    //     const nudge = Math.abs(mutated[i] - original[i]);
    //     if (nudge > 0) changed++;
    //     biggestNudge = Math.max(biggestNudge, nudge);
    // }
    // console.log("mutate: length", mutated.length,
    //     "| changed:", changed, "of", mutated.length, `(~${Math.round(MUT_RATE * mutated.length)} expected)`,
    //     "| biggest nudge:", biggestNudge.toFixed(3), `(max ${MUT_SIZE})`,
    //     "| original unchanged:", original.every((v, i) => v === originalCopy[i]));

    // // Mutation rate over many genomes, so the random noise averages out.
    // let totalChanged = 0, totalGenes = 0;
    // for (let n = 0; n < 1000; n++) {
    //     const g = randomGenome();
    //     const m = mutate(g);
    //     for (let i = 0; i < g.length; i++) if (m[i] !== g[i]) totalChanged++;
    //     totalGenes += g.length;
    // }
    // console.log("mutate over 1000 genomes:", (100 * totalChanged / totalGenes).toFixed(1) + "% changed", `(target ${MUT_RATE * 100}%)`);
}