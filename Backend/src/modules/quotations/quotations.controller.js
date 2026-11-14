import crypto from 'crypto';
import prisma from '../../config/db.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

export const createServiceRequest = async (req, res, next) => {
  try {
    const { serviceId, title, description, address, pincode, preferredDate, preferredTimeSlot } =
      req.body;

    if (!serviceId || !title || !description || !address || !preferredDate) {
      return errorResponse(res, 'All fields are required to request quotations', 400);
    }

    const customer = await prisma.customerProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!customer) {
      return errorResponse(res, 'Customer profile required', 400);
    }

    const requestNumber = `REQ-${Date.now().toString().slice(-6)}-${crypto.randomInt(100, 999)}`;

    const request = await prisma.serviceRequest.create({
      data: {
        requestNumber,
        customerId: customer.id,
        serviceId,
        title,
        description,
        address,
        pincode: pincode || '400001',
        preferredDate: new Date(preferredDate),
        preferredTimeSlot: preferredTimeSlot || 'Morning 10 AM - 1 PM',
        status: 'OPEN',
      },
      include: {
        service: true,
        customer: true,
      },
    });

    // Notify approved providers in this service category
    const eligibleProviders = await prisma.providerProfile.findMany({
      where: {
        verificationStatus: 'APPROVED',
        isAvailable: true,
        services: { some: { serviceId } },
      },
    });

    if (eligibleProviders.length > 0) {
      await prisma.notification.createMany({
        data: eligibleProviders.map((p) => ({
          userId: p.userId,
          title: 'New Service Request For Quotation',
          message: `A customer requested quotations for ${request.service.name}: "${title}". Submit your quote now.`,
          type: 'QUOTATION',
          link: `/provider/quotations`,
        })),
      });
    }

    return successResponse(res, 'Quotation request created successfully', request, 201);
  } catch (error) {
    next(error);
  }
};

export const getServiceRequests = async (req, res, next) => {
  try {
    const { status, serviceId } = req.query;

    let where = {
      ...(status && { status }),
      ...(serviceId && { serviceId }),
    };

    if (req.user.role === 'CUSTOMER') {
      const customer = await prisma.customerProfile.findUnique({
        where: { userId: req.user.id },
      });
      if (!customer) return successResponse(res, 'Requests', []);
      where.customerId = customer.id;
    } else if (req.user.role === 'PROVIDER') {
      // Providers see open requests for their services
      const provider = await prisma.providerProfile.findUnique({
        where: { userId: req.user.id },
        include: { services: true },
      });
      if (!provider) return successResponse(res, 'Requests', []);
      const serviceIds = provider.services.map((s) => s.serviceId);

      where = {
        ...where,
        serviceId: { in: serviceIds },
      };
    }

    const requests = await prisma.serviceRequest.findMany({
      where,
      include: {
        service: { include: { category: true } },
        customer: true,
        quotations: {
          include: {
            provider: true,
          },
        },
        _count: { select: { quotations: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(res, 'Service requests retrieved', requests);
  } catch (error) {
    next(error);
  }
};

export const getServiceRequestById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const request = await prisma.serviceRequest.findFirst({
      where: {
        OR: [{ id }, { requestNumber: id }],
      },
      include: {
        service: { include: { category: true } },
        customer: true,
        quotations: {
          include: {
            provider: {
              include: {
                user: { select: { phone: true, email: true } },
              },
            },
          },
          orderBy: { quotedAmount: 'asc' },
        },
      },
    });

    if (!request) return errorResponse(res, 'Service request not found', 404);

    return successResponse(res, 'Service request retrieved', request);
  } catch (error) {
    next(error);
  }
};

export const submitQuotation = async (req, res, next) => {
  try {
    const { serviceRequestId, quotedAmount, estimatedDuration, notes, validUntil } = req.body;

    if (!serviceRequestId || !quotedAmount || !estimatedDuration) {
      return errorResponse(res, 'Service request ID, quoted amount, and estimated duration are required', 400);
    }

    const provider = await prisma.providerProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!provider) return errorResponse(res, 'Only registered service providers can submit quotations', 403);
    if (provider.verificationStatus !== 'APPROVED') {
      return errorResponse(res, 'Only admin-verified providers can submit quotations', 403);
    }

    const request = await prisma.serviceRequest.findUnique({
      where: { id: serviceRequestId },
      include: { customer: true, service: true },
    });

    if (!request) return errorResponse(res, 'Service request not found', 404);
    if (request.status !== 'OPEN' && request.status !== 'QUOTED') {
      return errorResponse(res, `Cannot quote on this request as it is currently ${request.status}`, 400);
    }

    // Upsert quotation
    const quotation = await prisma.$transaction(async (tx) => {
      const q = await tx.quotation.upsert({
        where: {
          serviceRequestId_providerId: {
            serviceRequestId,
            providerId: provider.id,
          },
        },
        update: {
          quotedAmount: parseFloat(quotedAmount),
          estimatedDuration,
          notes,
          validUntil: validUntil ? new Date(validUntil) : null,
          status: 'PENDING',
        },
        create: {
          serviceRequestId,
          providerId: provider.id,
          quotedAmount: parseFloat(quotedAmount),
          estimatedDuration,
          notes,
          validUntil: validUntil ? new Date(validUntil) : null,
          status: 'PENDING',
        },
      });

      // Update request status to QUOTED
      await tx.serviceRequest.update({
        where: { id: serviceRequestId },
        data: { status: 'QUOTED' },
      });

      // Notify customer
      await tx.notification.create({
        data: {
          userId: request.customer.userId,
          title: 'New Quotation Received!',
          message: `${provider.fullName} quoted ₹${quotedAmount} for your request "${request.title}".`,
          type: 'QUOTATION',
          link: `/customer/quotations/${serviceRequestId}`,
        },
      });

      return q;
    });

    return successResponse(res, 'Quotation submitted successfully', quotation, 201);
  } catch (error) {
    next(error);
  }
};

export const getQuotationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        provider: true,
        serviceRequest: {
          include: { service: true, customer: true },
        },
      },
    });

    if (!quotation) return errorResponse(res, 'Quotation not found', 404);

    return successResponse(res, 'Quotation retrieved', quotation);
  } catch (error) {
    next(error);
  }
};

