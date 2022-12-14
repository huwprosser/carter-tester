import * as vscode from "vscode";
import { AgentsProvider } from "./agents";

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand(
            "catCoding.start",
            (agentId: string) => {
                CatCodingPanel.createOrShow(context.extensionUri, agentId);
            }
        )
    );
    const tree = vscode.window.createTreeView("carter-tester", {
        treeDataProvider: new AgentsProvider(),
    });

    tree.onDidChangeSelection((e) => {
        console.log(e.selection[0].agentId);

        // run e.selection command
        vscode.commands.executeCommand(
            "catCoding.start",
            e.selection[0].agentId
        );
    });

    if (vscode.window.registerWebviewPanelSerializer) {
        // Make sure we register a serializer in activation event
        vscode.window.registerWebviewPanelSerializer(CatCodingPanel.viewType, {
            async deserializeWebviewPanel(
                webviewPanel: vscode.WebviewPanel,
                state: any
            ) {
                console.log(`Got state: ${state}`);
                // Reset the webview options so we use latest uri for `localResourceRoots`.
                webviewPanel.webview.options = getWebviewOptions(
                    context.extensionUri
                );
                CatCodingPanel.revive(webviewPanel, context.extensionUri);
            },
        });
    }
}

function getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
    return {
        // Enable javascript in the webview
        enableScripts: true,

        // And restrict the webview to only loading content from our extension's `media` directory.
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, "media")],
    };
}

/**
 * Manages cat coding webview panels
 */
class CatCodingPanel {
    /**
     * Track the currently panel. Only allow a single panel to exist at a time.
     */
    public static currentPanel: CatCodingPanel | undefined;

    public static readonly viewType = "catCoding";

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(extensionUri: vscode.Uri, agentId: string) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it.
        if (CatCodingPanel.currentPanel) {
            CatCodingPanel.currentPanel._panel.reveal(column);
            return;
        }

        // Otherwise, create a new panel.
        const panel = vscode.window.createWebviewPanel(
            CatCodingPanel.viewType,
            "Agent Chat",
            column || vscode.ViewColumn.One,
            getWebviewOptions(extensionUri)
        );

        CatCodingPanel.currentPanel = new CatCodingPanel(
            panel,
            extensionUri,
            agentId
        );
    }

    public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        CatCodingPanel.currentPanel = new CatCodingPanel(
            panel,
            extensionUri,
            ""
        );
    }

    private constructor(
        panel: vscode.WebviewPanel,
        extensionUri: vscode.Uri,
        agentId: string
    ) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        // Set the webview's initial html content
        this._update(agentId);

        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programmatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Update the content based on view changes
        this._panel.onDidChangeViewState(
            (e) => {
                if (this._panel.visible) {
                    this._update(agentId);
                }
            },
            null,
            this._disposables
        );

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(
            (message) => {
                switch (message.command) {
                    case "alert":
                        vscode.window.showErrorMessage(message.text);
                        return;
                }
            },
            null,
            this._disposables
        );
    }

    public doRefactor() {
        // Send a message to the webview webview.
        // You can send any JSON serializable data.
        this._panel.webview.postMessage({ command: "refactor" });
    }

    public dispose() {
        CatCodingPanel.currentPanel = undefined;

        // Clean up our resources
        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private _update(agentId: string) {
        const webview = this._panel.webview;

        this._updateForCat(webview, agentId);
    }

    private _updateForCat(webview: vscode.Webview, phrase: string) {
        this._panel.title = phrase;
        this._panel.webview.html = this._getHtmlForWebview(webview, phrase);
    }

    private _getHtmlForWebview(webview: vscode.Webview, phrase: string) {
        // Local path to main script run in the webview
        const scriptPathOnDisk = vscode.Uri.joinPath(
            this._extensionUri,
            "media",
            "main.js"
        );

        // And the uri we use to load this script in the webview
        const scriptUri = webview.asWebviewUri(scriptPathOnDisk);

        // Local path to css styles
        const styleResetPath = vscode.Uri.joinPath(
            this._extensionUri,
            "media",
            "reset.css"
        );
        const stylesPathMainPath = vscode.Uri.joinPath(
            this._extensionUri,
            "media",
            "vscode.css"
        );
        const logoPathMain = vscode.Uri.joinPath(
            this._extensionUri,
            "media",
            "full-logo.svg"
        );

        // Uri to load styles into webview
        const stylesResetUri = webview.asWebviewUri(styleResetPath);
        const stylesMainUri = webview.asWebviewUri(stylesPathMainPath);
        const logoUri = webview.asWebviewUri(logoPathMain);

        // Use a nonce to only allow specific scripts to be run
        const nonce = getNonce();

        return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none' https://api.carterapi.com/v0/chat; style-src ${webview.cspSource}; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${stylesResetUri}" rel="stylesheet">
				<link href="${stylesMainUri}" rel="stylesheet">

				<title>Carter Chat</title>
			</head>
			<body>
                <div class="top-bar">
				    <img src="${logoUri}" class="logo" />
                    <input type="text" id="key" placeholder="Enter agent Key"/>
				</div>
                <div class="main">
                    <div class="left">
                        <div class="config">
                            <input type="text" id="uuid" placeholder="UUID" value="test-user-id"/>
                            <input type="text" id="endpoint" placeholder="Endpoint" value="https://api.carterapi.com/v0/chat"/>
                        </div>
                        <div class="chat">
                            <input type="text" placeholder="Enter a message..." id="chat"/>
                            <p>Agent Response:</p>
                            <p id="output"></p>
                        </div>
                    </div>
                    <div class="right">
                       
                        <p>Sent</p>
                        <pre id="sent"></pre>
                        <p>Full Response</p>
                        <div id="spin"></div>
                        <pre id="raw"></pre>
                    </div>
                </div>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
    }
}

function getNonce() {
    let text = "";
    const possible =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
