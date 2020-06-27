'use strict';

import * as vscode from 'vscode';
import * as fs from 'fs';
import {SResult} from './srchresults';
import CQSearch from './codequery';

export default class CQResultsProvider implements vscode.TreeDataProvider<SResult> {

	private _onDidChangeTreeData: vscode.EventEmitter<SResult | undefined> = new vscode.EventEmitter<SResult | undefined>();
	readonly onDidChangeTreeData: vscode.Event<SResult | undefined> = this._onDidChangeTreeData.event;
	private workspaceRoot: string|undefined;
	private node: SResult|undefined;

	constructor(public cq: CQSearch) {
        if (vscode.workspace.workspaceFolders === undefined) {
            vscode.window.showInformationMessage('CodeQuery Error: Could not get rootpath');
            this.workspaceRoot = undefined;
        } else {
            this.workspaceRoot = vscode.workspace.workspaceFolders[0].name;
		}
    }

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	openfile(uri: string) {
		var uriparts = uri.split("\t");
		if (uriparts.length === 2) {
			var fileuri = uriparts[0];
			var linenum = uriparts[1];
			var linenum1 = parseInt(linenum, 10);
			var p1: number;
			if (linenum1 > 2) {
				p1 = linenum1 - 2;
			} else if (linenum1 > 1) {
				p1 = linenum1 - 1;
			} else {
				p1 = linenum1;
			}
			var pos1 = new vscode.Position(p1, 0);
			var pos2 = new vscode.Position(linenum1, 0);
			var range = new vscode.Range(pos1, pos2);
			if (!fs.existsSync(fileuri)) {
				var fn1 = fileuri.match(/([^\\\/]+)$/);
				var fn = fn1 ? fn1[0] : fileuri;
				vscode.window.showInformationMessage('CodeQuery Error: Could not find ' + fn);
				return;
			}
			vscode.workspace.openTextDocument(fileuri).then(doc => {
				vscode.window.showTextDocument(doc).then(editor => {
					editor.revealRange(range);
				});
			  });
		}
	}

	getTreeItem(element: SResult): vscode.TreeItem {
		return element;
	}

	getChildren(element?: SResult): Thenable<SResult[]> {
		if (!this.workspaceRoot) {
			vscode.window.showInformationMessage('No SResult in empty workspace');
			return Promise.resolve([]);
        }
        
		if (element) {
			return Promise.resolve(element.children);
		} else {
			return Promise.resolve(this.cq.treedata);
		}
	}

	getParent(element: SResult): Thenable<SResult|null|undefined> {
		return Promise.resolve(element.parent);
	}

}

