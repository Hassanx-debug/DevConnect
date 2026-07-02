import express, { Response } from "express";
import { AuthenticatedRequest, authMiddleware } from "./middleware";
import {
  userService,
  postService,
  commentService,
  notificationService,
  refreshTokenService,
  statsService
} from "./services";
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  verifyAccessToken
} from "./authUtils";
import nodemailer from "nodemailer";

const router = express.Router();

// Memory store for password resets
const resetTokens = new Map<string, { userId: string; expiresAt: number }>();

// ==========================================
// 1. AUTH ROUTES (/api/v1/auth)
// ==========================================

// REGISTER
router.post("/auth/register", async (req, res, next) => {
  try {
    const { name, username, email, password, confirmPassword } = req.body;

    if (!name || !username || !email || !password || !confirmPassword) {
      return res.status(400).json({ error: "All fields are required." });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match." });
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    // Check unique constraints
    const existingUser = await userService.findUserByUsername(cleanUsername);
    if (existingUser) {
      return res.status(400).json({ error: "Username is already taken." });
    }

    const existingEmail = await userService.findUserByEmail(cleanEmail);
    if (existingEmail) {
      return res.status(400).json({ error: "Email is already registered." });
    }

    const passwordHash = await hashPassword(password);
    const user = await userService.createUser({
      name,
      username: cleanUsername,
      email: cleanEmail,
      passwordHash
    });

    const accessToken = generateAccessToken(user.id, user.username);
    const refreshToken = generateRefreshToken(user.id);

    // Refresh token expiry is 7 days
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await refreshTokenService.createRefreshToken(user.id, refreshToken, expiresAt);

    // Set HTTP-Only Cookie for Refresh Token
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(211).json({
      message: "Registration successful!",
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        techStack: user.techStack
      }
    });
  } catch (err) {
    next(err);
  }
});

// LOGIN
router.post("/auth/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await userService.findUserByEmail(cleanEmail);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const accessToken = generateAccessToken(user.id, user.username);
    const refreshToken = generateRefreshToken(user.id);

    // Save refresh token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await refreshTokenService.createRefreshToken(user.id, refreshToken, expiresAt);

    // Set Cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      message: "Login successful!",
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        techStack: user.techStack,
        githubUrl: user.githubUrl,
        linkedinUrl: user.linkedinUrl,
        followers: user.followers || [],
        following: user.following || [],
        savedPosts: user.savedPosts || [],
        isPrivate: user.isPrivate || false
      }
    });
  } catch (err) {
    next(err);
  }
});

// REFRESH
router.post("/auth/refresh", async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ error: "Refresh token is missing." });
    }

    const storedToken = await refreshTokenService.findRefreshToken(refreshToken);
    if (!storedToken) {
      return res.status(401).json({ error: "Invalid or expired refresh token." });
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded || decoded.userId !== storedToken.user.toString()) {
      return res.status(401).json({ error: "Refresh token verification failed." });
    }

    const user = await userService.findUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: "User associated with token not found." });
    }

    const newAccessToken = generateAccessToken(user.id, user.username);
    res.json({ accessToken: newAccessToken });
  } catch (err) {
    next(err);
  }
});

// LOGOUT
router.post("/auth/logout", async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (refreshToken) {
      await refreshTokenService.deleteRefreshToken(refreshToken);
    }
    res.clearCookie("refreshToken");
    res.json({ message: "Logged out successfully." });
  } catch (err) {
    next(err);
  }
});

