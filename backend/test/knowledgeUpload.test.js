import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getUploadText, isSupportedUploadName } from '../src/services/knowledge.service.js'
import { HttpError } from '../src/utils/httpError.js'

const fileFor = (name, content) => ({
  originalname: name,
  size: Buffer.byteLength(content, 'utf8'),
  buffer: Buffer.from(content, 'utf8'),
})

const expectHttpError = (fn, status) => {
  assert.throws(fn, (error) => error instanceof HttpError && error.status === status)
}

test('getUploadText extracts plain text from a .txt file', () => {
  const { text } = getUploadText(fileFor('policy.txt', 'Refunds within 30 days.'))
  assert.equal(text, 'Refunds within 30 days.')
})

test('getUploadText extracts text from a .md file', () => {
  const { text } = getUploadText(fileFor('guide.md', '# Title\nBody text.'))
  assert.match(text, /Body text\./)
})

test('getUploadText extracts text from a {title,text} JSON file', () => {
  const { text } = getUploadText(fileFor('policy.json', JSON.stringify({ title: 'Refunds', text: 'Full refunds within 30 days.' })))
  assert.equal(text, 'Full refunds within 30 days.')
})

test('getUploadText extracts text from a list-of-strings JSON file', () => {
  const { text } = getUploadText(fileFor('faq.json', JSON.stringify(['Line one.', 'Line two.'])))
  assert.match(text, /Line one\./)
  assert.match(text, /Line two\./)
})

test('getUploadText rejects unsupported extensions', () => {
  expectHttpError(() => getUploadText(fileFor('scan.pdf', '%PDF fake')), 400)
  expectHttpError(() => getUploadText(fileFor('notes.docx', 'content')), 400)
})

test('getUploadText rejects an empty file', () => {
  expectHttpError(() => getUploadText(fileFor('notes.txt', '   ')), 400)
})

test('getUploadText rejects a file over the upload limit', () => {
  expectHttpError(() => getUploadText(fileFor('big.txt', 'x'.repeat(11)), 10), 413)
})

test('getUploadText rejects a JSON file with no readable text', () => {
  expectHttpError(() => getUploadText(fileFor('data.json', JSON.stringify({ x: 1 }))), 400)
})

test('getUploadText rejects a missing file buffer', () => {
  expectHttpError(() => getUploadText(null), 400)
})

test('isSupportedUploadName accepts only txt, md and json', () => {
  assert.equal(isSupportedUploadName('refunds.txt'), true)
  assert.equal(isSupportedUploadName('refunds.md'), true)
  assert.equal(isSupportedUploadName('refunds.JSON'), true)
  assert.equal(isSupportedUploadName('refunds.pdf'), false)
  assert.equal(isSupportedUploadName('refunds'), false)
})