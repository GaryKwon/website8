import { mulberry32, clamp, fnv1a } from '../music/random.js';
const RATE = 44100;
const trackIds = ['drums', 'bass', 'chords', 'melody', 'arpeggio', 'pad'];
export const defaultMix = () => ({ drums: { volume: .64, enabled: true }, bass: { volume: .64, enabled: true }, chords: { volume: .40, enabled: true }, melody: { volume: .57, enabled: true }, arpeggio: { volume: .34, enabled: true }, pad: { volume: .29, enabled: true } });
function flatten(composition) { let index = 0; const events = []; for (const t of composition.tracks) {
    for (const note of t.notes)
        events.push({ beat: note.startBeat, track: t.id, note, index: index++ });
    for (const drum of t.drums)
        events.push({ beat: drum.startBeat, track: t.id, drum, index: index++ });
} return events.sort((a, b) => a.beat - b.beat || a.index - b.index); }
function noiseBuffer(ctx, seed) { const buffer = ctx.createBuffer(1, Math.round(ctx.sampleRate * .48), ctx.sampleRate); const data = buffer.getChannelData(0); const rng = mulberry32(fnv1a('noise' + seed)); for (let i = 0; i < data.length; i++)
    data[i] = rng() * 2 - 1; return buffer; }
function makeGraph(ctx, composition, mix, masterVolume) {
    const nodes = [];
    const gate = ctx.createGain();
    const master = ctx.createGain();
    const analyser = ctx.createAnalyser();
    const comp = ctx.createDynamicsCompressor();
    const delay = ctx.createDelay(.75);
    const feedback = ctx.createGain();
    const wet = ctx.createGain();
    nodes.push(gate, master, analyser, comp, delay, feedback, wet);
    gate.gain.value = 1;
    master.gain.value = masterVolume;
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = .79;
    comp.threshold.value = -15;
    comp.knee.value = 17;
    comp.ratio.value = 4;
    comp.attack.value = .008;
    comp.release.value = .23;
    delay.delayTime.value = composition.genre === 'ambient' ? .35 : .23;
    feedback.gain.value = composition.genre === 'ambient' ? .23 : .11;
    wet.gain.value = composition.genre === 'ambient' ? .11 : .06;
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(wet);
    wet.connect(comp);
    comp.connect(analyser);
    analyser.connect(master);
    master.connect(gate);
    gate.connect(ctx.destination);
    const trackGains = {};
    for (const id of trackIds) {
        const gain = ctx.createGain(), pan = ctx.createStereoPanner();
        nodes.push(gain, pan);
        const track = composition.tracks.find(t => t.id === id);
        gain.gain.value = mix[id].enabled ? mix[id].volume : 0;
        pan.pan.value = track?.pan || 0;
        gain.connect(pan);
        pan.connect(comp);
        pan.connect(delay);
        trackGains[id] = gain;
    }
    return { ctx, gate, master, analyser, trackGains, nodes, sources: [], noise: noiseBuffer(ctx, composition.seed) };
}
function addSource(g, src) { g.sources.push(src); }
function filteredTone(g, track, freq, t, duration, velocity, kind, genre) {
    const ctx = g.ctx;
    const attack = kind === 'pad' ? .7 : kind === 'chords' ? .025 : kind === 'bass' ? .008 : .012;
    const release = kind === 'pad' ? .55 : kind === 'chords' ? .19 : kind === 'bass' ? .12 : .11;
    const sustain = kind === 'pad' ? .52 : kind === 'chords' ? .64 : kind === 'bass' ? .48 : .58;
    const hold = Math.max(duration, attack + .025);
    const end = t + hold + release;
    const gain = ctx.createGain(), filter = ctx.createBiquadFilter();
    g.nodes.push(gain, filter);
    const base = kind === 'bass' ? .2 : kind === 'chords' ? .13 : kind === 'pad' ? .085 : kind === 'arpeggio' ? .13 : .17;
    const level = velocity * base;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(level, t + attack);
    gain.gain.linearRampToValueAtTime(level * sustain, t + Math.min(attack + .15, hold));
    gain.gain.setValueAtTime(level * sustain, t + hold);
    gain.gain.linearRampToValueAtTime(0, end);
    filter.type = 'lowpass';
    filter.frequency.value = kind === 'bass' ? 620 : kind === 'pad' ? 1900 : kind === 'chords' ? 2800 : kind === 'arpeggio' ? 5200 : genre === 'chiptune' ? 8000 : 4400;
    filter.Q.value = kind === 'bass' ? 1.3 : .45;
    gain.connect(filter);
    filter.connect(g.trackGains[track]);
    const waveform = kind === 'bass' ? (genre === 'chiptune' ? 'triangle' : 'sawtooth') : kind === 'chords' ? (genre === 'chiptune' ? 'square' : 'triangle') : kind === 'pad' ? 'sine' : genre === 'chiptune' ? 'square' : genre === 'lofi' ? 'triangle' : 'sawtooth';
    const osc = ctx.createOscillator();
    g.nodes.push(osc);
    osc.type = waveform;
    osc.frequency.setValueAtTime(freq, t);
    osc.connect(gain);
    osc.start(t);
    osc.stop(end + .01);
    addSource(g, osc);
    if (kind === 'bass' || kind === 'pad') {
        const sub = ctx.createOscillator(), subGain = ctx.createGain();
        g.nodes.push(sub, subGain);
        sub.type = 'sine';
        sub.frequency.setValueAtTime(kind === 'bass' ? freq / 2 : freq * 1.004, t);
        subGain.gain.value = kind === 'bass' ? .55 : .16;
        sub.connect(subGain);
        subGain.connect(gain);
        sub.start(t);
        sub.stop(end + .01);
        addSource(g, sub);
    }
}
function playDrum(g, type, time, velocity) {
    const ctx = g.ctx;
    const bus = g.trackGains.drums;
    if (type === 'kick') {
        const osc = ctx.createOscillator(), gain = ctx.createGain();
        g.nodes.push(osc, gain);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(145, time);
        osc.frequency.exponentialRampToValueAtTime(47, time + .11);
        osc.frequency.exponentialRampToValueAtTime(35, time + .22);
        gain.gain.setValueAtTime(velocity * .66, time);
        gain.gain.exponentialRampToValueAtTime(.0001, time + .25);
        osc.connect(gain);
        gain.connect(bus);
        osc.start(time);
        osc.stop(time + .27);
        addSource(g, osc);
        return;
    }
    const src = ctx.createBufferSource(), high = ctx.createBiquadFilter(), gain = ctx.createGain();
    g.nodes.push(src, high, gain);
    src.buffer = g.noise;
    high.type = type === 'snare' ? 'highpass' : 'highpass';
    high.frequency.value = type === 'snare' ? 1350 : 6400;
    const decay = type === 'snare' ? .19 : type === 'openhat' ? .26 : .065;
    gain.gain.setValueAtTime(velocity * (type === 'snare' ? .32 : .17), time);
    gain.gain.exponentialRampToValueAtTime(.0001, time + decay);
    src.connect(high);
    high.connect(gain);
    gain.connect(bus);
    src.start(time);
    src.stop(time + decay + .006);
    addSource(g, src);
    if (type === 'snare') {
        const osc = ctx.createOscillator(), body = ctx.createGain();
        g.nodes.push(osc, body);
        osc.type = 'triangle';
        osc.frequency.value = 185;
        body.gain.setValueAtTime(.14 * velocity, time);
        body.gain.exponentialRampToValueAtTime(.0001, time + .11);
        osc.connect(body);
        body.connect(bus);
        osc.start(time);
        osc.stop(time + .12);
        addSource(g, osc);
    }
}
function scheduleEvent(graph, event, startTime, secPerBeat, composition) {
    const time = startTime + event.beat * secPerBeat;
    if (event.drum) {
        playDrum(graph, event.drum.drumType, time, event.drum.velocity);
        return;
    }
    if (!event.note)
        return;
    const note = event.note;
    const hz = 440 * Math.pow(2, (note.pitch - 69) / 12);
    filteredTone(graph, event.track, hz, time, note.durationBeats * secPerBeat, note.velocity, event.track, composition.genre);
}
function disposeGraph(graph, immediate) {
    const now = graph.ctx.currentTime;
    try {
        graph.gate.gain.cancelScheduledValues(now);
        graph.gate.gain.setValueAtTime(graph.gate.gain.value, now);
        graph.gate.gain.linearRampToValueAtTime(0, now + (immediate ? .012 : .055));
    }
    catch { }
    const cleanup = () => { for (const src of graph.sources) {
        try {
            src.stop();
        }
        catch { }
    } for (const node of graph.nodes) {
        try {
            node.disconnect();
        }
        catch { }
    } graph.nodes.length = 0; graph.sources.length = 0; };
    if (immediate)
        cleanup();
    else
        setTimeout(cleanup, 160);
}
export class AudioEngine {
    ctx = null;
    graph = null;
    composition = null;
    mix = defaultMix();
    master = .75;
    events = [];
    nextEvent = 0;
    timer = null;
    startTime = 0;
    offsetBeat = 0;
    state = 'stopped';
    onStateChange = () => { };
    onTick = () => { };
    onEnded = () => { };
    getState() { return this.state; }
    getAnalyser() { return this.graph?.analyser || null; }
    getVolume() { return this.master; }
    getCurrentSeconds() { if (!this.composition)
        return 0; const b = this.state === 'playing' && this.ctx ? Math.max(0, (this.ctx.currentTime - this.startTime) * this.composition.bpm / 60) : this.offsetBeat; return clamp(b * 60 / this.composition.bpm, 0, this.composition.durationSeconds); }
    getMixer() { return structuredClone(this.mix); }
    setComposition(composition) { this.stop(); this.composition = composition; this.events = flatten(composition); this.offsetBeat = 0; this.mix = defaultMix(); this.onTick(0); }
    setMasterVolume(v) { this.master = clamp(v, 0, 1); if (this.graph && this.ctx)
        this.graph.master.gain.setTargetAtTime(this.master, this.ctx.currentTime, .018); }
    setTrack(id, value) { this.mix[id] = { ...this.mix[id], ...value }; const g = this.graph; if (g) {
        const now = g.ctx.currentTime;
        g.trackGains[id].gain.setTargetAtTime(this.mix[id].enabled ? this.mix[id].volume : 0, now, .02);
    } }
    async play() {
        if (!this.composition || this.state === 'playing')
            return;
        if (!this.ctx)
            this.ctx = new AudioContext();
        await this.ctx.resume();
        if (this.offsetBeat >= this.composition.bars * 4)
            this.offsetBeat = 0;
        this.graph = makeGraph(this.ctx, this.composition, this.mix, this.master);
        const spb = 60 / this.composition.bpm;
        this.startTime = this.ctx.currentTime + .09 - this.offsetBeat * spb;
        this.nextEvent = this.events.findIndex(e => e.beat + 1e-5 >= this.offsetBeat);
        if (this.nextEvent < 0)
            this.nextEvent = this.events.length;
        this.state = 'playing';
        this.onStateChange(this.state);
        this.tick();
        this.timer = window.setInterval(() => this.tick(), 45);
    }
    tick() {
        if (!this.ctx || !this.graph || !this.composition || this.state !== 'playing')
            return;
        const ctx = this.ctx, spb = 60 / this.composition.bpm, until = ctx.currentTime + .25;
        while (this.nextEvent < this.events.length) {
            const event = this.events[this.nextEvent];
            const when = this.startTime + event.beat * spb;
            if (when > until)
                break;
            if (when >= ctx.currentTime - .018)
                scheduleEvent(this.graph, event, this.startTime, spb, this.composition);
            this.nextEvent++;
        }
        const seconds = this.getCurrentSeconds();
        this.onTick(seconds);
        if (seconds >= this.composition.durationSeconds - .025) {
            this.stop();
            this.onEnded();
        }
    }
    pause() { if (this.state !== 'playing' || !this.composition)
        return; this.offsetBeat = this.getCurrentSeconds() * this.composition.bpm / 60; this.halt(false); this.state = 'paused'; this.onStateChange(this.state); }
    stop() { this.halt(false); this.offsetBeat = 0; this.state = 'stopped'; this.onStateChange(this.state); this.onTick(0); }
    restart() { this.halt(false); this.offsetBeat = 0; this.state = 'stopped'; return this.play(); }
    seek(seconds) { if (!this.composition)
        return; const wasPlaying = this.state === 'playing'; this.halt(false); this.offsetBeat = clamp(seconds * this.composition.bpm / 60, 0, this.composition.bars * 4); this.state = 'paused'; this.onTick(this.getCurrentSeconds()); this.onStateChange(this.state); if (wasPlaying)
        void this.play(); }
    halt(immediate) { if (this.timer !== null) {
        clearInterval(this.timer);
        this.timer = null;
    } if (this.graph) {
        disposeGraph(this.graph, immediate);
        this.graph = null;
    } }
    destroy() { this.halt(true); if (this.ctx) {
        void this.ctx.close();
        this.ctx = null;
    } }
}
export function wavFromBuffer(buffer) {
    const channels = Math.min(2, buffer.numberOfChannels);
    const frames = buffer.length;
    const bytes = frames * channels * 2;
    const output = new ArrayBuffer(44 + bytes);
    const view = new DataView(output);
    const str = (offset, s) => { for (let i = 0; i < s.length; i++)
        view.setUint8(offset + i, s.charCodeAt(i)); };
    str(0, 'RIFF');
    view.setUint32(4, 36 + bytes, true);
    str(8, 'WAVE');
    str(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, channels, true);
    view.setUint32(24, buffer.sampleRate, true);
    view.setUint32(28, buffer.sampleRate * channels * 2, true);
    view.setUint16(32, channels * 2, true);
    view.setUint16(34, 16, true);
    str(36, 'data');
    view.setUint32(40, bytes, true);
    let at = 44, sumsq = 0, peak = 0;
    const data = Array.from({ length: channels }, (_, ch) => buffer.getChannelData(ch));
    for (let i = 0; i < frames; i++) {
        for (let ch = 0; ch < channels; ch++) {
            let s = clamp(data[ch][i], -1, 1);
            peak = Math.max(peak, Math.abs(s));
            sumsq += s * s;
            view.setInt16(at, s < 0 ? s * 32768 : s * 32767, true);
            at += 2;
        }
    }
    return { blob: new Blob([output], { type: 'audio/wav' }), peak, rms: Math.sqrt(sumsq / (frames * channels)) };
}
export async function renderWav(composition, mix, volume) {
    const tail = 1.2, seconds = composition.durationSeconds + tail;
    const memoryMb = seconds * RATE * 2 * 4 / 1024 / 1024;
    if (memoryMb > 145)
        throw new Error('This WAV is too long to render safely. Choose a shorter track.');
    const offline = new OfflineAudioContext(2, Math.ceil(seconds * RATE), RATE);
    const graph = makeGraph(offline, composition, mix, volume);
    const events = flatten(composition), spb = 60 / composition.bpm;
    for (const event of events)
        scheduleEvent(graph, event, .01, spb, composition);
    const end = composition.durationSeconds;
    graph.gate.gain.setValueAtTime(1, 0);
    graph.gate.gain.setValueAtTime(1, Math.max(0, end - .36));
    graph.gate.gain.linearRampToValueAtTime(0, end + .12);
    const buffer = await offline.startRendering();
    for (const n of graph.nodes) {
        try {
            n.disconnect();
        }
        catch { }
    }
    graph.nodes.length = 0;
    graph.sources.length = 0;
    return wavFromBuffer(buffer);
}
