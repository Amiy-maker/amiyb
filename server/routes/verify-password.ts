import { RequestHandler } from "express";

export const handleVerifyPassword: RequestHandler = (req, res) => {
  const { password } = req.body;

  if (!password) {
    res.status(400).json({ error: "Password is required" });
    return;
  }

  const correctPassword = process.env.APP_PASSWORD || "AmiySEO";

  console.log("Password verification attempt:", {
    provided: password,
    expected: correctPassword,
    match: password === correctPassword,
    envAppPassword: process.env.APP_PASSWORD,
    env: Object.keys(process.env).filter(k => k.startsWith('APP') || k.startsWith('SHOPIFY'))
  });

  if (password === correctPassword) {
    res.json({ success: true });
  } else {
    res.status(401).json({ error: "Invalid password" });
  }
};
