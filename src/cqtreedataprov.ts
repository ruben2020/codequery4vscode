'use strict';

import * as vscode from 'vscode';
import {SResult} from './srchresults';
import CQSearch from './codequery';

export default class CQResultsProvider implements vscode.TreeDataProvider<SResult> {

	private _onDidChangeTreeData: vscode.EventEmitter<SResult | undefined> = new vscode.EventEmitter<SResult | undefined>();
	readonly onDidChangeTreeData: vscode.Event<SResult | undefined> = this._onDidChangeTreeData.event;
    private workspaceRoot: string|undefined;

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


}

