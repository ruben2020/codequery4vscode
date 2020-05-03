'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import CQSearch from './codequery';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	const cq : CQSearch = new CQSearch;
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	//console.log('Congratulations, your extension "codequery4vscode" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('codequery4vscode.searchSymbolFromSelection', () => {
		cq.searchSymbolFromSelectedText();
	});
	context.subscriptions.push(disposable);
	disposable = vscode.commands.registerCommand('codequery4vscode.searchSymbolFromInputText', () => {
		cq.searchSymbolFromInputText();
	});
	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}