// FORGOT PASSWORD
router.post("/auth/forgot-password", async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }

    const user = await userService.findUserByEmail(email.trim().toLowerCase());
    if (!user) {
      return res.status(400).json({ error: "No user with that email address exists." });
    }

    // Create 1-hour reset token
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expiresAt = Date.now() + 3600000; // 1 hour
    resetTokens.set(token, { userId: user.id, expiresAt });

    const appUrl = process.env.APP_URL || `http://localhost:3000`;
    const resetUrl = `${appUrl}/reset-password/${token}`;

    console.log(`🔑 Reset Password link created for ${user.email}: ${resetUrl}`);

    // Attempt SMTP mail dispatch, fallback gracefully
    let emailSent = false;
    let mailError = "";
    try {
      // Configuration for Mail / SMTP (using optional env or Ethereal fallback)
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.ethereal.email",
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER || "ethereal.user@ethereal.email",
          pass: process.env.SMTP_PASS || "ethereal_password_key"
        }
      });

      await transporter.sendMail({
        from: '"DevConnect Team" <noreply@devconnect.dev>',
        to: user.email,
        subject: "Reset Your DevConnect Password",
        html: `
          <div style="font-family: sans-serif; padding: 20px; background-color: #0a0a0f; color: #ffffff; border-radius: 8px; max-width: 600px; margin: 0 auto; border: 1px solid #1f1f2e;">
            <h2 style="color: #6366f1;">DevConnect Password Reset</h2>
            <p>You requested a password reset for your account. Click the button below to set a new password:</p>
            <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 15px 0;">Reset Password</a>
            <p style="color: #8b8b9f; font-size: 12px;">This link will expire in 1 hour.</p>
            <hr style="border: 0; border-top: 1px solid #1f1f2e; margin: 20px 0;">
            <p style="font-size: 11px; color: #5f5f7f;">If you did not request this, please ignore this email.</p>
          </div>
        `
      });
      emailSent = true;
    } catch (err: any) {
      mailError = err.message;
      console.warn("⚠️ SMTP dispatch failed. Reset link falls back to API response parameter.", err.message);
    }

    res.json({
      message: "Reset password link generated successfully.",
      resetUrl, // Return directly so users can test even without configured email server!
      emailSent,
      info: emailSent ? "Check your mailbox." : `Reset link loaded directly (SMTP skipped/failed: ${mailError})`
    });
  } catch (err) {
    next(err);
  }
});

// RESET PASSWORD
router.post("/auth/reset-password", async (req, res, next) => {
  try {
    const { token, password, confirmPassword } = req.body;
    if (!token || !password || !confirmPassword) {
      return res.status(400).json({ error: "All fields are required." });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match." });
    }

    const resetData = resetTokens.get(token);
    if (!resetData || resetData.expiresAt < Date.now()) {
      return res.status(400).json({ error: "Invalid or expired reset token." });
    }

    const passwordHash = await hashPassword(password);
    await userService.updateUser(resetData.userId, { passwordHash } as any);

    // Delete token
    resetTokens.delete(token);

    // Revoke any refresh tokens
    await refreshTokenService.deleteUserTokens(resetData.userId);

    res.json({ message: "Password reset successful! You can now log in." });
  } catch (err) {
    next(err);
  }
});


// ==========================================
// 2. USER ROUTES (/api/v1/users)
// ==========================================

// GET PROFILE BY USERNAME
router.get("/users/profile/:username", async (req: AuthenticatedRequest, res, next) => {
  try {
    const { username } = req.params;
    const currentUserId = req.headers.authorization ? userService.findUserByUsername(username).then(() => {
      // Decode user if header exists (for follow state checking)
      const token = req.headers.authorization?.split(" ")[1];
      const payload = token ? verifyAccessToken(token) : null;
      return payload?.userId;
    }) : undefined;

    const user = await userService.findUserByUsername(username);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Remove hashed password from output
    const safeUser = { ...user };
    delete safeUser.passwordHash;

    const resolvedUserId = await currentUserId;
    if (resolvedUserId) {
      safeUser.isFollowing = user.followers?.some((fid: any) => fid.toString() === resolvedUserId);
    } else {
      safeUser.isFollowing = false;
    }

    res.json(safeUser);
  } catch (err) {
    next(err);
  }
});

// UPDATE PROFILE
router.patch("/users/profile", authMiddleware, async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user!.userId;
    const updatedUser = await userService.updateUser(userId, req.body);
    if (!updatedUser) {
      return res.status(404).json({ error: "User not found." });
    }

    const safeUser = { ...updatedUser };
    delete safeUser.passwordHash;

    res.json({
      message: "Profile updated successfully!",
      user: safeUser
    });
  } catch (err) {
    next(err);
  }
});

