import type { FastifyReply, FastifyRequest } from "fastify";
import { handleSmallFileUpload, handleSmallMultipartUpload, UploadError } from "../services/upload.service.ts";

export const uploadSmallFileController = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    if (request.isMultipart()) {
      const file = await request.file();
      if (!file) {
        return reply.code(400).send({
          error: "FILE_REQUIRED",
          message: "No file found in multipart request.",
        });
      }
      const result = await handleSmallMultipartUpload(file);
      return reply.code(201).send(result);
    }

    const result = await handleSmallFileUpload(request);
    return reply.code(201).send(result);
  } catch (error) {
    if (error instanceof UploadError) {
      return reply.code(error.statusCode).send({
        error: error.code,
        message: error.message,
      });
    }
    request.log.error({ error }, "Small upload failed");
    return reply.code(500).send({
      error: "UPLOAD_FAILED",
      message: "Upload failed.",
    });
  }
};
