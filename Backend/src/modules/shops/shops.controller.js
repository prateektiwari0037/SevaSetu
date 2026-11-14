import prisma from '../../config/db.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';
import { calculateDistanceKm } from '../../utils/distance.js';

export const listShops = async (req, res, next) => {
  try {
    const { category, pincode, search, latitude, longitude } = req.query;

    const userLat = latitude ? parseFloat(latitude) : null;
    const userLon = longitude ? parseFloat(longitude) : null;

    const where = {
      isActive: true,
      verificationStatus: 'APPROVED',
      ...(category && { shopCategory: { contains: category, mode: 'insensitive' } }),
      ...(pincode && { pincode }),
      ...(search && {
        OR: [
          { shopName: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { shopCategory: { contains: search, mode: 'insensitive' } },
          { city: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const shops = await prisma.shopProfile.findMany({
      where,
      include: {
        catalogItems: { where: { inStock: true } },
        _count: { select: { catalogItems: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const shopsWithDistance = shops.map((s) => {
      let distanceKm = null;
      if (userLat && userLon && s.latitude && s.longitude) {
        distanceKm = calculateDistanceKm(userLat, userLon, s.latitude, s.longitude);
      }
      return { ...s, distanceKm };
    });

    if (userLat && userLon) {
      shopsWithDistance.sort((a, b) => {
        if (a.distanceKm === null) return 1;
        if (b.distanceKm === null) return -1;
        return a.distanceKm - b.distanceKm;
      });
    }

    return successResponse(res, 'Shops retrieved', shopsWithDistance);
  } catch (error) {
    next(error);
  }
};

export const getShopById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const shop = await prisma.shopProfile.findFirst({
      where: {
        OR: [{ id }, { userId: id }],
      },
      include: {
        catalogItems: true,
      },
    });

    if (!shop) return errorResponse(res, 'Shop not found', 404);

    return successResponse(res, 'Shop details retrieved', shop);
  } catch (error) {
    next(error);
  }
};

export const getMyShopProfile = async (req, res, next) => {
  try {
    const shop = await prisma.shopProfile.findUnique({
      where: { userId: req.user.id },
      include: {
        catalogItems: true,
        inquiries: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!shop) return errorResponse(res, 'Shop profile not found', 404);

    return successResponse(res, 'Shop profile retrieved', shop);
  } catch (error) {
    next(error);
  }
};

export const updateMyShopProfile = async (req, res, next) => {
  try {
    const {
      shopName,
      ownerName,
      shopCategory,
      description,
      bannerUrl,
      address,
      pincode,
      city,
      contactPhone,
      contactEmail,
      openingHours,
      latitude,
      longitude,
    } = req.body;

    const shop = await prisma.shopProfile.update({
      where: { userId: req.user.id },
      data: {
        ...(shopName && { shopName }),
        ...(ownerName && { ownerName }),
        ...(shopCategory && { shopCategory }),
        ...(description !== undefined && { description }),
        ...(bannerUrl !== undefined && { bannerUrl }),
        ...(address && { address }),
        ...(pincode && { pincode }),
        ...(city && { city }),
        ...(contactPhone && { contactPhone }),
        ...(contactEmail !== undefined && { contactEmail }),
        ...(openingHours !== undefined && { openingHours }),
        ...(latitude !== undefined && { latitude: latitude ? parseFloat(latitude) : null }),
        ...(longitude !== undefined && { longitude: longitude ? parseFloat(longitude) : null }),
      },
    });

    return successResponse(res, 'Shop profile updated', shop);
  } catch (error) {
    next(error);
  }
};

export const getShopCatalog = async (req, res, next) => {
  try {
    const shop = await prisma.shopProfile.findUnique({
      where: { userId: req.user.id },
    });
    if (!shop) return errorResponse(res, 'Shop not found', 404);

    const items = await prisma.shopCatalogItem.findMany({
      where: { shopId: shop.id },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(res, 'Catalog items retrieved', items);
  } catch (error) {
    next(error);
  }
};

export const addCatalogItem = async (req, res, next) => {
  try {
    const { name, category, description, price, unit = 'piece', inStock = true, imageUrl } = req.body;

    if (!name || !price) {
      return errorResponse(res, 'Item name and price are required', 400);
    }

    const shop = await prisma.shopProfile.findUnique({
      where: { userId: req.user.id },
    });
    if (!shop) return errorResponse(res, 'Shop profile required', 403);

    const item = await prisma.shopCatalogItem.create({
      data: {
        shopId: shop.id,
        name,
        category: category || shop.shopCategory,
        description,
        price: parseFloat(price),
        unit,
        inStock: inStock === 'false' ? false : Boolean(inStock),
        imageUrl,
      },
    });

    return successResponse(res, 'Catalog item added successfully', item, 201);
  } catch (error) {
    next(error);
  }
};

export const updateCatalogItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, category, description, price, unit, inStock, imageUrl } = req.body;

    const item = await prisma.shopCatalogItem.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(category && { category }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(unit && { unit }),
        ...(inStock !== undefined && { inStock: Boolean(inStock) }),
        ...(imageUrl !== undefined && { imageUrl }),
      },
    });

    return successResponse(res, 'Catalog item updated', item);
  } catch (error) {
    next(error);
  }
};

export const deleteCatalogItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.shopCatalogItem.delete({ where: { id } });
    return successResponse(res, 'Catalog item deleted');
  } catch (error) {
    next(error);
  }
};

export const createInquiry = async (req, res, next) => {
  try {
    const { shopId, customerName, customerPhone, customerEmail, message, itemName } = req.body;

    if (!shopId || !customerName || !customerPhone || !message) {
      return errorResponse(res, 'Shop ID, customer name, phone, and inquiry message are required', 400);
    }

    const inquiry = await prisma.shopInquiry.create({
      data: {
        shopId,
        customerName,
        customerPhone,
        customerEmail,
        message,
        itemName,
        status: 'NEW',
      },
    });

    // Notify shop owner
    const shop = await prisma.shopProfile.findUnique({ where: { id: shopId } });
    if (shop) {
      await prisma.notification.create({
        data: {
          userId: shop.userId,
          title: 'New Customer Inquiry',
          message: `${customerName} asked about ${itemName || 'items'}: "${message}"`,
          type: 'SHOP',
          link: '/shop/inquiries',
        },
      });
    }

    return successResponse(res, 'Inquiry sent to shop owner successfully', inquiry, 201);
  } catch (error) {
    next(error);
  }
};

export const getShopInquiries = async (req, res, next) => {
  try {
    const shop = await prisma.shopProfile.findUnique({
      where: { userId: req.user.id },
    });
    if (!shop) return errorResponse(res, 'Shop not found', 404);

    const inquiries = await prisma.shopInquiry.findMany({
      where: { shopId: shop.id },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(res, 'Shop inquiries retrieved', inquiries);
  } catch (error) {
    next(error);
  }
};
