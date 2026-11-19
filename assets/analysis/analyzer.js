import { clamp, fnv1a } from '../music/random.js';
const keywordSets = {
    python: new Set('def return class if elif else for while in is not and or True False None try except finally with as pass yield import from lambda async await break continue match case'.split(' ')),
    javascript: new Set('function const let var if else for while do switch case default return class new async await try catch finally break continue import export true false null undefined'.split(' ')),
    typescript: new Set('function const let var if else for while do switch case default return class new async await try catch finally break continue import export true false null undefined interface type public private'.split(' ')),
    c: new Set('int char float double void short long unsigned signed const return for while do if else switch case break continue struct typedef static'.split(' ')),
    cpp: new Set('int char float double void short long unsigned signed const return for while do if else switch case break continue class struct namespace auto template typename public private'.split(' ')),
    java: new Set('int char float double void short long boolean return for while do if else switch case break continue class interface public private protected static final new'.split(' '))
};
/** Removes literal and comment content without removing line breaks, ensuring keywords in strings are ignored. */
export function sanitizeSource(source, language) {
    const python = language === 'python';
    let out = '';
    let i = 0;
    let commentChars = 0;
    const blank = (c) => c === '\n' ? '\n' : c === '\r' ? '\r' : ' ';
    while (i < source.length) {
        const c = source[i], n = source[i + 1], three = source.slice(i, i + 3);
        if ((python && c === '#') || (!python && c === '/' && n === '/')) {
            const start = i;
            while (i < source.length && source[i] !== '\n') {
                out += ' ';
                i++;
            }
            commentChars += i - start;
            continue;
        }
        if (!python && c === '/' && n === '*') {
            i += 2;
            out += '  ';
            commentChars += 2;
            while (i < source.length) {
                if (source[i] === '*' && source[i + 1] === '/') {
                    out += '  ';
                    i += 2;
                    commentChars += 2;
                    break;
                }
                out += blank(source[i]);
                commentChars++;
                i++;
            }
            continue;
        }
        if (c === '"' || c === "'" || (!python && c === '`')) {
            const triple = python && (three === c + c + c);
            const delim = triple ? c + c + c : c;
            out += ' '.repeat(delim.length);
            i += delim.length;
            while (i < source.length) {
                if (source[i] === '\\' && i + 1 < source.length) {
                    out += blank(source[i]) + blank(source[i + 1]);
                    i += 2;
                    continue;
                }
                if (source.slice(i, i + delim.length) === delim) {
                    out += ' '.repeat(delim.length);
                    i += delim.length;
                    break;
                }
                out += blank(source[i]);
                i++;
            }
            continue;
        }
        out += c;
        i++;
    }
    return { code: out, commentChars };
}
function detectFunctions(code, language) {
    const names = [];
    const lines = code.split('\n');
    if (language === 'python') {
        for (const line of lines) {
            const match = line.match(/^\s*(?:async\s+)?def\s+([A-Za-z_]\w*)\s*\(/);
            if (match)
                names.push(match[1]);
        }
    }
    else {
        const functionRe = /\bfunction\s+([A-Za-z_$][\w$]*)\s*\(|\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/g;
        let m;
        while ((m = functionRe.exec(code)) !== null)
            names.push(m[1] || m[2]);
        if (language === 'c' || language === 'cpp' || language === 'java') {
            const re = /\b(?:void|int|long|short|float|double|char|boolean|bool|String|auto|[A-Z][A-Za-z0-9_<>,* &]*)\s+([A-Za-z_]\w*)\s*\([^;{}]*\)\s*(?:const\s*)?(?:\{|$)/gm;
            while ((m = re.exec(code)) !== null) {
                if (!keywordSets[language].has(m[1]))
                    names.push(m[1]);
            }
        }
        // Common method declarations, avoiding calls with an expression before the opening brace.
        const methodRe = /^\s*(?:(?:public|private|protected|static|async|final)\s+)*([A-Za-z_$][\w$]*)\s*\([^;{}]*\)\s*\{/gm;
        while ((m = methodRe.exec(code)) !== null) {
            if (!keywordSets[language].has(m[1]))
                names.push(m[1]);
        }
    }
    return { count: new Set(names).size, names: [...new Set(names)] };
}
function maximumNesting(code, language) {
    if (language === 'python') {
        const lines = code.replace(/\t/g, '    ').split('\n');
        const stack = [];
        let max = 0;
        for (const line of lines) {
            if (!line.trim())
                continue;
            const indent = line.length - line.trimStart().length;
            while (stack.length && indent <= stack[stack.length - 1])
                stack.pop();
            max = Math.max(max, stack.length);
            if (/:\s*$/.test(line))
                stack.push(indent);
            max = Math.max(max, stack.length);
        }
        return max;
    }
    let depth = 0, max = 0;
    for (const c of code) {
        if (c === '{') {
            depth++;
            max = Math.max(max, depth);
        }
        if (c === '}')
            depth = Math.max(0, depth - 1);
    }
    return max;
}
function detectRecursion(code, language, names) {
    for (const name of names) {
        const esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (language === 'python') {
            const lines = code.split('\n');
            const start = lines.findIndex(l => new RegExp(`^\\s*(?:async\\s+)?def\\s+${esc}\\s*\\(`).test(l));
            if (start < 0)
                continue;
            const indent = (lines[start].match(/^\s*/) || [''])[0].length;
            for (let i = start + 1; i < lines.length; i++) {
                const line = lines[i];
                if (line.trim() && (line.match(/^\s*/) || [''])[0].length <= indent)
                    break;
                if (new RegExp(`\\b${esc}\\s*\\(`).test(line))
                    return true;
            }
        }
        else {
            const re = new RegExp(`\\b${esc}\\s*\\(`, 'g');
            let m;
            let occurrences = 0;
            while ((m = re.exec(code)) !== null)
                occurrences++;
            if (occurrences >= 2)
                return true;
        }
    }
    return false;
}
export function analyzeCode(sourceCode, language) {
    const source = sourceCode.replace(/\r\n?/g, '\n');
    const lines = source.split('\n');
    const { code, commentChars } = sanitizeSource(source, language);
    const effectiveLines = code.split('\n').filter(s => s.trim().length > 0).length;
    const identifiers = code.match(/[A-Za-z_$][\w$]*/g) || [];
    const uniqueIdentifiers = new Set(identifiers.filter(n => !keywordSets[language].has(n))).size;
    const loopCount = (code.match(/\b(?:for|while|do)\b/g) || []).length;
    const conditionalCount = (code.match(/\b(?:if|elif|switch|case|match)\b/g) || []).length;
    const { count: functionCount, names } = detectFunctions(code, language);
    const maxNestingDepth = maximumNesting(code, language);
    const recursionDetected = detectRecursion(code, language, names);
    const complexityScore = Math.round(clamp(8 + loopCount * 6 + conditionalCount * 5 + functionCount * 3 + maxNestingDepth * 5 + (recursionDetected ? 13 : 0) + Math.sqrt(effectiveLines) * 2, 0, 100));
    const linesSafe = Math.max(effectiveLines, 4);
    const normalizedComplexity = complexityScore / 100;
    const normalizedLoopDensity = clamp((loopCount / linesSafe) * 5, 0, 1);
    const normalizedBranchDensity = clamp((conditionalCount / linesSafe) * 4, 0, 1);
    const normalizedNesting = clamp(maxNestingDepth / 8, 0, 1);
    const normalizedFunctionDensity = clamp((functionCount / linesSafe) * 7, 0, 1);
    const seed = fnv1a(language + '\0' + source);
    return { language, totalLines: lines.length, effectiveLines, characterCount: source.length, functionCount, loopCount, conditionalCount, maxNestingDepth, uniqueIdentifiers, recursionDetected, commentRatio: source.length ? clamp(commentChars / source.length, 0, 1) : 0, complexityScore, seed, fingerprint: seed.toString(16).toUpperCase().padStart(8, '0'), normalizedComplexity, normalizedLoopDensity, normalizedBranchDensity, normalizedNesting, normalizedFunctionDensity };
}
