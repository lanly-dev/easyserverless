import { ExtensionContext, commands } from 'vscode'

export function activate(context: ExtensionContext) {
  let disposable = commands.registerCommand('emc.convert', () => {
  })

  context.subscriptions.push(disposable)
}

export function deactivate() { }
