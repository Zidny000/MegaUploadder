import { createWriteStream, promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { FastifyRequest } from "fastify";
import type { MultipartFile } from "@fastify/multipart";
import { FileModel } from "../models/file.model.ts";

const SMALL_MAX_BYTES = 10 * 1024 * 1024;
const SMALL_UPLOAD_DIR = path.join(process.cwd(), "uploads", "small");

export class UploadError extends Error {
	statusCode: number;
	code: string;

	constructor(code: string, message: string, statusCode: number) {
		super(message);
		this.code = code;
		this.statusCode = statusCode;
	}
}

class SizeLimitError extends Error {
	constructor() {
		super("SIZE_LIMIT_EXCEEDED");
	}
}

const createSizeLimitStream = (maxBytes: number, onBytes: (bytes: number) => void) => {
	let total = 0;
	return new Transform({
		transform(chunk, _encoding, callback) {
			total += chunk.length;
			onBytes(total);
			if (total > maxBytes) {
				callback(new SizeLimitError());
				return;
			}
			callback(null, chunk);
		},
	});
};

const parseContentLength = (headerValue: string | string[] | undefined) => {
	if (!headerValue) {
		return null;
	}
	const raw = Array.isArray(headerValue) ? headerValue[0] : headerValue;
	const parsed = Number(raw);
	if (!Number.isFinite(parsed) || parsed < 0) {
		return null;
	}
	return parsed;
};

const getSafeFileName = (rawName: string | undefined) => {
	if (!rawName || rawName.trim() === "") {
		return "upload.bin";
	}
	return path.basename(rawName);
};

type SmallUploadInput = {
	stream: NodeJS.ReadableStream;
	fileName?: string;
	mimeType?: string;
	contentLength?: number | null;
	postStreamCheck?: () => void;
};

const storeSmallUpload = async (input: SmallUploadInput) => {
	if (input.contentLength !== undefined && input.contentLength !== null) {
		if (input.contentLength > SMALL_MAX_BYTES) {
			throw new UploadError(
				"PAYLOAD_TOO_LARGE",
				"File exceeds small upload limit.",
				413
			);
		}
	}

	const fileName = getSafeFileName(input.fileName);
	const mimeType = input.mimeType ?? "application/octet-stream";

	await fs.mkdir(SMALL_UPLOAD_DIR, { recursive: true });

	const storageKey = `${crypto.randomUUID()}-${fileName}`;
	const targetPath = path.join(SMALL_UPLOAD_DIR, storageKey);

	let bytesWritten = 0;
	const sizeLimitStream = createSizeLimitStream(SMALL_MAX_BYTES, (bytes) => {
		bytesWritten = bytes;
	});

	try {
		await pipeline(input.stream, sizeLimitStream, createWriteStream(targetPath));
		if (input.postStreamCheck) {
			input.postStreamCheck();
		}
	} catch (error) {
		await fs.unlink(targetPath).catch(() => undefined);
		if (error instanceof SizeLimitError) {
			throw new UploadError(
				"PAYLOAD_TOO_LARGE",
				"File exceeds small upload limit.",
				413
			);
		}
		if (error instanceof UploadError) {
			throw error;
		}
		throw new UploadError("UPLOAD_FAILED", "Upload failed.", 500);
	}

	const fileDoc = await FileModel.create({
		fileName,
		originalName: fileName,
		mimeType,
		size: bytesWritten,
		storageKey,
		bucket: "local",
		uploadType: "small",
		status: "completed",
	});

	return {
		id: fileDoc._id,
		storageKey,
		size: bytesWritten,
		mimeType,
		status: fileDoc.status,
	};
};

export const handleSmallFileUpload = async (request: FastifyRequest) => {
	const contentLength = parseContentLength(request.headers["content-length"]);
	if (contentLength === null) {
		throw new UploadError(
			"LENGTH_REQUIRED",
			"Content-Length is required for small uploads.",
			411
		);
	}

	const rawFileName = request.headers["x-file-name"];
	const fileName = typeof rawFileName === "string" ? rawFileName : undefined;
	const mimeType = typeof request.headers["content-type"] === "string"
		? request.headers["content-type"]
		: "application/octet-stream";

	return storeSmallUpload({
		stream: request.raw,
		fileName,
		mimeType,
		contentLength,
	});
};

export const handleSmallMultipartUpload = async (file: MultipartFile) => {
	let limitReached = false;
	file.file.on("limit", () => {
		limitReached = true;
	});

	return storeSmallUpload({
		stream: file.file,
		fileName: file.filename,
		mimeType: file.mimetype,
		contentLength: null,
		postStreamCheck: () => {
			if (limitReached || file.file.truncated) {
				throw new UploadError(
					"PAYLOAD_TOO_LARGE",
					"File exceeds small upload limit.",
					413
				);
			}
		},
	});
};
