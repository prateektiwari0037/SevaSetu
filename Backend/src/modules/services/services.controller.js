import { Service, Category, ProviderService } from '../../models/index.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

export const getServices = async (req, res, next) => {
  try {
    const { categoryId, categorySlug, search, minPrice, maxPrice } = req.query;

    const filter = { isActive: true };

    if (categoryId) {
      filter.categoryId = categoryId;
    } else if (categorySlug) {
      const cat = await Category.findOne({ slug: categorySlug });
      if (cat) filter.categoryId = cat._id;
    }

    if (minPrice || maxPrice) {
      filter.basePrice = {};
      if (minPrice) filter.basePrice.$gte = parseFloat(minPrice);
      if (maxPrice) filter.basePrice.$lte = parseFloat(maxPrice);
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const services = await Service.find(filter)
      .populate('categoryId', 'name slug iconUrl')
      .sort({ name: 1 })
      .lean();

    const formatted = services.map((s) => ({
      ...s,
      id: s._id.toString(),
      category: s.categoryId,
    }));

    return successResponse(res, 'Services retrieved', formatted);
  } catch (error) {
    next(error);
  }
};

export const getServiceByIdOrSlug = async (req, res, next) => {
  try {
    const { id } = req.params;
    let service = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      service = await Service.findById(id).populate('categoryId').lean();
    }
    if (!service) {
      service = await Service.findOne({ slug: id }).populate('categoryId').lean();
    }

    if (!service) {
      return errorResponse(res, 'Service not found', 404);
    }

    const providerServices = await ProviderService.find({
      serviceId: service._id,
      isActive: true,
    })
      .populate({
        path: 'providerId',
        match: { verificationStatus: 'APPROVED', isAvailable: true },
        populate: { path: 'userId', select: 'fullName email phone' },
      })
      .lean();

    service.id = service._id.toString();
    service.category = service.categoryId;
    service.providerServices = providerServices.filter((ps) => ps.providerId);

    return successResponse(res, 'Service details retrieved', service);
  } catch (error) {
    next(error);
  }
};

export const searchServices = async (req, res, next) => {
  try {
    const { q, category } = req.query;
    const filter = { isActive: true };

    if (category) {
      const cat = await Category.findOne({
        $or: [{ _id: category.match(/^[0-9a-fA-F]{24}$/) ? category : null }, { slug: category }, { name: { $regex: category, $options: 'i' } }],
      });
      if (cat) filter.categoryId = cat._id;
    }

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
      ];
    }

    const services = await Service.find(filter)
      .populate('categoryId', 'name slug iconUrl')
      .lean();

    const formatted = services.map((s) => ({
      ...s,
      id: s._id.toString(),
      category: s.categoryId,
    }));

    return successResponse(res, 'Search results', formatted);
  } catch (error) {
    next(error);
  }
};

export const createService = async (req, res, next) => {
  try {
    const {
      categoryId,
      name,
      slug,
      description,
      basePrice,
      durationMinutes = 60,
      inclusions = [],
      exclusions = [],
      imageUrl,
      isActive = true,
    } = req.body;

    if (!categoryId || !name || !slug) {
      return errorResponse(res, 'Category ID, name, and slug are required', 400);
    }

    const formattedSlug = slug.toLowerCase().trim().replace(/\s+/g, '-');
    const existing = await Service.findOne({ slug: formattedSlug });
    if (existing) {
      return errorResponse(res, 'Service with this slug already exists', 409);
    }

    const service = await Service.create({
      categoryId,
      name,
      slug: formattedSlug,
      description,
      basePrice: parseFloat(basePrice) || 0,
      durationMinutes: parseInt(durationMinutes) || 60,
      inclusions,
      exclusions,
      imageUrl,
      isActive,
    });

    return successResponse(res, 'Service created successfully', service, 201);
  } catch (error) {
    next(error);
  }
};

export const updateService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      categoryId,
      name,
      slug,
      description,
      basePrice,
      durationMinutes,
      inclusions,
      exclusions,
      imageUrl,
      isActive,
    } = req.body;

    const updateData = {};
    if (categoryId) updateData.categoryId = categoryId;
    if (name) updateData.name = name;
    if (slug) updateData.slug = slug.toLowerCase().trim().replace(/\s+/g, '-');
    if (description !== undefined) updateData.description = description;
    if (basePrice !== undefined) updateData.basePrice = parseFloat(basePrice);
    if (durationMinutes !== undefined) updateData.durationMinutes = parseInt(durationMinutes);
    if (inclusions !== undefined) updateData.inclusions = inclusions;
    if (exclusions !== undefined) updateData.exclusions = exclusions;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (isActive !== undefined) updateData.isActive = isActive;

    const service = await Service.findByIdAndUpdate(id, updateData, { new: true });
    if (!service) {
      return errorResponse(res, 'Service not found', 404);
    }

    return successResponse(res, 'Service updated successfully', service);
  } catch (error) {
    next(error);
  }
};

export const deleteService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const service = await Service.findByIdAndDelete(id);
    if (!service) {
      return errorResponse(res, 'Service not found', 404);
    }
    return successResponse(res, 'Service deleted successfully');
  } catch (error) {
    next(error);
  }
};
