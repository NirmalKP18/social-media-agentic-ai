import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { config } from '../config/env.js'
import { HttpError } from '../utils/httpError.js'

export const protect = async (req, res, next) => {
  const header = req.headers.authorization

  if (!header || !header.startsWith('Bearer ')) {
    throw new HttpError('Authentication token is required', 401)
  }

  const token = header.split(' ')[1]

  let decoded
  try {
    decoded = jwt.verify(token, config.jwt.secret)
  } catch (error) {
    throw new HttpError('Invalid or expired token', 401)
  }

  const user = await User.findById(decoded.id)
  if (!user) {
    throw new HttpError('User not found', 401)
  }

  req.user = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  }

  next()
}

export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    throw new HttpError('Administrator access is required', 403)
  }

  next()
}

export const authenticate = protect

export const authorize = (...roles) => (req, res, next) => {
  if (!req.user || (roles.length > 0 && !roles.includes(req.user.role))) {
    throw new HttpError('Forbidden: Insufficient privileges', 403)
  }
  next()
}