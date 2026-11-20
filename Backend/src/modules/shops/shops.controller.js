import { ShopProfile, Product, ShopInquiry, User } from '../../models/index.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

/**
 * 1. LIST SHOPS (Public discovery with filters & search)
 * GET /api/v1/shops
 */
export const listShops = async (req, res, next) => {
  try {
    const { category, pincode, search, city } = req.query;

    const filter = {
      verificationStatus: 'APPROVED',
      status: 'ACTIVE',
    };

    if (category) {
      filter.shopCategory = { $regex: category, $options: 'i' };
    }
    if (pincode) {
      filter.$or = [{ pincode }, { serviceArea: pincode }];
    }
    if (city) {
      filter.city = { $regex: city, $options: 'i' };
    }
    if (search) {
      filter.$or = [
        { shopName: { $regex: search, $options: 'i' } },
        { ownerName: { $regex: search, $options: 'i' } },
        { shopCategory: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
      ];
    }

    const shops = await ShopProfile.find(filter)
      .populate('userId', 'fullName email phone')
      .sort({ ratingAverage: -1, createdAt: -1 })
      .lean();

    const formatted = shops.map((s) => ({
      ...s,
      id: s._id.toString(),
    }));

    return successResponse(res, 'Shops retrieved', formatted);
  } catch (error) {
    next(error);
  }
};

/**
 * 2. GET SHOP BY ID (Public, includes active products)
 * GET /api/v1/shops/:id
 */
export const getShopById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let shop = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      shop = await ShopProfile.findById(id).populate('userId', 'fullName email phone').lean();
    }
    if (!shop) {
      shop = await ShopProfile.findOne({ userId: id }).populate('userId', 'fullName email phone').lean();
    }

    if (!shop) return errorResponse(res, 'Shop not found', 404);

    shop.id = shop._id.toString();

    // Fetch active products for this shop
    const products = await Product.find({ shopId: shop._id, isActive: true })
      .sort({ inStock: -1, createdAt: -1 })
      .lean();

    shop.products = products.map((p) => ({
      ...p,
      id: p._id.toString(),
    }));

    return successResponse(res, 'Shop details retrieved', shop);
  } catch (error) {
    next(error);
  }
};

/**
 * 3. GET MY SHOP PROFILE (Shop Owner)
 * GET /api/v1/shops/me
 */
export const getMyShopProfile = async (req, res, next) => {
  try {
    let shop = await ShopProfile.findOne({
      $or: [{ userId: req.user.id }, { ownerId: req.user.id }],
    })
      .populate('userId', 'fullName email phone')
      .lean();

    if (!shop) {
      // Auto-initialize if registered as SHOP_OWNER
      if (req.user.role === 'SHOP_OWNER') {
        const newShop = await ShopProfile.create({
          userId: req.user.id,
          ownerId: req.user.id,
          shopName: `${req.user.fullName || 'My'} Store`,
          ownerName: req.user.fullName || 'Merchant',
          contact: { phone: req.user.phone || '', email: req.user.email || '' },
          contactPhone: req.user.phone || '',
          verificationStatus: 'PENDING_VERIFICATION',
        });
        shop = newShop.toObject();
      } else {
        return errorResponse(res, 'Shop profile not found', 404);
      }
    }

    shop.id = shop._id.toString();
    return successResponse(res, 'Shop profile retrieved', shop);
  } catch (error) {
    next(error);
  }
};

/**
 * 4. UPDATE MY SHOP PROFILE (Shop Owner)
 * PATCH /api/v1/shops/me
 */
export const updateMyShopProfile = async (req, res, next) => {
  try {
    const updates = { ...req.body };
    delete updates._id;
    delete updates.userId;
    delete updates.ownerId;
    delete updates.verificationStatus; // Only admin can approve

    const shop = await ShopProfile.findOneAndUpdate(
      { $or: [{ userId: req.user.id }, { ownerId: req.user.id }] },
      { $set: updates },
      { new: true, returnDocument: 'after' }
    );

    if (!shop) return errorResponse(res, 'Shop profile not found', 404);

    return successResponse(res, 'Shop profile updated', shop);
  } catch (error) {
    next(error);
  }
};

/**
 * 5. GET SHOP PRODUCTS (Shop Owner)
 * GET /api/v1/shops/me/products
 */
export const getMyShopProducts = async (req, res, next) => {
  try {
    const shop = await ShopProfile.findOne({
      $or: [{ userId: req.user.id }, { ownerId: req.user.id }],
    });
    if (!shop) return errorResponse(res, 'Shop profile not found', 404);

    const { category, search, stockStatus } = req.query;
    const filter = { shopId: shop._id, isActive: true };

    if (category) filter.category = category;
    if (stockStatus) filter.stockStatus = stockStatus;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const products = await Product.find(filter).sort({ createdAt: -1 }).lean();

    const formatted = products.map((p) => ({
      ...p,
      id: p._id.toString(),
    }));

    return successResponse(res, 'Shop products retrieved', formatted);
  } catch (error) {
    next(error);
  }
};

/**
 * 6. CREATE SHOP PRODUCT (Shop Owner)
 * POST /api/v1/shops/me/products
 */
