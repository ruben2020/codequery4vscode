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
    private mytreeview: vscode.TreeView<SResult>|undefined;

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

    set treeview(tview: vscode.TreeView<SResult>) {
        this.mytreeview = tview;
    }

    private search(srchstring: string, srchtype: string, srchdescription: string, srchfrom: string) {
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
                    var numofresults = 0;
                    var lines = stdout.split("\n");
                    this.sra.reset();
                    for (var line of lines) {
                        var cols = line.split("\t");
                        if (cols.length === 3) {
                            this.searchResultsThreeColumns(cols);
                            numofresults++;
                        } else if (cols.length === 2) {
                            this.searchResultsTwoColumns(cols);
                            numofresults++;
                        }
                    }
                    var item = this.sra.addSearchSummary(srchdescription, srchstring, numofresults, srchfrom);
                    if (this.cqrp) {
                        this.cqrp.refresh();
                        if (this.mytreeview) {
                            this.mytreeview.reveal(item);
                        }
                    }
                }
                else {
                    vscode.window.showInformationMessage('CodeQuery Error: ' + stdout + "\n" + stderr);
                }
        });
    }

    private searchResultsThreeColumns(cols: string[]) {
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

    private searchResultsTwoColumns(cols: string[]) {
        var preview = cols[1];
        var fp = cols[0].split(":");
        if (fp.length === 2) {
            var stext = preview;
            var fullpath = fp[0];
            var lineno = fp[1];
            var fn1 = fullpath.match(/([^\\\/]+)$/);
            var fn = fn1? fn1[0] : "";
            this.sra.addRecord(fn, fullpath, lineno, preview, stext);
        }
    }

    private searchFromInputText(srchtype: string, titletext: string, srchtypetxt: string) {
        var input = vscode.window.createInputBox();
        input.title = titletext;
        input.prompt = "Enter text to search";
        input.enabled = true;
        input.busy = false;
        input.password = false;
        input.onDidHide(() => {input.dispose();});
        input.onDidAccept(async () => {
                var inputtext = input.value;
                input.dispose();
                this.search(inputtext, srchtype, srchtypetxt, 'inputbox');
            }
        );
        input.show();
    }

    public showSearchOptions(srchtxt?: string|undefined, srchfrom?: string|undefined) {
        vscode.window.showQuickPick([
            '1: Symbol',
            '2: Function or macro definition',
            '3: Class or struct',
            '4: Files including this file',
            '6: Functions calling this function',
            '7: Functions called by this function',
            '8: Calls of this function or macro',
            '9: Members and methods of this class',
            '10: Class which owns this member or method',
            '11: Children of this class (inheritance)',
            '12: Parent of this class (inheritance)'
        ], {
            placeHolder: '1: Symbol',
        }).then( (result) => {
            if (result) {
                var result1 = result.split(':');
                if ((result1) && (result1.length === 2)) {
                    if (srchtxt) {
                        var sfrom: string;
                        if (srchfrom) {sfrom = srchfrom;}
                        else {sfrom = 'text selection';}
                        this.search(srchtxt, result1[0], result1[1], sfrom);
                    } else {
                        this.searchFromInputText(result1[0], `CodeQuery Search:${result1[1]}`, result1[1]);
                    }
                }
            }
        });
    }

    public searchFromSelectedText() {
        const editor = vscode.window.activeTextEditor;
        if (editor === undefined) {
            //console.log('CodeQuery Error: Could not get activeTexteditor');
            return;
        }
        var text = editor.document.getText(editor.selection);
        this.showSearchOptions(text);
    }

}
