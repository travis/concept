import React from 'react';
import { useLDflexList } from '../hooks/ldflex';
import { backupFolderForPage } from '../utils/backups'
import { ldp } from 'rdf-namespaces';

export default function Backups({page}){
  const backupFolder = backupFolderForPage(page)
  const backups = useLDflexList(`[${backupFolder}][${ldp.contains}]`)
  return (
    <>
      {
        backups && backups.map(backup => (
          <div key={backup}>{backup.value}</div>
        ))
      }
    </>
  )
}
