import { Schema, model, Document, Types } from 'mongoose';

export interface IChatThread extends Document {
  listingId: Types.ObjectId;
  participants: Types.ObjectId[]; // Seller and Buyer
  lastMessage?: string;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const chatThreadSchema = new Schema<IChatThread>(
  {
    listingId: { type: Schema.Types.ObjectId, ref: 'Listing', required: true },
    participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
    lastMessage: { type: String },
    lastMessageAt: { type: Date },
  },
  { timestamps: true }
);

chatThreadSchema.index({ listingId: 1 });
chatThreadSchema.index({ participants: 1 });

export const ChatThread = model<IChatThread>('ChatThread', chatThreadSchema);

export interface IChatMessage extends Document {
  threadId: Types.ObjectId;
  senderId: Types.ObjectId;
  message: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const chatMessageSchema = new Schema<IChatMessage>(
  {
    threadId: { type: Schema.Types.ObjectId, ref: 'ChatThread', required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

chatMessageSchema.index({ threadId: 1, createdAt: -1 });

export const ChatMessage = model<IChatMessage>('ChatMessage', chatMessageSchema);
