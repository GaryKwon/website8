export type Language = 'python' | 'javascript' | 'typescript' | 'c' | 'cpp' | 'java';
export type Genre = 'lofi' | 'edm' | 'ambient' | 'synthwave' | 'chiptune';
export type Mood = 'auto' | 'calm' | 'bright' | 'dark' | 'energetic';
export type TrackId = 'drums' | 'bass' | 'chords' | 'melody' | 'arpeggio' | 'pad';
export type DrumType = 'kick' | 'snare' | 'hat' | 'openhat';
export interface CodeAnalysis {
 language: Language; totalLines:number; effectiveLines:number; characterCount:number;
 functionCount:number; loopCount:number; conditionalCount:number; maxNestingDepth:number;
 uniqueIdentifiers:number; recursionDetected:boolean; commentRatio:number; complexityScore:number;
 seed:number; fingerprint:string; normalizedComplexity:number; normalizedLoopDensity:number;
 normalizedBranchDensity:number; normalizedNesting:number; normalizedFunctionDensity:number;
}
export interface NoteEvent {startBeat:number; durationBeats:number; pitch:number; velocity:number;}
export interface DrumEvent {startBeat:number; durationBeats:number; drumType:DrumType; velocity:number;}
export interface MusicTrack {id:TrackId; name:string; notes:NoteEvent[]; drums:DrumEvent[]; defaultVolume:number; pan:number;}
export interface MusicDNA {rhythmDensity:number; harmonicComplexity:number; melodicVariation:number; energy:number; structuralComplexity:number;}
export interface ComposerOptions {genre:Genre; mood:Mood; bpm:number; bars:8|16|32|'auto'; variation:number;}
export interface Composition {bpm:number; key:string; rootPitch:number; scale:string; scaleIntervals:number[]; bars:number; timeSignature:[4,4]; tracks:MusicTrack[]; seed:number; codeSeed:number; fingerprint:string; genre:Genre; title:string; durationSeconds:number; dna:MusicDNA; explanations:string[]; variation:number;}
export interface TrackMix {volume:number; enabled:boolean;}
export type MixerState = Record<TrackId,TrackMix>;
