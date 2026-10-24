import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import transporter from "../config/mailer.js";

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/",
  maxAge: 15 * 60 * 1000,
});

const createToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
});

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        message: "Name, email, and password are required.",
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || cleanName.length > 80) {
      return res.status(400).json({
        message: "Name must contain 1 to 80 characters.",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({
        message: "Please enter a valid email address.",
      });
    }

    if (
      password.length < 12 ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      return res.status(400).json({
        message: "Password must be at least 12 characters and no more than 72 UTF-8 bytes.",
      });
    }

    const existingUser = await User.findOne({ email: cleanEmail });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      password: hashedPassword,
      isEmailVerified: false,
      emailVerificationToken: hashedToken,
      emailVerificationExpires: new Date(Date.now() + 15 * 60 * 1000),
    });

    const verificationUrl =
      `${process.env.CLIENT_URL}/verify-email` +
      `?token=${verificationToken}&email=${encodeURIComponent(cleanEmail)}`;

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: cleanEmail,
        subject: "Verify your email address",
        text:
          `Hello ${cleanName},\n\n` +
          `Verify your email using this link within 15 minutes:\n${verificationUrl}\n\n` +
          "If you did not create this account, please ignore this email.",
      });
    } catch (emailError) {
      await User.deleteOne({ _id: user._id });

      console.error("Verification email delivery failed.");

      return res.status(503).json({
        message: "Unable to send the verification email. Please try again.",
      });
    }

    return res.status(201).json({
      message: "Registration successful. Check your email to verify your account before logging in.",
      requiresEmailVerification: true,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    console.error("Registration error:", error.message);

    return res.status(500).json({
      message: "Unable to register right now.",
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select("+password");

    if (!user || !user.password) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        message: "Please verify your email before logging in.",
        code: "EMAIL_NOT_VERIFIED",
      });
    }

    res.cookie("accessToken", createToken(user._id), cookieOptions());

    return res.status(200).json({
      message: "Login successful.",
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      message: "An error occurred during login.",
    });
  }
};


export const logout = (req, res) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });

  return res.status(200).json({
    message: "Logged out successfully.",
  });
};

export const forgotPassword = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email });

    // Return the same response whether the account exists or not.
    const message =
      "If an account exists for that email, a reset link will be sent.";

    if (!user) {
      return res.status(200).json({ message });
    }

    // Generate a random token and store only its SHA-256 hash.
    const token = crypto.randomBytes(32).toString("hex");

    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    user.resetPasswordExpires =
      new Date(Date.now() + 15 * 60 * 1000);

    await user.save();

    const resetUrl =
      `${process.env.CLIENT_URL}/reset-password` +
      `?token=${token}&email=${encodeURIComponent(email)}`;

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: "Reset your password",
        text: `Open this link to reset your password within 15 minutes:\n${resetUrl}\n\nIf you did not request this, ignore this email.`,
      });
    } catch (emailError) {
      // Invalidate the token if email delivery fails.
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      console.error("Reset email delivery failed.");
      return res.status(503).json({
        message: "Unable to send the reset email. Please try again.",
      });
    }

    return res.status(200).json({ message });
  } catch (error) {
    console.error("Forgot password failed:", error.message);
    return res.status(500).json({
      message: "Something went wrong. Please try again.",
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, token, password } = req.body;

    if (
      !email ||
      !token ||
      typeof password !== "string" ||
      password.length < 12 ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      return res.status(400).json({
        message:
          "Provide a valid reset request. Password must be 12–72 UTF-8 bytes.",
      });
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
      resetPasswordToken: tokenHash,
      resetPasswordExpires: { $gt: new Date() },
    }).select("+password");

    if (!user) {
      return res.status(400).json({
        message: "The reset link is invalid or has expired.",
      });
    }

    user.password = await bcrypt.hash(password, 12);

    // Make the reset link single-use.
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    return res.status(200).json({
      message: "Password reset successful. Please log in.",
    });
  } catch (error) {
    console.error("Reset password failed:", error.message);
    return res.status(500).json({
      message: "Something went wrong. Please try again.",
    });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token, email } = req.body;

    if (
      typeof token !== "string" ||
      typeof email !== "string" ||
      !token ||
      !email.trim()
    ) {
      return res.status(400).json({
        message: "Verification token and email are required.",
      });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: new Date() },
    }).select("+emailVerificationToken +emailVerificationExpires");

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired verification link.",
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;

    await user.save();

    return res.status(200).json({
      message: "Email verified successfully. You can now log in.",
    });
  } catch (error) {
    console.error("Email verification error:", error.message);

    return res.status(500).json({
      message: "Email verification failed. Please try again.",
    });
  }
};



export const updateProfile = async (req, res) => {
  try {
    const { name } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        message: "Name is required.",
      });
    }

    if (name.trim().length > 80) {
      return res.status(400).json({
        message: "Name cannot exceed 80 characters.",
      });
    }

    // authMiddleware already fetched the user
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { name: name.trim() } },
      { returnDocument: "after", runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    return res.status(200).json({
      message: "Profile updated successfully.",
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({
      message: "Unable to update profile.",
    });
  }
};


export const getMe = async (req, res) => {
  return res.status(200).json({
    user: publicUser(req.user),
  });
};
