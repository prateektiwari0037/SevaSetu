import prisma from '../../config/db.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

export const getCategories = async (req, res, next) => {
  try {
    const { includeInactive } = req.query;
    const where = includeInactive === 'true' ? {} : { isActive: true };

    const categories = await prisma.category.findMany({
      where,
      include: {
        _count: {
          select: { services: true },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });

    return successResponse(res, 'Categories retrieved', categories);
  } catch (error) {
    next(error);
  }
};

export const getCategoryByIdOrSlug = async (req, res, next) => {
  try {
    const { id } = req.params;
    const category = await prisma.category.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        services: {
          where: { isActive: true },
          include: {
            _count: {
              select: { providerServices: true },
            },
          },
        },
      },
    });

    if (!category) {
      return errorResponse(res, 'Category not found', 404);
    }

    return successResponse(res, 'Category details retrieved', category);
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const { name, slug, description, iconUrl, imageUrl, displayOrder, isActive } = req.body;
    if (!name || !slug) {
      return errorResponse(res, 'Category name and slug are required', 400);
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug: slug.toLowerCase().trim().replace(/\s+/g, '-'),
        description,
        iconUrl,
        imageUrl,
        displayOrder: displayOrder ? parseInt(displayOrder) : 0,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return successResponse(res, 'Category created successfully', category, 201);
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, slug, description, iconUrl, imageUrl, displayOrder, isActive } = req.body;

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(slug && { slug: slug.toLowerCase().trim().replace(/\s+/g, '-') }),
        ...(description !== undefined && { description }),
        ...(iconUrl !== undefined && { iconUrl }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(displayOrder !== undefined && { displayOrder: parseInt(displayOrder) }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return successResponse(res, 'Category updated successfully', category);
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.category.delete({ where: { id } });
    return successResponse(res, 'Category deleted successfully');
  } catch (error) {
    next(error);
  }
};