export const createShopProduct = async (req, res, next) => {
  try {
    const shop = await ShopProfile.findOne({
      $or: [{ userId: req.user.id }, { ownerId: req.user.id }],
    });
    if (!shop) return errorResponse(res, 'Shop profile not found', 404);

    const {
      name,
      description = '',
      category = 'General Hardware',
      price,
      unit = 'piece',
      stockStatus = 'IN_STOCK',
      inStock = true,
      images = [],
    } = req.body;

    if (!name || price === undefined) {
      return errorResponse(res, 'Product name and price are required', 400);
    }

    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) {
      return errorResponse(res, 'Valid positive price is required', 400);
    }

    const calculatedStockStatus =
      stockStatus || (inStock === false ? 'OUT_OF_STOCK' : 'IN_STOCK');

    const product = await Product.create({
      shopId: shop._id,
      name: name.trim(),
      description: description.trim(),
      category: category.trim(),
      price: numPrice,
      priceInPaise: Math.round(numPrice * 100),
      unit,
      stockStatus: calculatedStockStatus,
      inStock: calculatedStockStatus === 'IN_STOCK' || calculatedStockStatus === 'LIMITED_STOCK',
      images,
      isActive: true,
    });

    const responseData = product.toObject();
    responseData.id = product._id.toString();

    return successResponse(res, 'Product created successfully', responseData, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * 7. UPDATE SHOP PRODUCT (Shop Owner with Ownership Check)
 * PATCH /api/v1/shops/me/products/:id
 */
export const updateShopProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const shop = await ShopProfile.findOne({
      $or: [{ userId: req.user.id }, { ownerId: req.user.id }],
    });
    if (!shop) return errorResponse(res, 'Shop profile not found', 404);

    const product = await Product.findOne({ _id: id, shopId: shop._id });
    if (!product) {
      return errorResponse(res, 'Product not found or unauthorized access', 404);
    }

    const { name, description, category, price, unit, stockStatus, inStock, images } = req.body;

    if (name !== undefined) product.name = name.trim();
    if (description !== undefined) product.description = description.trim();
    if (category !== undefined) product.category = category.trim();
    if (unit !== undefined) product.unit = unit;
    if (images !== undefined) product.images = images;

    if (price !== undefined) {
      const numPrice = parseFloat(price);
      if (!isNaN(numPrice) && numPrice >= 0) {
        product.price = numPrice;
        product.priceInPaise = Math.round(numPrice * 100);
      }
    }

    if (stockStatus !== undefined) {
      product.stockStatus = stockStatus;
      product.inStock = stockStatus === 'IN_STOCK' || stockStatus === 'LIMITED_STOCK';
    } else if (inStock !== undefined) {
      product.inStock = Boolean(inStock);
      product.stockStatus = product.inStock ? 'IN_STOCK' : 'OUT_OF_STOCK';
    }

    await product.save();

    const responseData = product.toObject();
    responseData.id = product._id.toString();

    return successResponse(res, 'Product updated successfully', responseData);
  } catch (error) {
    next(error);
  }
};

/**
 * 8. DELETE SHOP PRODUCT (Shop Owner with Ownership Check)
 * DELETE /api/v1/shops/me/products/:id
 */
export const deleteShopProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const shop = await ShopProfile.findOne({
      $or: [{ userId: req.user.id }, { ownerId: req.user.id }],
    });
    if (!shop) return errorResponse(res, 'Shop profile not found', 404);

    const product = await Product.findOne({ _id: id, shopId: shop._id });
    if (!product) {
      return errorResponse(res, 'Product not found or unauthorized access', 404);
    }

    // Soft delete product by marking isActive false or hard delete
    await Product.deleteOne({ _id: id, shopId: shop._id });

    return successResponse(res, 'Product removed successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * 9. CREATE SHOP INQUIRY (Customer Action)
 * POST /api/v1/shops/:id/inquiries & POST /api/v1/shops/inquiries
 */
export const createShopInquiry = async (req, res, next) => {
  try {
    const targetShopId = req.params.id || req.body.shopId;
    const { customerName, customerPhone, customerEmail, message, itemName, productId } = req.body;

    if (!targetShopId || !customerName || !customerPhone || !message) {
      return errorResponse(res, 'Shop ID, your name, phone number, and message are required', 400);
    }

    const shop = await ShopProfile.findById(targetShopId);
    if (!shop) return errorResponse(res, 'Shop not found', 404);

    const inquiry = await ShopInquiry.create({
      shopId: shop._id,
      userId: req.user?.id || null,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: (customerEmail || '').trim(),
      message: message.trim(),
      itemName: (itemName || '').trim(),
      productId: productId || null,
      status: 'PENDING',
    });

    const responseData = inquiry.toObject();
    responseData.id = inquiry._id.toString();

    return successResponse(res, 'Inquiry sent to store successfully', responseData, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * 10. GET SHOP INQUIRIES (Shop Owner with Ownership Check)
 * GET /api/v1/shops/me/inquiries
 */
export const getMyShopInquiries = async (req, res, next) => {
  try {
    const shop = await ShopProfile.findOne({
      $or: [{ userId: req.user.id }, { ownerId: req.user.id }],
    });
    if (!shop) return errorResponse(res, 'Shop profile not found', 404);

    const inquiries = await ShopInquiry.find({ shopId: shop._id })
      .populate('productId', 'name price images')
      .sort({ createdAt: -1 })
      .lean();

    const formatted = inquiries.map((inq) => ({
      ...inq,
      id: inq._id.toString(),
    }));

    return successResponse(res, 'Shop inquiries retrieved', formatted);
  } catch (error) {
    next(error);
  }
};
