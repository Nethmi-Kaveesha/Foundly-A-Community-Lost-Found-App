import cors from "cors";
import express from "express";

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Mock Forgot Password endpoint
app.post("/auth/forgot-password", (req, res) => {
  const { email } = req.body;
  console.log("Forgot password request for:", email);
  res.json({ message: `Password reset link sent to ${email} (mock)` });
});

app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