// FOLLOW
router.post("/users/follow/:id", authMiddleware, async (req: AuthenticatedRequest, res, next) => {
  try {
    const followerId = req.user!.userId;
    const targetId = req.params.id;

    const result = await userService.followUser(followerId, targetId);
    if (!result) {
      return res.status(400).json({ error: "Cannot follow this user." });
    }

    // Trigger notification
    await notificationService.createNotification({
      recipientId: targetId,
      senderId: followerId,
      type: "follow"
    });

    res.json({ message: "Followed successfully." });
  } catch (err) {
    next(err);
  }
});

// UNFOLLOW
router.post("/users/unfollow/:id", authMiddleware, async (req: AuthenticatedRequest, res, next) => {
  try {
    const followerId = req.user!.userId;
    const targetId = req.params.id;

    const result = await userService.unfollowUser(followerId, targetId);
    if (!result) {
      return res.status(400).json({ error: "Cannot unfollow this user." });
    }

    res.json({ message: "Unfollowed successfully." });
  } catch (err) {
    next(err);
  }
});

// FOLLOWERS LIST
router.get("/users/:id/followers", async (req, res, next) => {
  try {
    const list = await userService.getFollowers(req.params.id);
    res.json(list);
  } catch (err) {
    next(err);
  }
});

// FOLLOWING LIST
router.get("/users/:id/following", async (req, res, next) => {
  try {
    const list = await userService.getFollowing(req.params.id);
    res.json(list);
  } catch (err) {
    next(err);
  }
});

// SEARCH USERS
router.get("/users/search", async (req, res, next) => {
  try {
    const query = req.query.q as string;
    if (!query) {
      return res.json([]);
    }
    const results = await userService.searchUsers(query);
    res.json(results);
  } catch (err) {
    next(err);
  }
});

// SUGGESTED USERS
router.get("/users/suggested", authMiddleware, async (req: AuthenticatedRequest, res, next) => {
  try {
    const list = await userService.getSuggestedUsers(req.user!.userId);
    res.json(list);
  } catch (err) {
    next(err);
  }
});

// DELETE ACCOUNT
router.delete("/users/account", authMiddleware, async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user!.userId;
    await userService.deleteUser(userId);
    res.clearCookie("refreshToken");
    res.json({ message: "Account deleted successfully." });
  } catch (err) {
    next(err);
  }
});


// ==========================================
// 3. POST ROUTES (/api/v1/posts)
// ==========================================

// CREATE POST
router.post("/posts", authMiddleware, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { content, imageUrl, techTags } = req.body;
    if (!content) {
      return res.status(400).json({ error: "Post content is required." });
    }

    const post = await postService.createPost({
      authorId: req.user!.userId,
      content,
      imageUrl,
      techTags: techTags || []
    });

    res.status(211).json(post);
  } catch (err) {
    next(err);
  }
});

// GET POST BY ID
router.get("/posts/:id", async (req: AuthenticatedRequest, res, next) => {
  try {
    const currentUserId = req.headers.authorization ? (() => {
      const token = req.headers.authorization?.split(" ")[1];
      const payload = token ? verifyAccessToken(token) : null;
      return payload?.userId;
    })() : undefined;

    const post = await postService.getPostById(req.params.id, currentUserId);
    if (!post) {
      return res.status(404).json({ error: "Post not found." });
    }
    res.json(post);
  } catch (err) {
    next(err);
  }
});

// GET FEED (Latest, Following, Trending)
router.get("/posts", async (req: AuthenticatedRequest, res, next) => {
  try {
    const type = (req.query.type as "latest" | "following" | "trending") || "latest";
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const tagFilter = req.query.tag as string;
    const userFilter = req.query.user as string;
    const savedOnly = req.query.saved === "true";

    // Detect user if bearer token is active
    let currentUserId: string | undefined;
    if (req.headers.authorization) {
      const token = req.headers.authorization.split(" ")[1];
      const payload = token ? verifyAccessToken(token) : null;
      if (payload) {
        currentUserId = payload.userId;
      }
    }

    const posts = await postService.getFeed({
      type,
      currentUserId,
      page,
      limit,
      tagFilter,
      userFilter,
      savedOnly
    });

    res.json(posts);
  } catch (err) {
    next(err);
  }
});

