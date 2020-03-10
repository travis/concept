export function backupFolderForPage(page){
  return page && `${page.split(".").slice(0, -1).join(".")}/backups/`
}
