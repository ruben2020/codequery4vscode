import { defineConfig } from '@vscode/test-cli';

export default defineConfig({
    // Points to the entry point file that bootstraps Mocha
    files: 'out/test/suite/index.js', 
    version: 'stable',
    mocha: {
        ui: 'tdd',
        timeout: 20000,
        color: true
    }
});

