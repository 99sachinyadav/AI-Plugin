import mongoose, { Schema } from 'mongoose';

export interface IUser {
  email?: string;
  passwordHash?: string;
  anonymousSessionId?: string;
  oauthProvider?: string;
  oauthId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, unique: true, sparse: true, trim: true, lowercase: true },
    passwordHash: { type: String },
    anonymousSessionId: { type: String, unique: true, sparse: true, index: true },
    oauthProvider: { type: String },
    oauthId: { type: String },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model<IUser>('User', UserSchema);
