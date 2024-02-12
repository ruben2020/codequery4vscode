'use strict';

import * as vscode from 'vscode';
import { setMaxListeners } from 'process';

export class SRAggregator {
	private toplevel: SResult[];
	private rootpath: string;

	constructor () {
		this.toplevel = [];
		this.addSearchHelp();
		this.rootpath = '';
	}

	get treedata(): SResult[] {
		return this.toplevel;
	}

	public reset(rootp: string) {
		this.toplevel = [];
		this.rootpath = rootp;
	}

	private formatURI(fullpath: string, linenum: string): string {
		var fp = fullpath;
		if (process.env.HOME) {
			fp = fp.replace('$HOME', process.env.HOME);
		}
		return `${fp}\t${linenum}`;
	}

	private shortfullpath(fullpath: string): string {
		var fp = fullpath;
		if (process.env.HOME) {
			fp = fp.replace('$HOME', process.env.HOME);
		}
		fp = fp.replace(this.rootpath, "");
		fp = fp.replace(/^[\\\/]*/,"");
		return `${fp}`;
	}

	private sortRecords() {
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
		var shortfp = this.shortfullpath(fullpath);
		var labeltext = `${linenum}: ${previewtext}`;
		var item2: SResult = new SResult(labeltext, parseInt(linenum, 10), stext, vscode.TreeItemCollapsibleState.None, {
			command: 'codequery4vscode.openfile',
			title: fullpath2,
			arguments: [fullpath2]
		});
		var notfound: boolean = true;
		if (this.toplevel.length > 0) {
			for (var item of this.toplevel) {
				if (item.label === shortfp) {
					notfound = false;
					item2.parent = item;
					item.children.push(item2);
					break;
				}
			}
		}
		if (notfound) {
			var item: SResult = new SResult(shortfp, 0, '', vscode.TreeItemCollapsibleState.Collapsed);
			var arr: SResult[] = [];
			item2.parent = item;
			arr.push(item2);
			item.children = arr;
			this.toplevel.push(item);
		}
	}

	private addSearchHelp() {
		var item = new SResult('[Click here to search]', 0, '', vscode.TreeItemCollapsibleState.None, {
			command: 'codequery4vscode.searchFromInputText',
			title: 'CodeQuery: Search from input text',
			arguments: []
		});
		/*var item2 = new SResult('[Click here to rebuild database]', 0, '', vscode.TreeItemCollapsibleState.None, {
			command: 'codequery4vscode.rebuildDatabase',
			title: 'CodeQuery: Rebuild database',
			arguments: []
		});
		this.toplevel.unshift(item2);*/
		this.toplevel.unshift(item);
	}

	public addSearchSummary(srchdescription: string, srchstring: string, numofresults: number, srchfrom: string): SResult {
		var item = new SResult('Search Summary', 0, '', vscode.TreeItemCollapsibleState.Expanded);
		var arr: SResult[] = [];
		var item1 = new SResult(`Search type: ${srchdescription}`, 0, '', vscode.TreeItemCollapsibleState.None);
		var item2 = new SResult(`Searched from: ${srchfrom}`, 0, '', vscode.TreeItemCollapsibleState.None);
		var item3 = new SResult(`Search string: ${srchstring}`, 0, '', vscode.TreeItemCollapsibleState.None);
		var item4 = new SResult(`Number of results: ${numofresults}`, 0, '', vscode.TreeItemCollapsibleState.None);
		var item5 = new SResult('[Search again with another type]', 0, '', vscode.TreeItemCollapsibleState.None, {
			command: 'codequery4vscode.searchAgain',
			title: 'search again',
			arguments: [srchstring, srchfrom]
		});
		item1.parent = item;
		item2.parent = item;
		item3.parent = item;
		item4.parent = item;
		item5.parent = item;
		arr.push(item1);
		arr.push(item2);
		arr.push(item3);
		arr.push(item4);
		arr.push(item5);
		item.children = arr;
		this.sortRecords();
		this.toplevel.unshift(item);
		this.addSearchHelp();
		return item3;
    }
}

export class SResult extends vscode.TreeItem {

	private childrenLst: SResult[];
	private myparent: SResult|undefined;

	constructor(
		public readonly label: string,
		public linenum: number,
		public stext: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly command?: vscode.Command,
	) {
		super(label, collapsibleState);
		this.childrenLst = [];
		this.tooltip = this.stext;
		this.description = this.stext;
	}

/*
	get tooltip(): string {
		return this.stext;
	}

	get description(): string {
		return this.stext;
	}
*/
	get children(): SResult[] {
		return this.childrenLst;
	}

	set children(kids: SResult[]) {
		this.childrenLst = kids;
	}

	set parent (prent: SResult|undefined) {
		this.myparent = prent;
	}

	get parent(): SResult|undefined {
		return this.myparent;
	}

}
