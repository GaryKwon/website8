import { clamp, fnv1a, mulberry32, pick, round } from './random.js';
const scales = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], pentatonic: [0, 2, 4, 7, 9], minorPentatonic: [0, 3, 5, 7, 10] };
const noteNames = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
const presets = {
    lofi: { range: [65, 95], scale: 'minor', swing: 0.12, progressions: [[0, 5, 3, 4], [0, 3, 5, 4], [0, 4, 5, 3]] },
    edm: { range: [115, 145], scale: 'minor', swing: 0, progressions: [[0, 5, 2, 6], [0, 3, 6, 4], [0, 4, 5, 3]] },
    ambient: { range: [50, 90], scale: 'major', swing: 0, progressions: [[0, 4, 5, 3], [0, 3, 1, 4], [5, 3, 0, 4]] },
    synthwave: { range: [85, 120], scale: 'minor', swing: 0.02, progressions: [[0, 5, 2, 6], [0, 3, 6, 4], [0, 4, 5, 3]] },
    chiptune: { range: [100, 160], scale: 'pentatonic', swing: 0, progressions: [[0, 4, 5, 3], [0, 3, 4, 4], [5, 3, 0, 4]] }
};
export const trackNames = { drums: 'Drum Machine', bass: 'Sub Bass', chords: 'Harmony Keys', melody: 'Lead Melody', arpeggio: 'Arpeggiator', pad: 'Atmosphere Pad' };
export const genreNames = { lofi: 'Lo-fi', edm: 'EDM', ambient: 'Ambient', synthwave: 'Synthwave', chiptune: 'Chiptune' };
const trackVolumes = { drums: .64, bass: .64, chords: .40, melody: .57, arpeggio: .34, pad: .29 };
const pans = { drums: 0, bass: 0, chords: -.14, melody: .08, arpeggio: .26, pad: -.25 };
const titles = ['Algorithmic Sunset', 'Parallel Dreams', 'Recursive Echoes', 'Binary Pulse', 'Infinite Branches', 'Midnight Compile', 'Nested Frequencies', 'Silent Syntax', 'Neon Functions', 'The Last Return', 'Source of Sound', 'Digital Tides'];
function createTracks() { return Object.keys(trackNames).map(id => ({ id, name: trackNames[id], notes: [], drums: [], defaultVolume: trackVolumes[id], pan: pans[id] })); }
function degreeToPitch(root, steps, degree, octaveShift = 0) { const len = steps.length; const normalized = ((degree % len) + len) % len; return root + steps[normalized] + 12 * (Math.floor(degree / len) + octaveShift); }
function addNote(track, start, length, pitch, velocity, total) { if (start >= total || length <= 0)
    return; const note = { startBeat: round(Math.max(0, start)), durationBeats: round(Math.min(length, total - start)), pitch: clamp(Math.round(pitch), 30, 100), velocity: round(clamp(velocity, .05, 1)) }; if (note.durationBeats > .005)
    track.notes.push(note); }
function addDrum(track, start, type, velocity, total) { if (start >= 0 && start < total)
    track.drums.push({ startBeat: round(start), durationBeats: type === 'openhat' ? .35 : .16, drumType: type, velocity: round(clamp(velocity, .05, 1)) }); }
