import * as path from 'path';
import Mocha from 'mocha';
import { glob } from 'glob';

export async function run(): Promise<void> {
    const mocha = new Mocha({ ui: 'tdd', color: true });
    const testsRoot = path.resolve(__dirname, '..');

    // Finds all files ending in .test.js in your build output folder
    const files = await glob('**/**.test.js', { cwd: testsRoot });
    files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));

    return new Promise((c, e) => {
        try { mocha.run(failures => failures > 0 ? e(new Error(`${failures} tests failed.`)) : c()); } 
        catch (err) { e(err); }
    });
}
