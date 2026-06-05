import { Response, NextFunction } from 'express';
import { ChatThread, ChatMessage } from '../models/Chat';
import { Listing } from '../models/Listing';
import { BadRequestError, NotFoundError, ForbiddenError } from '../utils/apiError';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { getIO } from '../index';
import { logger } from '../utils/logger';

export const getThreads = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;

    const threads = await ChatThread.find({ participants: userId })
      .populate('participants', 'displayName avatarUrl ratingAvg lastSeenAt')
      .populate('listingId', 'title images pricePaise mode isActive')
      .sort({ lastMessageAt: -1 });

    res.status(200).json({
      success: true,
      threads,
    });
  } catch (error) {
    next(error);
  }
};

export const getMessages = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { threadId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const thread = await ChatThread.findById(threadId);
    if (!thread) {
      throw new NotFoundError('Chat thread not found');
    }

    // Check if user is participant
    const isParticipant = thread.participants.some((p) => p.toString() === userId);
    if (!isParticipant) {
      throw new ForbiddenError('You do not have permission to view these messages');
    }

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const messages = await ChatMessage.find({ threadId })
      .sort({ createdAt: -1 }) // newest messages first
      .skip(skip)
      .limit(limitNum);

    const total = await ChatMessage.countDocuments({ threadId });

    // Mark other participant's messages as read
    await ChatMessage.updateMany(
      { threadId, senderId: { $ne: userId }, isRead: false },
      { $set: { isRead: true } }
    );

    res.status(200).json({
      success: true,
      messages: messages.reverse(), // Reverse to display in chronological order
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const senderId = req.userId!;
    const { threadId, listingId, message } = req.body;

    if (!message || message.trim().length === 0) {
      throw new BadRequestError('Message content cannot be empty');
    }

    let thread;

    if (threadId) {
      thread = await ChatThread.findById(threadId);
      if (!thread) {
        throw new NotFoundError('Chat thread not found');
      }

      // Check participation
      const isParticipant = thread.participants.some((p) => p.toString() === senderId);
      if (!isParticipant) {
        throw new ForbiddenError('You are not a participant in this chat thread');
      }
    } else if (listingId) {
      const listing = await Listing.findById(listingId);
      if (!listing) {
        throw new NotFoundError('Associated listing not found');
      }

      if (listing.sellerId.toString() === senderId) {
        throw new BadRequestError('You cannot start a chat thread with yourself regarding your own listing');
      }

      // Check if thread already exists for this listing and buyer
      thread = await ChatThread.findOne({
        listingId,
        participants: { $all: [senderId, listing.sellerId] },
      });

      if (!thread) {
        thread = await ChatThread.create({
          listingId,
          participants: [senderId, listing.sellerId],
        });
        logger.info(`[Chat] Created new chat thread ${thread._id} for listing ${listingId}`);
      }
    } else {
      throw new BadRequestError('Either threadId or listingId is required to send a message');
    }

    // Create message
    const chatMessage = await ChatMessage.create({
      threadId: thread._id,
      senderId,
      message,
      isRead: false,
    });

    // Update last message in thread
    thread.lastMessage = message;
    thread.lastMessageAt = new Date();
    await thread.save();

    // Propagate message in real-time via Socket.io
    const recipientId = thread.participants.find((p) => p.toString() !== senderId)?.toString();
    if (recipientId) {
      const io = getIO();
      if (io) {
        io.to(recipientId).emit('newMessage', {
          threadId: thread._id,
          message: chatMessage,
        });
        logger.debug(`[Chat] Real-time message emitted to user room: ${recipientId}`);
      }
    }

    res.status(201).json({
      success: true,
      message: chatMessage,
    });
  } catch (error) {
    next(error);
  }
};
