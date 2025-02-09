import * as vscode from "vscode";
import { outputChannel } from "./outputChannel";
import { getAllPropertyKeys } from "./utils";

export class PropertiesQuickFixProvider implements vscode.CodeActionProvider {
  public provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range
  ): vscode.ProviderResult<vscode.CodeAction[]> {
    outputChannel.appendLine(
      `🔍 クイックフィックスを検出 - 対象範囲: ${range.start.line}:${range.start.character}`
    );

    // 🔍 診断情報の取得
    const diagnostics = vscode.languages
      .getDiagnostics(document.uri)
      .filter(
        (diag) =>
          diag.code === "undefinedMessageKey" && diag.range.intersection(range)
      );

    if (diagnostics.length === 0) {
      outputChannel.appendLine(`⚠️ 対象の診断情報が見つかりません`);
      return;
    }

    const key = document.getText(range).trim().replace(/"/g, ""); // ✅ 余計なスペース削除
    outputChannel.appendLine(`🔍 対象のメッセージキー: ${key}`);

    const actions: vscode.CodeAction[] = [];

    // ✅ メッセージキーを messages.properties に追加
    const addAction = new vscode.CodeAction(
      `💾 "${key}" を messages.properties に追加`,
      vscode.CodeActionKind.QuickFix
    );
    addAction.command = {
      command: "java-i18n-ally.addPropertyKey",
      title: "メッセージキーを追加",
      arguments: [key.trim()], // ✅ 余計なスペース削除
    };
    actions.push(addAction);
    outputChannel.appendLine(
      `✅ クイックフィックス: "${key}" を messages.properties に追加`
    );

    // ✅ 既存のメッセージキーから提案
    const existingKeys = getAllPropertyKeys();
    for (const existingKey of existingKeys) {
      const trimmedKey = existingKey.trim(); // ✅ 余計なスペース削除
      if (trimmedKey.includes(key) || key.includes(trimmedKey)) {
        const replaceAction = new vscode.CodeAction(
          `🔄 "${key}" を "${trimmedKey}" に変更`,
          vscode.CodeActionKind.QuickFix
        );
        replaceAction.edit = new vscode.WorkspaceEdit();
        replaceAction.edit.replace(document.uri, range, `"${trimmedKey}"`);
        actions.push(replaceAction);
        outputChannel.appendLine(
          `✅ クイックフィックス: "${key}" を "${trimmedKey}" に置換`
        );
      }
    }

    return actions;
  }
}
