import crypto from "crypto";

export const verifyGithubSignature = (
  secret: string,
  rawBody: Buffer,
  signatureHeader: string | undefined
): boolean => {
  if (!signatureHeader) return false;

  const signature = Buffer.from(signatureHeader.replace("sha256=", "").trim(), "hex");

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest();

  if (signature.length !== expected.length) return false;

  return crypto.timingSafeEqual(signature, expected);
};
