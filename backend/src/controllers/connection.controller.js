import { listConnections, testConnection, importFromPlatform } from '../services/connection.service.js'
import { sendSuccess } from '../utils/apiResponse.js'

export const getList = async (req, res) => sendSuccess(res, { connections: listConnections() }, 'Platform connections retrieved')
export const test = async (req, res) => sendSuccess(res, { connection: await testConnection(req.params.platform) }, 'Connection verified')
export const importPosts = async (req, res) => sendSuccess(res, { import: await importFromPlatform(req.user.id, req.params.platform, req.body) }, 'Live platform data imported', 201)
