import {  useEffect, useRef } from 'react'
import { schema, dct } from 'rdf-namespaces';
import solidNamespace from 'solid-namespace';
import data from '@solid/query-ldflex';
import { resourceExists, createNonExistentDocument } from '../utils/ldflex-helper'
import { backupFolderForPage } from '../utils/backups'
import concept from '../ontology'
import {namedNode, literal} from '@rdfjs/data-model';

const ns = solidNamespace()

const EVERY_MINUTE = 60 * 1000
const EVERY_FIVE_MINUTES = 5 * EVERY_MINUTE
const EVERY_TEN_MINUTES = 10 * EVERY_MINUTE
const EVERY_THIRTY_MINUTES = 30 * EVERY_MINUTE

async function ensureBackupFileExists(original, backup){
  const exists = await resourceExists(backup)
  if (!exists) {
    await createNonExistentDocument(backup)
  }
  const backupOf = data[backup][concept.backupOf]
  if (!await backupOf) {
    await backupOf.set(namedNode(original))
  }
}

async function ensureBackupFolderExists(backupFolder){
  const metaFile = `${backupFolder}.meta`
  const exists = await resourceExists(metaFile)
  if (!exists) {
    await createNonExistentDocument(metaFile)
  }
}

export async function createBackup(page, backupFile, value){
  const folder = backupFolderForPage(page)
  const metaFile = `${folder}.meta`
  const backup = `${folder}${backupFile}`
  await ensureBackupFileExists(page, backup)
  await data[backup][schema.text].set(value)
  await data[backup][dct.modified].set(literal(new Date().toISOString(), ns.xsd("dateTime")))
  await data.from(metaFile)[backup][dct.modified].set(literal(new Date().toISOString(), ns.xsd("dateTime")))
}

function createBackupInterval(bodyRef, file, backupFile, interval){
  return setInterval(async () => {
    if (bodyRef.current !== undefined){
      await createBackup(file, backupFile, JSON.stringify(bodyRef.current))
    }
  }, interval)
}

export function useBackups(page, value){
  const bodyRef = useRef()
  bodyRef.current = value
  useEffect(() => {
    const backupFolder = backupFolderForPage(page)
    ensureBackupFolderExists(backupFolder)
    const one = createBackupInterval(bodyRef, page, `oneMinute.ttl`, EVERY_MINUTE)
    const five = createBackupInterval(bodyRef, page, `fiveMinutes.ttl`, EVERY_FIVE_MINUTES)
    const ten = createBackupInterval(bodyRef, page, `tenMinutes.ttl`, EVERY_TEN_MINUTES)
    const thirty = createBackupInterval(bodyRef, page, `thirtyMinutes.ttl`, EVERY_THIRTY_MINUTES)
    return () => {
      clearInterval(one)
      clearInterval(five)
      clearInterval(ten)
      clearInterval(thirty)
    }
  }, [page, bodyRef])
}
