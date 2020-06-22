'use strict';

import * as vscode from 'vscode';

export class SRAggregator {
	private toplevel: SResult[];

	constructor () {
		this.toplevel = [];
	}

	get treedata(): SResult[] {
		return this.toplevel;
	}

	public reset() {
		this.toplevel = [];
	}

	private formatURI(fullpath: string, linenum: string): string {
		var fp = fullpath;
        if (vscode.workspace.workspaceFolders === undefined) {
			vscode.window.showInformationMessage('CodeQuery Error: Could not get rootpath');
			fp.replace(/^\$HOME/, "");
            return `${fp}:${linenum}:0`;
		}
		const rootpath = vscode.workspace.workspaceFolders[0];
		fp.replace(/^\$HOME/, rootpath.uri.fsPath);
		return `${fp}:${linenum}:0`;
	}

	public sortRecords() {
		for (var item of this.toplevel) {
			var cn = item.children;
			cn.sort( (t1, t2) => {
				if (t1.lineum > t2.lineum) {
					return 1;
				}
				if (t1.lineum < t2.lineum) {
					return -1;
				}
				return 0;
			});
			item.children = cn;
		}
		this.toplevel.sort( (t1, t2) => {
			return (t1.label.localeCompare(t2.label));
		});
	}

	public addRecord(
		filename: string,
		fullpath: string,
		linenum: string,
		previewtext: string
	) {
		var fullpath2 = this.formatURI(fullpath, linenum);
		var item2: SResult = new SResult(previewtext, parseInt(linenum, 10), vscode.TreeItemCollapsibleState.None, {
			command: 'vscode.open',
			title: '',
			arguments: [fullpath2]
		});
		var notfound: boolean = true;
		if (this.toplevel.length > 0) {
			for (var item of this.toplevel) {
				if (item.label === filename) {
					notfound = false;
					item.children.push(item2);
					break;
				}
			}
		}
		if (notfound) {
			var item: SResult = new SResult(filename, 0, vscode.TreeItemCollapsibleState.Collapsed);
			var arr: SResult[] = [];
			arr.push(item2);
			item.children = arr;
			this.toplevel.push(item);
		}
	}
}

export class SResult extends vscode.TreeItem {

	private childrenLst: SResult[];

	constructor(
		public readonly label: string,
		public lineum: number,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);
		this.childrenLst = [];
	}

	get tooltip(): string {
		return `${this.label}`;
	}

	get description(): string {
		return `${this.label}`;	
	}

	get children(): SResult[] {
		return this.childrenLst;
	}

	set children(kids: SResult[]) {
		this.childrenLst = kids;
	}

}
