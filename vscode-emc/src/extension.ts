import { ExtensionContext, commands } from 'vscode'
import Converter from './converter'

export function activate(context: ExtensionContext) {
  const rc = commands.registerCommand
  context.subscriptions.concat([
    rc('emc.convertMp3', (path: string) => Converter.convert(path)),
    rc('emc.convertMp4', (path: string) => Converter.convert(path)),
    rc('emc.convertLocalMp3', (path: string) => Converter.convertLocal(path)),
    rc('emc.convertLocalMp4', (path: string) => Converter.convertLocal(path))
  ])
}

export function deactivate() { }
