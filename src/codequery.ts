'use strict';

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as cp from 'child_process';
import { isNull } from 'util';
import {SRAggregator, SResult} from './srchresults';
import CQResultsProvider from './cqtreedataprov';

export default class CQSearch {

    private sra: SRAggregator;
    private cqrp: CQResultsProvider|undefined;

    constructor() {
        this.sra = new SRAggregator;
        this.cqrp = undefined;
    }

    set treedataprov(dataprov: CQResultsProvider) {
        this.cqrp = dataprov;
    }

    get treedata() {
        return this.sra.treedata;
    }

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
                if (isNull(err)) {
                    //console.log(stdout);
                    var lines = stdout.split("\n");
                    this.sra.reset();
                    for (var line of lines) {
                        var cols = line.split("\t");
                        if (cols.length === 3) {
                            var stext = cols[0];
                            var preview = cols[2];
                            var fp = cols[1].split(":");
                            if (fp.length === 2) {
                                var fullpath = fp[0];
                                var lineno = fp[1];
                                var fn1 = fullpath.match(/([^\\\/]+)$/);
                                var fn = fn1? fn1[0] : "";
                                this.sra.addRecord(fn, fullpath, lineno, preview, stext);
                            }
                        }
                    }
                    this.sra.sortRecords();
                    if (this.cqrp) {
                        this.cqrp.refresh();
                    }
                }
                else {
                    vscode.window.showInformationMessage('CodeQuery Error: ' + stdout);
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
