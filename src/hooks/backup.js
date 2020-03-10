import React, {  useEffect, useRef } from 'react'
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

async function ensureBackupFileExists(file, backupFile){
  const exists = await resourceExists(backupFile)
  if (!exists) {
    await createNonExistentDocument(backupFile)
  }
  const backupOf = data[backupFile][concept.backupOf]
  if (!await backupOf) {
    await backupOf.set(namedNode(file))
  }
}

async function ensureBackupFolderExists(backupFolder){
  const metaFile = `${backupFolder}.meta`
  const exists = await resourceExists(metaFile)
  if (!exists) {
    await createNonExistentDocument(metaFile)
  }
}

export async function createBackup(backupFile, value){
  const folder = backupFile.split("/").slice(0, -1).join("/")
  const metaFile = `${folder}/.meta`
  const backupNode = data[backupFile][schema.text]
  await backupNode.set(JSON.stringify(value))
  await data[backupFile][dct.modified].set(literal(new Date().toISOString(), ns.xsd("dateTime")))
  await data.from(metaFile)[backupFile][dct.modified].set(literal(new Date().toISOString(), ns.xsd("dateTime")))
}

async function createBackupInterval(bodyRef, file, backupFile, interval){
  ensureBackupFileExists(file, backupFile)
  return setInterval(async () => {
    await createBackup(backupFile, bodyRef.current)
  }, interval)
}

export function useBackups(page, value){
  const bodyRef = useRef()
  bodyRef.current = value
  const backupFolder = backupFolderForPage(page)
  ensureBackupFolderExists(backupFolder)
  useEffect(() => {
    const one = createBackupInterval(bodyRef, page, `${backupFolder}oneMinute.ttl`, EVERY_MINUTE)
    const five = createBackupInterval(bodyRef, page, `${backupFolder}fiveMinutes.ttl`, EVERY_FIVE_MINUTES)
    const ten = createBackupInterval(bodyRef, page, `${backupFolder}tenMinutes.ttl`, EVERY_TEN_MINUTES)
    const thirty = createBackupInterval(bodyRef, page, `${backupFolder}thirtyMinutes.ttl`, EVERY_THIRTY_MINUTES)
    return () => {
      clearInterval(one)
      clearInterval(five)
      clearInterval(ten)
      clearInterval(thirty)
    }
  }, [bodyRef])
}
