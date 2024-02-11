'use strict';

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as cp from 'child_process';
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

    private find_cqdb(rootpath: vscode.WorkspaceFolder): string {
        var dbpath3 = path.join(rootpath.uri.fsPath, '.vscode');
        dbpath3 = path.join(dbpath3, 'codequery');
        dbpath3 = path.join(dbpath3, 'cq.db');
        return dbpath3;
    }

    private find_rebuild_script(rootpath: vscode.WorkspaceFolder): string {
        var path1 = path.join(rootpath.uri.fsPath, '.vscode');
        path1 = path.join(path1, 'codequery');
        var path2 = path.join(path1, 'rebuild.bat');
        path1 = path.join(path1, 'rebuild.sh');
        if (fs.existsSync(path1)) {
            return path1;
        }
        else if (fs.existsSync(path2)) {
            return path2;
        }
        return path1;
    }

    private search(srchstring: string, srchtype: string, srchdescription: string, 
        srchfrom: string, exact: boolean, pathfilter?: string|undefined) {
        //console.log('Search for ' + srchstring + ' with search type ' + srchtype);
        if (srchstring.length === 0) {return;}
        if (vscode.workspace.workspaceFolders === undefined) {
            vscode.window.showInformationMessage('CodeQuery Error: Could not get rootpath');
            return;
        }
        const rootpath = vscode.workspace.workspaceFolders[0];
        var dbpath = this.find_cqdb(rootpath);
        if (!fs.existsSync(dbpath)) {
            vscode.window.showInformationMessage('CodeQuery Error: Could not find ' + dbpath);
            return;
        }
        var exactstr : string;
        if (exact) {exactstr = '-e';}
        else {exactstr = '-f';}
        if (pathfilter)
        {
            var cmd = `cqsearch -s ${dbpath} -p ${srchtype} -t ${srchstring} -l 0 ${exactstr} -u -b ${pathfilter}`;
        }
        else
        {
            var cmd = `cqsearch -s ${dbpath} -p ${srchtype} -t ${srchstring} -l 0 ${exactstr} -u`;
        }
        cp.exec(cmd, (err, stdout, stderr) => {
                if (err === null) {
                    var numofresults = 0;
                    var lines = stdout.split("\n");
                    this.sra.reset(rootpath.uri.fsPath);
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
                    var srchstring2 : string;
                    if (exact) { srchstring2 = '\x22' + srchstring + '\x22'; }
                    else { srchstring2 = srchstring; }
                    if (pathfilter)
                    {
                        srchstring2 = srchstring2 + '[' + pathfilter + ']';
                    }
                    var item = this.sra.addSearchSummary(srchdescription, srchstring2, numofresults, srchfrom);
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
        if (fp.length === 3) { // Windows
            var s1 = fp.shift();
            var s2 = `${s1}:${fp[0]}`.replace(/\//g, "\\");
            fp[0] = s2;
        }
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
        if (fp.length === 3) { // Windows
            var s1 = fp.shift();
            var s2 = `${s1}:${fp[0]}`.replace(/\//g, "\\");
            fp[0] = s2;
        }
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
        input.prompt = 'Enter text to search; in quotes ("") for exact, or without, for fuzzy. After this, a path filter text can optionally be added in square brackets (e.g. [src] or [*.h]). Please see documentation for details.';
        input.enabled = true;
        input.busy = false;
        input.password = false;
        input.onDidHide(() => {input.dispose();});
        input.onDidAccept(async () => {
                var inputtext = input.value;
                input.dispose();
                inputtext = inputtext.trim();
                var srchstr = inputtext;
                var exact = false;
                var pathfilter = undefined;
                if (inputtext.length > 1)
                {
                    var reg1 = /\[(.*)\]$/;
                    var matches = inputtext.match(reg1);
                    if (matches?.length === 2)
                    {
                        pathfilter = matches[1];
                        inputtext = inputtext.replace(/\[(.*)\]/,'');
                        srchstr = inputtext;
                    }
                }
                if ((inputtext.length > 1) &&
                (((inputtext.charAt(0) === '\x27')&&(inputtext.charAt(inputtext.length - 1) === '\x27'))||
                ((inputtext.charAt(0) === '\x22')&&(inputtext.charAt(inputtext.length - 1) === '\x22'))))
                    {
                        srchstr = inputtext.replace(/[\x22|\x27]/g,'');
                        exact = true;
                    }
                if (pathfilter)
                {
                    this.search(srchstr, srchtype, srchtypetxt, 'inputbox', exact, pathfilter);
                }
                else
                {
                    this.search(srchstr, srchtype, srchtypetxt, 'inputbox', exact);
                }
            }
        );
        input.show();
    }

    public showSearchOptions(srchtxt?: string|undefined, srchfrom?: string|undefined, exact?: boolean|undefined) {
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
                        srchtxt = srchtxt.trim();
                        var srchstr = srchtxt;
                        var pathfilter = undefined;
                        if (exact === undefined)
                        {
                            if (srchtxt.length > 1)
                            {
                                var reg1 = /\[(.*)\]$/;
                                var matches = srchtxt.match(reg1);
                                if (matches?.length === 2)
                                {
                                    pathfilter = matches[1];
                                    srchtxt = srchtxt.replace(/\[(.*)\]/,'');
                                    srchstr = srchtxt;
                                }
                            }
                            if ((srchtxt.length > 1) &&
                            (((srchtxt.charAt(0) === '\x27')&&(srchtxt.charAt(srchtxt.length - 1) === '\x27'))||
                            ((srchtxt.charAt(0) === '\x22')&&(srchtxt.charAt(srchtxt.length - 1) === '\x22'))))
                                {
                                    srchstr = srchtxt.replace(/[\x22|\x27]/g,'');
                                    exact = true;
                                }
                            else {exact = false;}
                        }
                        if (pathfilter)
                        {
                            this.search(srchstr, result1[0], result1[1], sfrom, exact, pathfilter);
                        }
                        else
                        {
                            this.search(srchstr, result1[0], result1[1], sfrom, exact);
                        }
                    } else {
                        this.searchFromInputText(result1[0], `CodeQuery Search:${result1[1]}`, result1[1]);
                    }
                }
            }
        });
    }

    public searchFromSelectedTextExact() {
        const editor = vscode.window.activeTextEditor;
        if (editor === undefined) {
            //console.log('CodeQuery Error: Could not get activeTexteditor');
            return;
        }
        var text = editor.document.getText(editor.selection);
        var srchstr = '\x22' + text + '\x22';
        this.showSearchOptions(srchstr);
    }

    public searchFromSelectedTextFuzzy() {
        const editor = vscode.window.activeTextEditor;
        if (editor === undefined) {
            //console.log('CodeQuery Error: Could not get activeTexteditor');
            return;
        }
        var text = editor.document.getText(editor.selection);
        this.showSearchOptions(text);
    }

    public rebuildDatabase() {
        if (vscode.workspace.workspaceFolders === undefined) {
            vscode.window.showInformationMessage('CodeQuery Error: Could not get rootpath');
            return;
        }
        const rootpath = vscode.workspace.workspaceFolders[0];
        var script = this.find_rebuild_script(rootpath);
        if (!fs.existsSync(script)) {
            vscode.window.showInformationMessage('CodeQuery Error: Could not find ' + script);
            return;
        }
        try { 
            fs.accessSync(script, fs.constants.F_OK | fs.constants.X_OK);
        } catch (err) { 
            vscode.window.showInformationMessage('CodeQuery Error: Could not execute file ' + script);
            return;
        }
        var cmd: string = "cd " + rootpath.uri.fsPath + " && " + script;
        cp.exec(cmd, (err, stdout, stderr) => {
            if (err === null) {
                vscode.window.showInformationMessage("CodeQuery rebuild script was executed successfully.");
            }
            else {
                vscode.window.showInformationMessage('CodeQuery Error: ' + stdout + "\n" + stderr);
            }
    });

    }
}