// SEARCH POSTS
router.get("/posts/search", async (req, res, next) => {
  try {
    const query = req.query.q as string;
    if (!query) return res.json([]);

    let currentUserId: string | undefined;
    if (req.headers.authorization) {
      const token = req.headers.authorization.split(" ")[1];
      const payload = token ? verifyAccessToken(token) : null;
      if (payload) currentUserId = payload.userId;
    }

    const posts = await postService.searchPosts(query, currentUserId);
    res.json(posts);
  } catch (err) {
    next(err);
  }
});

// LIKE POST
router.post("/posts/:id/like", authMiddleware, async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user!.userId;
    const postId = req.params.id;

    const post = await postService.likePost(userId, postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found." });
    }

    // Trigger notification
    await notificationService.createNotification({
      recipientId: post.author.toString(),
      senderId: userId,
      type: "like",
      postId: post.id
    });

    res.json({ message: "Post liked successfully.", post });
  } catch (err) {
    next(err);
  }
});

// UNLIKE POST
router.post("/posts/:id/unlike", authMiddleware, async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user!.userId;
    const postId = req.params.id;

    const post = await postService.unlikePost(userId, postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found." });
    }

    res.json({ message: "Post unliked successfully.", post });
  } catch (err) {
    next(err);
  }
});

// BOOKMARK POST
router.post("/posts/:id/bookmark", authMiddleware, async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user!.userId;
    const postId = req.params.id;

    const ok = await postService.bookmarkPost(userId, postId);
    if (!ok) {
      return res.status(404).json({ error: "Failed to bookmark post." });
    }

    res.json({ message: "Post bookmarked successfully." });
  } catch (err) {
    next(err);
  }
});

// UNBOOKMARK POST
router.post("/posts/:id/unbookmark", authMiddleware, async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user!.userId;
    const postId = req.params.id;

    const ok = await postService.unbookmarkPost(userId, postId);
    if (!ok) {
      return res.status(404).json({ error: "Failed to unbookmark post." });
    }

    res.json({ message: "Post unbookmarked successfully." });
  } catch (err) {
    next(err);
  }
});

// UPDATE POST
router.patch("/posts/:id", authMiddleware, async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user!.userId;
    const postId = req.params.id;

    const existingPost = await postService.getPostById(postId);
    if (!existingPost) {
      return res.status(404).json({ error: "Post not found." });
    }

    const authorId = existingPost.author.id || existingPost.author;
    if (authorId.toString() !== userId) {
      return res.status(403).json({ error: "You are not authorized to edit this post." });
    }

    const { content, imageUrl, techTags } = req.body;
    const updated = await postService.updatePost(postId, content, imageUrl, techTags);
    res.json({ message: "Post updated successfully.", post: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE POST
router.delete("/posts/:id", authMiddleware, async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user!.userId;
    const postId = req.params.id;

    const existingPost = await postService.getPostById(postId);
    if (!existingPost) {
      return res.status(404).json({ error: "Post not found." });
    }

    const authorId = existingPost.author.id || existingPost.author;
    if (authorId.toString() !== userId) {
      return res.status(403).json({ error: "You are not authorized to delete this post." });
    }

    await postService.deletePost(postId);
    res.json({ message: "Post deleted successfully." });
  } catch (err) {
    next(err);
  }
});


// ==========================================
// 4. COMMENT ROUTES (/api/v1/comments)
// ==========================================

// CREATE COMMENT / REPLY
router.post("/comments", authMiddleware, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { postId, content, parentCommentId } = req.body;
    if (!postId || !content) {
      return res.status(400).json({ error: "Post ID and comment content are required." });
    }

    const comment = await commentService.createComment({
      postId,
      authorId: req.user!.userId,
      content,
      parentCommentId
    });

    // Notify post author or parent comment author
    const post = await postService.getPostById(postId);
    if (post) {
      const postAuthorId = post.author.id || post.author;
      if (parentCommentId) {
        const parent = await commentService.getCommentById(parentCommentId);
        if (parent) {
          const parentAuthorId = parent.author.id || parent.author;
          await notificationService.createNotification({
            recipientId: parentAuthorId.toString(),
            senderId: req.user!.userId,
            type: "reply",
            postId,
            commentId: comment.id
          });
        }
      } else {
        await notificationService.createNotification({
          recipientId: postAuthorId.toString(),
          senderId: req.user!.userId,
          type: "comment",
          postId,
          commentId: comment.id
        });
      }
    }

    res.status(211).json(comment);
  } catch (err) {
    next(err);
  }
});

