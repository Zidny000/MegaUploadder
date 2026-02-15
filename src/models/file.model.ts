import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * Upload Types
 */
export type UploadType = "small" | "medium" | "large" | "huge";

export type UploadStatus =
  | "pending"
  | "uploading"
  | "processing"
  | "completed"
  | "failed"
  | "aborted";

/**
 * Multipart Part Interface
 */
export interface IMultipartPart {
  partNumber: number;
  etag: string;
  size: number;
}

/**
 * File Document Interface
 */
export interface IFile extends Document {
  userId?: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  storageKey: string;
  bucket: string;

  uploadType: UploadType;
  status: UploadStatus;

  uploadId?: string; // S3 multipart uploadId
  parts?: IMultipartPart[];

  checksum?: string; // optional MD5/SHA256
  metadata?: Record<string, any>;

  expiresAt?: Date; // optional TTL for temporary files

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Multipart Part Schema
 */
const MultipartPartSchema = new Schema<IMultipartPart>(
  {
    partNumber: {
      type: Number,
      required: true,
    },
    etag: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

/**
 * Main File Schema
 */
const FileSchema = new Schema<IFile>(
  {
    userId: {
      type: String,
      index: true,
    },

    fileName: {
      type: String,
      required: true,
    },

    originalName: {
      type: String,
      required: true,
    },

    mimeType: {
      type: String,
      required: true,
    },

    size: {
      type: Number,
      required: true,
      index: true,
    },

    storageKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    bucket: {
      type: String,
      required: true,
    },

    uploadType: {
      type: String,
      enum: ["small", "medium", "large", "huge"],
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "uploading",
        "processing",
        "completed",
        "failed",
        "aborted",
      ],
      default: "pending",
      index: true,
    },

    uploadId: {
      type: String,
    },

    parts: {
      type: [MultipartPartSchema],
      default: [],
    },

    checksum: {
      type: String,
    },

    metadata: {
      type: Schema.Types.Mixed,
    },

    expiresAt: {
      type: Date,
      index: { expires: 0 }, // TTL index (only works if field is set)
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Compound Indexes
 */
FileSchema.index({ userId: 1, createdAt: -1 });
FileSchema.index({ uploadType: 1, status: 1 });

/**
 * Model Export
 */
export const FileModel: Model<IFile> =
  mongoose.models.File || mongoose.model<IFile>("File", FileSchema);
