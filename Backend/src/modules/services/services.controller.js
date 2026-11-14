import prisma from '../../config/db.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

export const getServices = async (req, res, next) => {
  try {
    const { categoryId, categorySlug, search, priceType, minPrice, maxPrice } = req.query;

    const where = {
      isActive: true,
      ...(categoryId && { categoryId }),
      ...(categorySlug && { category: { slug: categorySlug } }),
      ...(priceType && { priceType }),
      ...(minPrice || maxPrice
        ? {
            basePrice: {
              ...(minPrice && { gte: parseFloat(minPrice) }),
              ...(maxPrice && { lte: parseFloat(maxPrice) }),
            },
          }
        : {}),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { category: { name: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    };

    const services = await prisma.service.findMany({
      where,
      include: {
        category: true,
        _count: {
          select: { providerServices: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return successResponse(res, 'Services retrieved', services);
  } catch (error) {
    next(error);
  }
};

export const getServiceByIdOrSlug = async (req, res, next) => {
  try {
    const { id } = req.params;
    const service = await prisma.service.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        category: true,
        providerServices: {
          where: {
            isActive: true,
            provider: { verificationStatus: 'APPROVED', isAvailable: true },
          },
          include: {
            provider: {
              include: {
                user: { select: { id: true, email: true, phone: true } },
              },
            },
          },
        },
      },
    });

    if (!service) {
      return errorResponse(res, 'Service not found', 404);
    }

    return successResponse(res, 'Service details retrieved', service);
  } catch (error) {
    next(error);
  }
};

export const searchServices = async (req, res, next) => {
  try {
    const { q, category, pincode, sortBy = 'rating' } = req.query;

    const where = {
      isActive: true,
      ...(category && {
        category: {
          OR: [{ id: category }, { slug: category }, { name: { contains: category, mode: 'insensitive' } }],
        },
      }),
      ...(q && {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { category: { name: { contains: q, mode: 'insensitive' } } },
        ],
      }),
    };

    const services = await prisma.service.findMany({
      where,
      include: {
        category: true,
        providerServices: {
          where: {
            isActive: true,
            provider: {
              verificationStatus: 'APPROVED',
              ...(pincode && { servicePincode: pincode }),
            },
          },
          include: {
            provider: true,
          },
        },
      },
    });

    return successResponse(res, 'Search results', services);
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
      priceType = 'FIXED',
      estimatedDurationMinutes = 60,
      warrantyDays = 30,
      imageUrl,
      isActive = true,
    } = req.body;

    if (!categoryId || !name || !slug) {
      return errorResponse(res, 'Category ID, name, and slug are required', 400);
    }

    const service = await prisma.service.create({
      data: {
        categoryId,
        name,
        slug: slug.toLowerCase().trim().replace(/\s+/g, '-'),
        description,
        basePrice: parseFloat(basePrice) || 0,
        priceType,
        estimatedDurationMinutes: parseInt(estimatedDurationMinutes) || 60,
        warrantyDays: parseInt(warrantyDays) || 30,
        imageUrl,
        isActive,
      },
      include: { category: true },
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
      priceType,
      estimatedDurationMinutes,
      warrantyDays,
      imageUrl,
      isActive,
    } = req.body;

    const service = await prisma.service.update({
      where: { id },
      data: {
        ...(categoryId && { categoryId }),
        ...(name && { name }),
        ...(slug && { slug: slug.toLowerCase().trim().replace(/\s+/g, '-') }),
        ...(description !== undefined && { description }),
        ...(basePrice !== undefined && { basePrice: parseFloat(basePrice) }),
        ...(priceType && { priceType }),
        ...(estimatedDurationMinutes !== undefined && {
          estimatedDurationMinutes: parseInt(estimatedDurationMinutes),
        }),
        ...(warrantyDays !== undefined && { warrantyDays: parseInt(warrantyDays) }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(isActive !== undefined && { isActive }),
      },
      include: { category: true },
    });

    return successResponse(res, 'Service updated successfully', service);
  } catch (error) {
    next(error);
  }
};

export const deleteService = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.service.delete({ where: { id } });
    return successResponse(res, 'Service deleted successfully');
  } catch (error) {
    next(error);
  }
};