// GET POST COMMENTS
router.get("/posts/:postId/comments", async (req, res, next) => {
  try {
    let currentUserId: string | undefined;
    if (req.headers.authorization) {
      const token = req.headers.authorization.split(" ")[1];
      const payload = token ? verifyAccessToken(token) : null;
      if (payload) currentUserId = payload.userId;
    }

    const list = await commentService.getPostComments(req.params.postId, currentUserId);
    res.json(list);
  } catch (err) {
    next(err);
  }
});

// LIKE COMMENT
router.post("/comments/:id/like", authMiddleware, async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user!.userId;
    const commentId = req.params.id;

    const comment = await commentService.likeComment(userId, commentId);
    if (!comment) {
      return res.status(404).json({ error: "Comment not found." });
    }

    res.json({ message: "Comment liked successfully.", comment });
  } catch (err) {
    next(err);
  }
});

// UNLIKE COMMENT
router.post("/comments/:id/unlike", authMiddleware, async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user!.userId;
    const commentId = req.params.id;

    const comment = await commentService.unlikeComment(userId, commentId);
    if (!comment) {
      return res.status(404).json({ error: "Comment not found." });
    }

    res.json({ message: "Comment unliked successfully.", comment });
  } catch (err) {
    next(err);
  }
});

// DELETE COMMENT (with recursive soft-delete check)
router.delete("/comments/:id", authMiddleware, async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user!.userId;
    const commentId = req.params.id;

    const existing = await commentService.getCommentById(commentId);
    if (!existing) {
      return res.status(404).json({ error: "Comment not found." });
    }

    const authorId = existing.author.id || existing.author;
    if (authorId.toString() !== userId) {
      return res.status(403).json({ error: "You are not authorized to delete this comment." });
    }

    await commentService.deleteComment(commentId);
    res.json({ message: "Comment deleted successfully." });
  } catch (err) {
    next(err);
  }
});


// ==========================================
// 5. NOTIFICATION ROUTES (/api/v1/notifications)
// ==========================================

// LIST NOTIFICATIONS
router.get("/notifications", authMiddleware, async (req: AuthenticatedRequest, res, next) => {
  try {
    const list = await notificationService.getNotifications(req.user!.userId);
    const unreadCount = await notificationService.getUnreadCount(req.user!.userId);
    res.json({ notifications: list, unreadCount });
  } catch (err) {
    next(err);
  }
});

// MARK NOTIFICATION AS READ
router.post("/notifications/:id/read", authMiddleware, async (req, res, next) => {
  try {
    await notificationService.markNotificationAsRead(req.params.id);
    res.json({ message: "Notification marked as read." });
  } catch (err) {
    next(err);
  }
});

// MARK ALL AS READ
router.post("/notifications/read-all", authMiddleware, async (req: AuthenticatedRequest, res, next) => {
  try {
    await notificationService.markAllNotificationsAsRead(req.user!.userId);
    res.json({ message: "All notifications marked as read." });
  } catch (err) {
    next(err);
  }
});


// ==========================================
// 6. STATS ROUTE (/api/v1/stats)
// ==========================================
router.get("/stats", async (req, res, next) => {
  try {
    const stats = await statsService.getPublicStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

export default router;
