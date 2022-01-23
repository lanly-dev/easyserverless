import { ExtensionContext, commands, Uri } from 'vscode'
import Converter from './converter'

export function activate(context: ExtensionContext) {
  const rc = commands.registerCommand
  console.log('$$$$$$$$$$$')
  Converter.download()
  context.subscriptions.concat([
    rc('emc.convertMp3', (uri: Uri) => Converter.convert(uri, 'mp3')),
    rc('emc.convertMp4', (uri: Uri) => Converter.convert(uri, 'mp3')),
    rc('emc.convertLocalMp3', (uri: Uri) => Converter.convertLocal(uri, 'mp4')),
    rc('emc.convertLocalMp4', (uri: Uri) => Converter.convertLocal(uri, 'mp4'))
  ])
}

export function deactivate() { }
