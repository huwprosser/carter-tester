import * as vscode from "vscode";

export class AgentsProvider implements vscode.TreeDataProvider<TreeItem> {
    constructor() {}

    getTreeItem(element: TreeItem): TreeItem {
        return element;
    }

    getChildren(
        element?: TreeItem | undefined
    ): vscode.ProviderResult<TreeItem[]> {
        // return dummy list
        return Promise.resolve([new TreeItem("Test Tool", "Test Tool")]);
    }
}

class TreeItem extends vscode.TreeItem {
    children: TreeItem[] | undefined;
    agentId?: string;

    constructor(
        label: string,
        agentId: string,
        iconPath?:
            | string
            | vscode.Uri
            | { light: string | vscode.Uri; dark: string | vscode.Uri }
            | vscode.ThemeIcon,
        children?: TreeItem[] | undefined
    ) {
        super(
            label,
            children === undefined
                ? vscode.TreeItemCollapsibleState.None
                : vscode.TreeItemCollapsibleState.Collapsed
        );
        this.agentId = agentId;
        this.iconPath = iconPath;
        this.children = children;
    }
}
