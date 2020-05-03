'use strict';

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as cp from 'child_process';

export default class CQSearch {

    private search(srchstring: string, srchtype: string) {
        //console.log('Search for ' + srchstring + ' with search type ' + srchtype);
        if (srchstring.length === 0) {return;}
        if (vscode.workspace.workspaceFolders === undefined) {
            vscode.window.showInformationMessage('CodeQuery Error: Could not get rootpath');
            return;
        }
        const rootpath = vscode.workspace.workspaceFolders[0];
        var dbpath = path.join(rootpath.uri.fsPath, 'cq.db');
        if (!fs.existsSync(dbpath)) {
            vscode.window.showInformationMessage('CodeQuery Error: Could not find' + dbpath);
            return;
        }
        var cmd = `cqsearch -s ${dbpath} -p ${srchtype} -t ${srchstring} -l 0 -f -u`;
        cp.exec(cmd, (err, stdout, stderr) => {
            console.log('=== stdout:\n ' + stdout);
            console.log('=== stderr:\n ' + stderr);
            if (err) {
                console.log('=== error: ' + err);
            }
        });
    }

    private searchFromInputText(srchtype: string) {
        const editor = vscode.window.activeTextEditor;
        if (editor === undefined) {
            //console.log('CodeQuery Error: Could not get activeTexteditor');
            return;
        }
        vscode.window.showInputBox({ value: '', prompt: "Enter text to search", 
                placeHolder: "", password: false }).then( (result) => {
                    if (result) {
                         this.search(result, srchtype);
                    }
                });
    }

    private searchFromSelectedText(srchtype: string) {
        const editor = vscode.window.activeTextEditor;
        if (editor === undefined) {
            //console.log('CodeQuery Error: Could not get activeTexteditor');
            return;
        }
        var text = editor.document.getText(editor.selection);
        this.search(text, srchtype);
    }

    public searchSymbolFromInputText() {
        this.searchFromInputText('1');
    }

    public searchSymbolFromSelectedText() {
        this.searchFromSelectedText('1');
    }
}
