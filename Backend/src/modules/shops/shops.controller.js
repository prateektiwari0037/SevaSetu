import { ShopProfile } from '../../models/index.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

export const listShops = async (req, res, next) => {
  try {
    const { category, pincode, search } = req.query;

    const filter = {
      verificationStatus: 'APPROVED',
    };

    if (category) {
      filter.shopCategory = { $regex: category, $options: 'i' };
    }
    if (pincode) {
      filter.pincode = pincode;
    }
    if (search) {
      filter.$or = [
        { shopName: { $regex: search, $options: 'i' } },
        { ownerName: { $regex: search, $options: 'i' } },
        { shopCategory: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
      ];
    }

    const shops = await ShopProfile.find(filter)
      .populate('userId', 'fullName email phone')
      .sort({ createdAt: -1 })
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
    return successResponse(res, 'Shop details retrieved', shop);
  } catch (error) {
    next(error);
  }
};

export const getMyShopProfile = async (req, res, next) => {
  try {
    const shop = await ShopProfile.findOne({ userId: req.user.id })
      .populate('userId', 'fullName email phone')
      .lean();

    if (!shop) return errorResponse(res, 'Shop profile not found', 404);

    shop.id = shop._id.toString();
    return successResponse(res, 'Shop profile retrieved', shop);
  } catch (error) {
    next(error);
  }
};

export const updateMyShopProfile = async (req, res, next) => {
  try {
    const shop = await ShopProfile.findOneAndUpdate(
      { userId: req.user.id },
      { $set: req.body },
      { new: true, returnDocument: 'after' }
    );

    if (!shop) return errorResponse(res, 'Shop profile not found', 404);

    return successResponse(res, 'Shop profile updated', shop);
  } catch (error) {
    next(error);
  }
};

export const getShopCatalog = async (req, res, next) => {
  return successResponse(res, 'Shop catalog retrieved', []);
};

export const addCatalogItem = async (req, res, next) => {
  return successResponse(res, 'Catalog item added', req.body, 201);
};

export const updateCatalogItem = async (req, res, next) => {
  return successResponse(res, 'Catalog item updated', req.body);
};

export const deleteCatalogItem = async (req, res, next) => {
  return successResponse(res, 'Catalog item removed');
};

export const createInquiry = async (req, res, next) => {
  return successResponse(res, 'Inquiry sent successfully', req.body, 201);
};

export const getShopInquiries = async (req, res, next) => {
  return successResponse(res, 'Inquiries retrieved', []);
};
