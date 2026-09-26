import * as brandService from '../services/brand.service.js'

export const getBrands = async (req, res, next) => {
  try {
    const brands = await brandService.getBrands(req.user.id)
    res.json({ success: true, data: { brands } })
  } catch (err) {
    next(err)
  }
}

export const getBrandById = async (req, res, next) => {
  try {
    const result = await brandService.getBrandById(req.user.id, req.params.id)
    res.json({ success: true, data: result })
  } catch (err) {
    next(err)
  }
}

export const createBrand = async (req, res, next) => {
  try {
    const brand = await brandService.createBrand(req.user.id, req.body)
    res.status(201).json({ success: true, data: { brand } })
  } catch (err) {
    next(err)
  }
}

export const updateBrand = async (req, res, next) => {
  try {
    const brand = await brandService.updateBrand(req.user.id, req.params.id, req.body)
    res.json({ success: true, data: { brand } })
  } catch (err) {
    next(err)
  }
}

export const deleteBrand = async (req, res, next) => {
  try {
    const result = await brandService.deleteBrand(req.user.id, req.params.id)
    res.json({ success: true, data: result })
  } catch (err) {
    next(err)
  }
}

export const runBrandPipeline = async (req, res, next) => {
  try {
    const result = await brandService.runBrandMonitoringPipeline(req.user.id, req.params.id)
    res.json({ success: true, data: result })
  } catch (err) {
    next(err)
  }
}
