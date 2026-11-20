import { Category, Service, Booking } from '../../models/index.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

export const getCategories = async (req, res, next) => {
  try {
    const { includeInactive } = req.query;
    const filter = includeInactive === 'true' ? {} : { isActive: true };

    const categories = await Category.find(filter).sort({ displayOrder: 1 }).lean();

    // Map service counts
    const categoryIds = categories.map((c) => c._id);
    const serviceCounts = await Service.aggregate([
      { $match: { categoryId: { $in: categoryIds }, isActive: true } },
      { $group: { _id: '$categoryId', count: { $sum: 1 } } },
    ]);

    const countMap = {};
    serviceCounts.forEach((s) => {
      countMap[s._id.toString()] = s.count;
    });

    const enriched = categories.map((c) => ({
      ...c,
      id: c._id.toString(),
      _count: {
        services: countMap[c._id.toString()] || 0,
      },
    }));

    return successResponse(res, 'Categories retrieved', enriched);
  } catch (error) {
    next(error);
  }
};

export const getCategoryByIdOrSlug = async (req, res, next) => {
  try {
    const { id } = req.params;
    let category = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      category = await Category.findById(id).lean();
    }
    if (!category) {
      category = await Category.findOne({ slug: id }).lean();
    }

    if (!category) {
      return errorResponse(res, 'Category not found', 404);
    }

    const services = await Service.find({
      categoryId: category._id,
      isActive: true,
    }).lean();

    category.id = category._id.toString();
    category.services = services.map((s) => ({
      ...s,
      id: s._id.toString(),
    }));

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

    const formattedSlug = slug.toLowerCase().trim().replace(/\s+/g, '-');
    const existing = await Category.findOne({ slug: formattedSlug });
    if (existing) {
      return errorResponse(res, 'Category with this slug already exists', 409);
    }

    const category = await Category.create({
      name,
      slug: formattedSlug,
      description,
      iconUrl,
      imageUrl,
      displayOrder: displayOrder ? parseInt(displayOrder) : 0,
      isActive: isActive !== undefined ? isActive : true,
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

    const updateData = {};
    if (name) updateData.name = name;
    if (slug) updateData.slug = slug.toLowerCase().trim().replace(/\s+/g, '-');
    if (description !== undefined) updateData.description = description;
    if (iconUrl !== undefined) updateData.iconUrl = iconUrl;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (displayOrder !== undefined) updateData.displayOrder = parseInt(displayOrder);
    if (isActive !== undefined) updateData.isActive = isActive;

    const category = await Category.findByIdAndUpdate(id, updateData, { new: true });
    if (!category) {
      return errorResponse(res, 'Category not found', 404);
    }

    return successResponse(res, 'Category updated successfully', category);
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if category exists
    const category = await Category.findById(id);
    if (!category) {
      return errorResponse(res, 'Category not found', 404);
    }

    // Check if any services in this category are referenced by historical bookings
    const services = await Service.find({ categoryId: category._id });
    const serviceIds = services.map((s) => s._id);

    const historicalBookingsCount = await Booking.countDocuments({
      serviceId: { $in: serviceIds },
    });

    if (historicalBookingsCount > 0) {
      // PRD Section 5: Avoid deleting categories referenced by historical bookings
      // Instead, disable category to preserve data integrity
      category.isActive = false;
      await category.save();
      return successResponse(
        res,
        `Category is referenced by ${historicalBookingsCount} historical booking(s). It has been disabled instead of deleted to protect order history integrity.`,
        category
      );
    }

    await Category.findByIdAndDelete(id);
    return successResponse(res, 'Category deleted successfully');
  } catch (error) {
    next(error);
  }
};
