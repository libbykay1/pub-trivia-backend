import { adminAuth } from "../firebaseAdmin.js";

const ADMIN_UID = process.env.PUBLISH_ADMIN_UID; // set this in Render

export async function requireSingleAdmin(req, res, next) {
  try {
    const hdr = req.headers.authorization || "";
    const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Missing token" });

    const decoded = await adminAuth.verifyIdToken(token);
    if (decoded.uid !== ADMIN_UID) return res.status(403).json({ error: "Forbidden" });

    req.user = decoded;
    next();
  } catch (e) {
    console.error("[requireSingleAdmin] Auth error:", e);
    res.status(401).json({ error: "Unauthorized" });
  }
}
