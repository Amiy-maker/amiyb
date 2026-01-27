import { RequestHandler } from "express";

export const handleVerifyPassword: RequestHandler = (req, res) => {
  const { password } = req.body;

  if (!password) {
    res.status(400).json({ error: "Password is required" });
    return;
  }

  const correctPassword = process.env.APP_PASSWORD;

  // Debug logging
  console.log("APP_PASSWORD env var:", correctPassword ? "SET" : "NOT SET");
  console.log("Password match:", password === correctPassword);

  if (password === correctPassword) {
    res.json({ success: true });
  } else {
    res.status(401).json({ error: "Invalid password" });
  }
};