export const selectQuotation = async (req, res, next) => {
  try {
    const { id } = req.params; // quotationId

    const customer = await prisma.customerProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!customer) return errorResponse(res, 'Customer profile required', 403);

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        provider: true,
        serviceRequest: {
          include: { customer: true, service: true },
        },
      },
    });

    if (!quotation) return errorResponse(res, 'Quotation not found', 404);
    if (quotation.serviceRequest.customerId !== customer.id) {
      return errorResponse(res, 'You are not authorized to select a quotation for this request', 403);
    }
    if (quotation.serviceRequest.status === 'CONFIRMED') {
      return errorResponse(res, 'A quotation has already been selected for this request', 400);
    }

    // Transactional selection:
    // 1. Mark this quotation as SELECTED
    // 2. Mark other quotations for this request as NOT_SELECTED
    // 3. Update serviceRequest status to CONFIRMED and set selectedQuotationId
    // 4. Create confirmed Booking automatically
    const result = await prisma.$transaction(async (tx) => {
      // 1. Mark selected
      const selectedQuote = await tx.quotation.update({
        where: { id },
        data: { status: 'SELECTED' },
      });

      // 2. Mark others
      await tx.quotation.updateMany({
        where: {
          serviceRequestId: quotation.serviceRequestId,
          id: { not: id },
        },
        data: { status: 'NOT_SELECTED' },
      });

      // 3. Update request
      await tx.serviceRequest.update({
        where: { id: quotation.serviceRequestId },
        data: {
          status: 'CONFIRMED',
          selectedQuotationId: id,
        },
      });

      // 4. Create confirmed booking
      const bookingNumber = `BK-${Date.now().toString().slice(-6)}-${crypto.randomInt(100, 999)}`;
      const newBooking = await tx.booking.create({
        data: {
          bookingNumber,
          customerId: customer.id,
          providerId: quotation.providerId,
          serviceId: quotation.serviceRequest.serviceId,
          serviceRequestId: quotation.serviceRequestId,
          quotationId: id,
          bookingType: 'NORMAL',
          status: 'ACCEPTED', // confirmed directly via quotation
          problemDescription: `${quotation.serviceRequest.title}: ${quotation.serviceRequest.description}`,
          bookingDate: quotation.serviceRequest.preferredDate,
          timeSlot: quotation.serviceRequest.preferredTimeSlot,
          serviceAddress: quotation.serviceRequest.address,
          addressPincode: quotation.serviceRequest.pincode,
          totalAmount: quotation.quotedAmount,
          paymentMethod: 'CASH',
        },
      });

      // Status history
      await tx.bookingStatusHistory.create({
        data: {
          bookingId: newBooking.id,
          status: 'ACCEPTED',
          comment: `Confirmed via multiple quotation selection (Quotation #${id.slice(0, 8)}). Quoted: ₹${quotation.quotedAmount}`,
          changedByUserId: req.user.id,
        },
      });

      // Notify winning provider
      await tx.notification.create({
        data: {
          userId: quotation.provider.userId,
          title: '🎉 Quotation Selected! Booking Confirmed',
          message: `Congratulations! The customer has accepted your quotation of ₹${quotation.quotedAmount} for "${quotation.serviceRequest.title}". Booking #${bookingNumber} is created.`,
          type: 'QUOTATION',
          link: `/provider/bookings/${newBooking.id}`,
        },
      });

      return { booking: newBooking, quotation: selectedQuote };
    });

    return successResponse(res, 'Quotation selected and booking confirmed successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getProviderQuotations = async (req, res, next) => {
  try {
    const provider = await prisma.providerProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!provider) return errorResponse(res, 'Provider profile required', 403);

    const quotations = await prisma.quotation.findMany({
      where: { providerId: provider.id },
      include: {
        serviceRequest: {
          include: { service: true, customer: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(res, 'Provider quotations retrieved', quotations);
  } catch (error) {
    next(error);
  }
};
