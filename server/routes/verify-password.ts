import { RequestHandler } from "express";

export const handleVerifyPassword: RequestHandler = (req, res) => {
  const { password } = req.body;

  if (!password) {
    res.status(400).json({ error: "Password is required" });
    return;
  }

  const correctPassword = process.env.APP_PASSWORD;

  if (password === correctPassword) {
    res.json({ success: true });
  } else {
    res.status(401).json({ error: "Invalid password" });
  }
};
