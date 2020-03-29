import { Page } from './model'

export function backupFolderForPage(page: Page) {
  return page.uri && `${page.uri.split(".").slice(0, -1).join(".")}/backups/`
}
