import crypto from 'crypto';
import prisma from '../../config/db.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

export const createComplaint = async (req, res, next) => {
  try {
    const { category, subject, description, bookingId } = req.body;

    if (!category || !subject || !description) {
      return errorResponse(res, 'Category, subject, and description are required', 400);
    }

    const customer = await prisma.customerProfile.findUnique({
      where: { userId: req.user.id },
    });
    if (!customer) return errorResponse(res, 'Customer profile required', 403);

    const ticketNumber = `CMP-${Date.now().toString().slice(-6)}-${crypto.randomInt(100, 999)}`;

    const complaint = await prisma.$transaction(async (tx) => {
      const c = await tx.complaint.create({
        data: {
          ticketNumber,
          customerId: customer.id,
          bookingId: bookingId || null,
          category,
          subject,
          description,
          status: 'OPEN',
        },
      });

      // Initial message
      await tx.complaintMessage.create({
        data: {
          complaintId: c.id,
          senderUserId: req.user.id,
          senderRole: req.user.role,
          message: description,
        },
      });

      // Notify Admins
      const admins = await tx.user.findMany({ where: { role: 'ADMIN' } });
      if (admins.length > 0) {
        await tx.notification.createMany({
          data: admins.map((admin) => ({
            userId: admin.id,
            title: `New Support Complaint #${ticketNumber}`,
            message: `Customer ${customer.fullName} opened a complaint: "${subject}"`,
            type: 'COMPLAINT',
            link: `/admin/complaints`,
          })),
        });
      }

      return c;
    });

    return successResponse(res, 'Complaint ticket submitted successfully', complaint, 201);
  } catch (error) {
    next(error);
  }
};

export const getComplaints = async (req, res, next) => {
  try {
    let where = {};
    if (req.user.role === 'CUSTOMER') {
      const customer = await prisma.customerProfile.findUnique({
        where: { userId: req.user.id },
      });
      if (customer) where.customerId = customer.id;
    }

    const complaints = await prisma.complaint.findMany({
      where,
      include: {
        customer: true,
        booking: { include: { service: true } },
        _count: { select: { messages: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(res, 'Complaints retrieved', complaints);
  } catch (error) {
    next(error);
  }
};

export const getComplaintById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const complaint = await prisma.complaint.findFirst({
      where: {
        OR: [{ id }, { ticketNumber: id }],
      },
      include: {
        customer: true,
        booking: { include: { service: true, provider: true } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!complaint) return errorResponse(res, 'Complaint not found', 404);

    return successResponse(res, 'Complaint details retrieved', complaint);
  } catch (error) {
    next(error);
  }
};

export const addComplaintMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message) return errorResponse(res, 'Message text is required', 400);

    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: { customer: true },
    });
    if (!complaint) return errorResponse(res, 'Complaint not found', 404);

    const msg = await prisma.$transaction(async (tx) => {
      const createdMsg = await tx.complaintMessage.create({
        data: {
          complaintId: id,
          senderUserId: req.user.id,
          senderRole: req.user.role,
          message,
        },
      });

      // If admin responded, update status to UNDER_REVIEW or RESOLVED, notify customer
      if (req.user.role === 'ADMIN') {
        await tx.notification.create({
          data: {
            userId: complaint.customer.userId,
            title: `Support Update on #${complaint.ticketNumber}`,
            message: `Admin responded: "${message.slice(0, 80)}..."`,
            type: 'COMPLAINT',
            link: `/customer/complaints`,
          },
        });
      }

      return createdMsg;
    });

    return successResponse(res, 'Message added', msg, 201);
  } catch (error) {
    next(error);
  }
};

export const updateComplaintStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const complaint = await prisma.complaint.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(adminNotes !== undefined && { adminNotes }),
      },
      include: { customer: true },
    });

    // Notify customer
    await prisma.notification.create({
      data: {
        userId: complaint.customer.userId,
        title: `Complaint Status Updated: ${status}`,
        message: `Your complaint #${complaint.ticketNumber} is now marked as ${status}.`,
        type: 'COMPLAINT',
        link: `/customer/complaints`,
      },
    });

    return successResponse(res, 'Complaint updated', complaint);
  } catch (error) {
    next(error);
  }
};
