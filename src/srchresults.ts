'use strict';

import * as vscode from 'vscode';
import { setMaxListeners } from 'process';

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
			return `${fp}:${linenum}`;
		}
		const rootpath = vscode.workspace.workspaceFolders[0];
		if (process.env.HOME) {
			fp = fp.replace('$HOME', process.env.HOME);
		}
		return `${fp}:${linenum}`;
	}

	public sortRecords() {
		for (var item of this.toplevel) {
			var cn = item.children;
			cn.sort( (t1, t2) => {
				if (t1.linenum > t2.linenum) {
					return 1;
				}
				if (t1.linenum < t2.linenum) {
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
		previewtext: string,
		stext: string
	) {
		var fullpath2 = this.formatURI(fullpath, linenum);
		var labeltext = `${linenum}: ${previewtext}`;
		var item2: SResult = new SResult(labeltext, parseInt(linenum, 10), stext, vscode.TreeItemCollapsibleState.None, {
			command: 'codequery4vscode.openfile',
			title: fullpath2,
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
			var item: SResult = new SResult(filename, 0, '', vscode.TreeItemCollapsibleState.Collapsed);
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
		public linenum: number,
		public stext: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);
		this.childrenLst = [];
	}

	get tooltip(): string {
		return this.stext;
	}

	get description(): string {
		return this.stext;
	}

	get children(): SResult[] {
		return this.childrenLst;
	}

	set children(kids: SResult[]) {
		this.childrenLst = kids;
	}

}
