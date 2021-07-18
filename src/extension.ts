'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import CQSearch from './codequery';
import CQResultsProvider from './cqtreedataprov';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	//console.log('Congratulations, your extension "codequery4vscode" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const cq = new CQSearch;
	const cqtreedata = new CQResultsProvider(cq);
	cq.treedataprov = cqtreedata;
	const cqtreeview = vscode.window.createTreeView('codequery4vscodeResults', {
		treeDataProvider: cqtreedata
	  });
	cq.treeview = cqtreeview;
	context.subscriptions.push(vscode.commands.registerCommand(
		'codequery4vscode.openfile', (uri: string) => cqtreedata.openfile(uri)));
	context.subscriptions.push(vscode.commands.registerCommand(
		'codequery4vscode.refreshResults', () => cqtreedata.refresh()));
	context.subscriptions.push(vscode.commands.registerCommand(
		'codequery4vscode.searchFromSelectionFuzzy', () => cq.searchFromSelectedTextFuzzy()));
	context.subscriptions.push(vscode.commands.registerCommand(
		'codequery4vscode.searchFromSelectionExact', () => cq.searchFromSelectedTextExact()));
	context.subscriptions.push(vscode.commands.registerCommand(
		'codequery4vscode.searchFromInputText', () => cq.showSearchOptions()));
	context.subscriptions.push(vscode.commands.registerCommand(
		'codequery4vscode.searchAgain', (srchstring: string, srchfrom: string) => cq.showSearchOptions(srchstring, srchfrom)));
	}

// this method is called when your extension is deactivated
export function deactivate() {}