function nearestVoicing(tones, prev) { if (!prev.length)
    return tones; const out = []; for (let i = 0; i < tones.length; i++) {
    let chosen = tones[i], best = Infinity;
    for (let oct = -1; oct <= 1; oct++) {
        const test = tones[i] + oct * 12;
        const d = Math.abs(test - prev[i % prev.length]);
        if (d < best && test >= 45 && test <= 83) {
            best = d;
            chosen = test;
        }
    }
    out.push(chosen);
} return out; }
export function getGenreTempoRange(genre) { return [...presets[genre].range]; }
export function composeMusic(a, o) {
    const preset = presets[o.genre];
    const codeSeed = fnv1a(`${a.language}|${a.seed}`);
    const seed = fnv1a(`${codeSeed}|${o.genre}|${o.mood}|${o.bpm}|${o.bars}|${o.variation}`);
    const rng = mulberry32(seed);
    const identity = mulberry32(fnv1a('melody:' + codeSeed));
    const bars = o.bars === 'auto' ? (a.effectiveLines <= 14 ? 8 : a.effectiveLines <= 70 ? 16 : 32) : o.bars;
    const total = bars * 4;
    const min = preset.range[0], max = preset.range[1];
    let bpm = o.bpm === 0 ? Math.round(min + (max - min) * (.23 + .55 * rng())) : clamp(o.bpm, min, max);
    if (o.mood === 'calm')
        bpm = Math.min(bpm, Math.round(min + (max - min) * .32));
    if (o.mood === 'energetic')
        bpm = Math.max(bpm, Math.round(min + (max - min) * .75));
    const root = pick([0, 2, 3, 5, 7, 8, 9, 10], rng);
    const minor = o.mood === 'dark' || (o.mood !== 'bright' && (o.genre === 'lofi' || o.genre === 'edm' || o.genre === 'synthwave'));
    const scaleName = o.mood === 'bright' ? 'Major' : o.mood === 'dark' ? 'Minor' : preset.scale === 'minor' ? 'Minor' : preset.scale === 'minorPentatonic' ? 'Minor Pentatonic' : preset.scale === 'pentatonic' ? 'Pentatonic' : 'Major';
    const intervals = scaleName === 'Minor' ? scales.minor : scaleName === 'Pentatonic' ? scales.pentatonic : scaleName === 'Minor Pentatonic' ? scales.minorPentatonic : scales.major;
    const rootPitch = 48 + root;
    const progression = pick(preset.progressions, rng);
    const tracks = createTracks();
    const by = Object.fromEntries(tracks.map(t => [t.id, t]));
    const dna = {
        rhythmDensity: Math.round(clamp(24 + a.normalizedLoopDensity * 53 + a.normalizedNesting * 17, 0, 100)),
        harmonicComplexity: Math.round(clamp(26 + a.normalizedNesting * 57 + a.normalizedFunctionDensity * 13, 0, 100)),
        melodicVariation: Math.round(clamp(18 + a.normalizedBranchDensity * 67 + (a.recursionDetected ? 14 : 0), 0, 100)),
        energy: Math.round(clamp((o.genre === 'edm' ? 56 : o.genre === 'chiptune' ? 53 : o.genre === 'ambient' ? 16 : 35) + a.normalizedComplexity * 27 + (o.mood === 'energetic' ? 18 : o.mood === 'calm' ? -20 : 0), 0, 100)),
        structuralComplexity: a.complexityScore
    };
    const complexity = dna.harmonicComplexity / 100, variation = dna.melodicVariation / 100, rhythm = dna.rhythmDensity / 100;
    // Harmony: stable 4-bar repeating progressions with smooth inversions and optional seventh extensions.
    let prev = [];
    const chordsPerBar = [];
    for (let bar = 0; bar < bars; bar++) {
        const degree = progression[bar % progression.length];
        const isSeventh = complexity > .56 && ((bar + seed) % 3 !== 0);
        const degrees = isSeventh ? [degree, degree + 2, degree + 4, degree + 6] : [degree, degree + 2, degree + 4];
        const tones = degrees.map(d => degreeToPitch(rootPitch, intervals, d));
        const chord = nearestVoicing(tones, prev);
        prev = chord;
        chordsPerBar.push(chord);
        const intro = bar < Math.min(2, bars / 4);
        const outro = bar >= bars - 2;
        const chordStart = bar * 4;
        const chordVel = (intro ? .42 : .61) * (outro ? .8 : 1);
        const length = Math.min(3.83, total - chordStart);
        if (o.genre !== 'chiptune' || bar % 2 === 0)
            for (const pitch of chord)
                addNote(by.chords, chordStart, length, pitch + .0, chordVel, total);
        if (o.genre === 'ambient' || o.genre === 'synthwave' || o.genre === 'lofi') {
            const padStart = bar * 4;
            if (bar % 2 === 0)
                for (const pitch of chord.slice(0, 3))
                    addNote(by.pad, padStart, Math.min(7.75, total - padStart), pitch + 12, .22 * (intro ? .8 : 1), total);
        }
        // Root+fifth bass phrase, genre-specific rhythmic vocabulary.
        const bassRoot = degreeToPitch(rootPitch - 24, intervals, degree);
        const bassPulses = o.genre === 'ambient' ? [0] : o.genre === 'edm' ? [0, 1, 2, 3] : o.genre === 'synthwave' ? [0, .5, 1, 1.5, 2, 2.5, 3, 3.5] : o.genre === 'chiptune' ? [0, .5, 1.5, 2, 3] : [0, 1.5, 2.5];
        for (const pulse of bassPulses) {
            const target = (pulse >= 2.5 && rng() < .42) ? bassRoot + 7 : bassRoot;
            addNote(by.bass, bar * 4 + pulse, o.genre === 'ambient' ? 3.2 : o.genre === 'synthwave' ? .4 : .55, target, .42 + (intro ? -.12 : .08) + (rng() * .1), total);
        }
        // Drum grammar reflects loop density; ambient intentionally has almost no percussion.
        if (o.genre === 'ambient') {
            if (bar % 4 === 2 && rhythm > .46)
                addDrum(by.drums, bar * 4, 'hat', .15, total);
        }
        else {
            const kick = o.genre === 'edm' ? [0, 1, 2, 3] : o.genre === 'chiptune' ? [0, 2] : [0, 2.5];
            const snare = o.genre === 'edm' || o.genre === 'synthwave' ? [1, 3] : o.genre === 'chiptune' ? [1, 3] : [2];
            for (const p of kick)
                addDrum(by.drums, bar * 4 + p, 'kick', .73 + (rng() * .1), total);
            for (const p of snare)
                addDrum(by.drums, bar * 4 + p, 'snare', .43 + (rng() * .13), total);
            const step = (o.genre === 'edm' || rhythm > .57) ? .5 : 1;
            for (let t = 0; t < 4; t += step) {
                if (rng() < .72 + rhythm * .24) {
                    const sw = preset.swing && Math.round(t * 2) % 2 === 1 ? preset.swing : 0;
                    addDrum(by.drums, bar * 4 + t + sw, 'hat', .22 + rng() * .18, total);
                }
            }
            if (rhythm > .66 && bar % 2 === 1) {
                addDrum(by.drums, bar * 4 + 3.75, 'openhat', .30, total);
            }
        }
    }
    // Two-bar motif, based on code identity, reused and transformed across sections.
    const motif = [];
    let cursor = 0;
    let degree = 2 + Math.floor(identity() * 3);
    const density = o.genre === 'ambient' ? .43 : o.genre === 'edm' ? .68 : o.genre === 'chiptune' ? .83 : .60;
    while (cursor < 8) {
        const gap = pick(density > .67 ? [.5, .5, 1, 1.5] : [.5, 1, 1, 1.5, 2], identity);
        const dur = Math.min(1.45, gap * .86);
        if (identity() < .86) {
            degree = clamp(degree + pick([-2, -1, 0, 0, 1, 2], identity), 0, intervals.length + 3);
            motif.push({ beat: cursor, degree, duration: dur, velocity: .5 + .22 * identity() });
        }
        cursor += gap;
    }
    if (!motif.length)
        motif.push({ beat: 0, degree: 2, duration: 1, velocity: .7 });
    for (let bar = 0; bar < bars; bar += 2) {
        const phrase = Math.floor(bar / 2), section = Math.floor(bar / Math.max(2, Math.floor(bars / 4)));
        const isIntro = bar < 2, isOutro = bar >= bars - 2;
        const variant = phrase % 4 === 1 || phrase % 4 === 3 || rng() < variation * .25;
        for (let j = 0; j < motif.length; j++) {
            const event = motif[j];
            const beat = bar * 4 + event.beat;
            if (beat >= total)
                continue;
            if (isIntro && j % 3 === 1)
                continue;
            if (isOutro && event.beat >= 5.5)
                continue;
            let d = event.degree;
            let dur = event.duration;
            if (variant && rng() < variation * .58) {
                d += pick([-1, 0, 1], rng);
                dur *= pick([.7, 1, 1.2], rng);
            }
            if (a.recursionDetected && phrase % 4 === 2) {
                d = event.degree + (j % 2 === 0 ? 0 : 2);
                dur *= .65;
            }
            d = clamp(d, 0, intervals.length + 4);
            const pitch = degreeToPitch(rootPitch + 12, intervals, d);
            addNote(by.melody, beat, dur, pitch, event.velocity * (isIntro ? .59 : isOutro ? .64 : 1) * (section === 2 ? 1.08 : 1), total);
        }
    }
    // An arpeggio is introduced as code nesting increases; pattern recurs deterministically.
    if (complexity > .32 || o.genre === 'synthwave' || o.genre === 'chiptune') {
        const step = o.genre === 'synthwave' || o.genre === 'chiptune' ? .5 : complexity > .65 ? .5 : 1;
        for (let bar = 0; bar < bars; bar++) {
            if (bar < 2 && o.genre !== 'chiptune')
                continue;
            const chord = chordsPerBar[bar];
            const arps = o.genre === 'synthwave' ? [0, 1, 2, 1, 0, 1, 2, 1] : [0, 1, 2, 1, 3, 1, 2, 1];
            for (let t = 0; t < 4; t += step) {
                if (o.genre !== 'synthwave' && rng() < .15)
                    continue;
                const idx = Math.floor(t / step);
                const pitch = chord[arps[idx % arps.length] % chord.length] + 12;
                addNote(by.arpeggio, bar * 4 + t, step * .72, pitch, .25 + complexity * .19, total);
            }
        }
    }
    for (const track of tracks) {
        track.notes.sort((a, b) => a.startBeat - b.startBeat || a.pitch - b.pitch);
        track.drums.sort((a, b) => a.startBeat - b.startBeat);
    }
    const moodName = o.mood === 'dark' ? 'Midnight' : o.mood === 'bright' ? 'Bright' : o.mood === 'calm' ? 'Quiet' : o.mood === 'energetic' ? 'Electric' : '';
    const title = (moodName ? moodName + ' ' : '') + titles[codeSeed % titles.length];
    const explanations = [
        `${a.loopCount} loop(s) influence rhythm density (${dna.rhythmDensity}/100).`,
        `${a.conditionalCount} branch(es) shape melodic variation (${dna.melodicVariation}/100).`,
        `${a.functionCount} function(s) and nesting depth ${a.maxNestingDepth} influence harmony and phrasing.`,
        a.recursionDetected ? 'Recursive structure adds self-similar melodic transformations.' : 'Repeating and varying a core motif keeps the melody coherent.'
    ];
    return { bpm, key: noteNames[root], rootPitch, scale: scaleName, scaleIntervals: intervals, bars, timeSignature: [4, 4], tracks, seed, codeSeed, genre: o.genre, title, variation: o.variation, fingerprint: a.fingerprint, durationSeconds: round(bars * 4 * 60 / bpm, 2), dna, explanations };
}
