export function backupFolderForPage(pageUri: string) {
  return pageUri && `${pageUri.split(".").slice(0, -1).join(".")}/backups/`
}
