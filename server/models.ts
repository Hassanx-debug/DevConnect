import mongoose, { Schema, Document } from "mongoose";

// --- User Schema ---
export interface IUser extends Document {
  name: string;
  username: string;
  email: string;
  passwordHash: string;
  avatarUrl?: string;
  bio?: string;
  techStack: string[];
  githubUrl?: string;
  linkedinUrl?: string;
  followers: mongoose.Types.ObjectId[];
  following: mongoose.Types.ObjectId[];
  savedPosts: mongoose.Types.ObjectId[];
  isPrivate: boolean;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  avatarUrl: { type: String, default: "" },
  bio: { type: String, default: "" },
  techStack: [{ type: String, index: true }],
  githubUrl: { type: String, default: "" },
  linkedinUrl: { type: String, default: "" },
  followers: [{ type: Schema.Types.ObjectId, ref: "User", default: [] }],
  following: [{ type: Schema.Types.ObjectId, ref: "User", default: [] }],
  savedPosts: [{ type: Schema.Types.ObjectId, ref: "Post", default: [] }],
  isPrivate: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export const User = mongoose.model<IUser>("User", UserSchema);


// --- Post Schema ---
export interface IPost extends Document {
  author: mongoose.Types.ObjectId;
  content: string;
  imageUrl?: string;
  techTags: string[];
  likes: mongoose.Types.ObjectId[];
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema = new Schema<IPost>({
  author: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  content: { type: String, required: true },
  imageUrl: { type: String, default: "" },
  techTags: [{ type: String, index: true }],
  likes: [{ type: Schema.Types.ObjectId, ref: "User", default: [] }],
  commentCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const Post = mongoose.model<IPost>("Post", PostSchema);


// --- Comment Schema ---
export interface IComment extends Document {
  post: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  parentComment?: mongoose.Types.ObjectId | null;
  content: string;
  likes: mongoose.Types.ObjectId[];
  isDeleted: boolean;
  createdAt: Date;
}

const CommentSchema = new Schema<IComment>({
  post: { type: Schema.Types.ObjectId, ref: "Post", required: true, index: true },
  author: { type: Schema.Types.ObjectId, ref: "User", required: true },
  parentComment: { type: Schema.Types.ObjectId, ref: "Comment", default: null, index: true },
  content: { type: String, required: true },
  likes: [{ type: Schema.Types.ObjectId, ref: "User", default: [] }],
  isDeleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export const Comment = mongoose.model<IComment>("Comment", CommentSchema);


// --- Notification Schema ---
export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  type: "follow" | "like" | "comment" | "reply";
  post?: mongoose.Types.ObjectId | null;
  comment?: mongoose.Types.ObjectId | null;
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  recipient: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["follow", "like", "comment", "reply"], required: true },
  post: { type: Schema.Types.ObjectId, ref: "Post", default: null },
  comment: { type: Schema.Types.ObjectId, ref: "Comment", default: null },
  isRead: { type: Boolean, default: false, index: true },
  createdAt: { type: Date, default: Date.now }
});

export const Notification = mongoose.model<INotification>("Notification", NotificationSchema);


// --- RefreshToken Schema ---
export interface IRefreshToken extends Document {
  user: mongoose.Types.ObjectId;
  token: string;
  expiresAt: Date;
}

const RefreshTokenSchema = new Schema<IRefreshToken>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  token: { type: String, required: true, unique: true, index: true },
  expiresAt: { type: Date, required: true }
});

export const RefreshToken = mongoose.model<IRefreshToken>("RefreshToken", RefreshTokenSchema);
