import mongoose from "mongoose";
import { User, Post, Comment, Notification, RefreshToken, IUser, IPost, IComment, INotification } from "./models";
import { isUsingMongo, readLocalDB, writeLocalDB } from "./db";

// Helper to generate custom string ID for local storage fallback
function generateId() {
  return new mongoose.Types.ObjectId().toString();
}

// Convert Mongoose Doc or Local JSON Object to clean standard format recursively
function cleanDoc(doc: any): any {
  if (!doc) return null;
  const rawObj = doc.toObject ? doc.toObject() : { ...doc };

  const recurse = (obj: any): any => {
    if (!obj || typeof obj !== "object") return obj;

    // Handle array of objects
    if (Array.isArray(obj)) {
      return obj.map(recurse);
    }

    // Skip Mongoose ObjectIds or Dates themselves
    if (obj instanceof mongoose.Types.ObjectId || obj instanceof Date) {
      return obj;
    }

    // Convert keys recursively
    const newObj: any = {};
    for (const key of Object.keys(obj)) {
      newObj[key] = recurse(obj[key]);
    }

    // Ensure id is set if _id exists
    if (newObj._id) {
      newObj.id = newObj._id.toString();
    }

    return newObj;
  };

  return recurse(rawObj);
}

// ==========================================
// USER SERVICES
// ==========================================
export const userService = {
  async createUser(data: { name: string; username: string; email: string; passwordHash: string }) {
    if (isUsingMongo()) {
      const user = new User({
        ...data,
        techStack: [],
        followers: [],
        following: [],
        savedPosts: [],
        isPrivate: false,
      });
      await user.save();
      return cleanDoc(user);
    } else {
      const db = readLocalDB();
      const newUser = {
        _id: generateId(),
        name: data.name,
        username: data.username.toLowerCase(),
        email: data.email.toLowerCase(),
        passwordHash: data.passwordHash,
        avatarUrl: "",
        bio: "",
        techStack: [],
        githubUrl: "",
        linkedinUrl: "",
        followers: [],
        following: [],
        savedPosts: [],
        isPrivate: false,
        createdAt: new Date().toISOString()
      };
      db.users.push(newUser);
      writeLocalDB(db);
      return cleanDoc(newUser);
    }
  },

  async findUserByUsername(username: string) {
    const lowerUsername = username.toLowerCase();
    if (isUsingMongo()) {
      const user = await User.findOne({ username: lowerUsername });
      return user ? cleanDoc(user) : null;
    } else {
      const db = readLocalDB();
      const user = db.users.find((u: any) => u.username === lowerUsername);
      return user ? cleanDoc(user) : null;
    }
  },

  async findUserByEmail(email: string) {
    const lowerEmail = email.toLowerCase();
    if (isUsingMongo()) {
      const user = await User.findOne({ email: lowerEmail });
      return user ? cleanDoc(user) : null;
    } else {
      const db = readLocalDB();
      const user = db.users.find((u: any) => u.email === lowerEmail);
      return user ? cleanDoc(user) : null;
    }
  },

  async findUserById(id: string) {
    if (isUsingMongo()) {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      const user = await User.findById(id);
      return user ? cleanDoc(user) : null;
    } else {
      const db = readLocalDB();
      const user = db.users.find((u: any) => u._id === id);
      return user ? cleanDoc(user) : null;
    }
  },

  async updateUser(id: string, updates: Partial<IUser>) {
    // Pick fields that are safe to update
    const allowedUpdates = [
      "name",
      "avatarUrl",
      "bio",
      "techStack",
      "githubUrl",
      "linkedinUrl",
      "isPrivate"
    ];
    const filteredUpdates: any = {};
    for (const key of allowedUpdates) {
      if ((updates as any)[key] !== undefined) {
        filteredUpdates[key] = (updates as any)[key];
      }
    }

    if (isUsingMongo()) {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      const user = await User.findByIdAndUpdate(id, { $set: filteredUpdates }, { new: true });
      return user ? cleanDoc(user) : null;
    } else {
      const db = readLocalDB();
      const userIndex = db.users.findIndex((u: any) => u._id === id);
      if (userIndex === -1) return null;
      db.users[userIndex] = {
        ...db.users[userIndex],
        ...filteredUpdates
      };
      writeLocalDB(db);
      return cleanDoc(db.users[userIndex]);
    }
  },

  async followUser(followerId: string, targetId: string) {
    if (followerId === targetId) return null;

    if (isUsingMongo()) {
      if (!mongoose.Types.ObjectId.isValid(followerId) || !mongoose.Types.ObjectId.isValid(targetId)) {
        return null;
      }
      // Add to follower's following
      await User.findByIdAndUpdate(followerId, { $addToSet: { following: targetId } });
      // Add to target's followers
      await User.findByIdAndUpdate(targetId, { $addToSet: { followers: followerId } });
      return true;
    } else {
      const db = readLocalDB();
      const follower = db.users.find((u: any) => u._id === followerId);
      const target = db.users.find((u: any) => u._id === targetId);
      if (!follower || !target) return null;

      if (!follower.following.includes(targetId)) {
        follower.following.push(targetId);
      }
      if (!target.followers.includes(followerId)) {
        target.followers.push(followerId);
      }
      writeLocalDB(db);
      return true;
    }
  },

  async unfollowUser(followerId: string, targetId: string) {
    if (isUsingMongo()) {
      if (!mongoose.Types.ObjectId.isValid(followerId) || !mongoose.Types.ObjectId.isValid(targetId)) {
        return null;
      }
      await User.findByIdAndUpdate(followerId, { $pull: { following: targetId } });
      await User.findByIdAndUpdate(targetId, { $pull: { followers: followerId } });
      return true;
    } else {
      const db = readLocalDB();
      const follower = db.users.find((u: any) => u._id === followerId);
      const target = db.users.find((u: any) => u._id === targetId);
      if (!follower || !target) return null;

      follower.following = follower.following.filter((id: string) => id !== targetId);
      target.followers = target.followers.filter((id: string) => id !== followerId);
      writeLocalDB(db);
      return true;
    }
  },

  async getFollowers(userId: string) {
    if (isUsingMongo()) {
      const user = await User.findById(userId).populate("followers", "name username email avatarUrl bio techStack");
      return user ? user.followers.map(cleanDoc) : [];
    } else {
      const db = readLocalDB();
      const user = db.users.find((u: any) => u._id === userId);
      if (!user) return [];
      const followers = db.users.filter((u: any) => user.followers.includes(u._id));
      return followers.map((f: any) => {
        const c = cleanDoc(f);
        delete c.passwordHash;
        return c;
      });
    }
  },

  async getFollowing(userId: string) {
    if (isUsingMongo()) {
      const user = await User.findById(userId).populate("following", "name username email avatarUrl bio techStack");
      return user ? user.following.map(cleanDoc) : [];
    } else {
      const db = readLocalDB();
      const user = db.users.find((u: any) => u._id === userId);
      if (!user) return [];
      const following = db.users.filter((u: any) => user.following.includes(u._id));
      return following.map((f: any) => {
        const c = cleanDoc(f);
        delete c.passwordHash;
        return c;
      });
    }
  },

  async searchUsers(queryStr: string) {
    const normalized = queryStr.toLowerCase();
    if (isUsingMongo()) {
      const users = await User.find({
        $or: [
          { name: { $regex: normalized, $options: "i" } },
          { username: { $regex: normalized, $options: "i" } },
          { techStack: { $in: [new RegExp(normalized, "i")] } }
        ]
      }).select("name username email avatarUrl bio techStack followers following");
      return users.map(cleanDoc);
    } else {
      const db = readLocalDB();
      return db.users
        .filter((u: any) => 
          u.name.toLowerCase().includes(normalized) ||
          u.username.toLowerCase().includes(normalized) ||
          u.techStack.some((tech: string) => tech.toLowerCase().includes(normalized))
        )
        .map((u: any) => {
          const c = cleanDoc(u);
          delete c.passwordHash;
          return c;
        });
    }
  },

  async getSuggestedUsers(userId: string) {
    // Suggest users who share tech stack, and are not already followed
    if (isUsingMongo()) {
      const currentUser = await User.findById(userId);
      if (!currentUser) return [];

      const alreadyFollowing = currentUser.following || [];
      const suggestions = await User.find({
        _id: { $ne: currentUser._id, $nin: alreadyFollowing },
        $or: [
          { techStack: { $in: currentUser.techStack } },
          { followers: { $exists: true } } // fall back to popular users
        ]
      })
      .limit(5)
      .select("name username avatarUrl bio techStack followers");

      return suggestions.map(cleanDoc);
    } else {
      const db = readLocalDB();
      const currentUser = db.users.find((u: any) => u._id === userId);
      if (!currentUser) return db.users.slice(0, 5).map(cleanDoc);

      const alreadyFollowing = currentUser.following || [];
      const suggestions = db.users.filter((u: any) => {
        return (
          u._id !== userId &&
          !alreadyFollowing.includes(u._id)
        );
      });

      // Score suggestions by shared tech stack
      const scored = suggestions.map((u: any) => {
        const sharedTech = u.techStack.filter((tech: string) => currentUser.techStack.includes(tech));
        return { user: u, score: sharedTech.length + (u.followers?.length || 0) * 0.1 };
      });

      scored.sort((a, b) => b.score - a.score);
      return scored.slice(0, 5).map((s) => {
        const c = cleanDoc(s.user);
        delete c.passwordHash;
        return c;
      });
    }
  },

  async deleteUser(userId: string) {
    if (isUsingMongo()) {
      await User.findByIdAndDelete(userId);
      await Post.deleteMany({ author: userId });
      await Comment.deleteMany({ author: userId });
      await Notification.deleteMany({ recipient: userId });
      await RefreshToken.deleteMany({ user: userId });
      return true;
    } else {
      const db = readLocalDB();
      db.users = db.users.filter((u: any) => u._id !== userId);
      db.posts = db.posts.filter((p: any) => p.author !== userId);
      db.comments = db.comments.filter((c: any) => c.author !== userId);
      db.notifications = db.notifications.filter((n: any) => n.recipient !== userId && n.sender !== userId);
      db.refreshTokens = db.refreshTokens.filter((t: any) => t.user !== userId);
      writeLocalDB(db);
      return true;
    }
  }
};


// ==========================================
// REFRESH TOKEN SERVICES
// ==========================================
export const refreshTokenService = {
  async createRefreshToken(userId: string, token: string, expiresAt: Date) {
    if (isUsingMongo()) {
      const t = new RefreshToken({ user: userId, token, expiresAt });
      await t.save();
      return cleanDoc(t);
    } else {
      const db = readLocalDB();
      const newToken = {
        _id: generateId(),
        user: userId,
        token,
        expiresAt: expiresAt.toISOString()
      };
      db.refreshTokens.push(newToken);
      writeLocalDB(db);
      return cleanDoc(newToken);
    }
  },

  async findRefreshToken(token: string) {
    if (isUsingMongo()) {
      const t = await RefreshToken.findOne({ token });
      return t ? cleanDoc(t) : null;
    } else {
      const db = readLocalDB();
      const t = db.refreshTokens.find((rt: any) => rt.token === token);
      if (!t) return null;
      // Check expiry
      if (new Date(t.expiresAt).getTime() < Date.now()) {
        db.refreshTokens = db.refreshTokens.filter((rt: any) => rt.token !== token);
        writeLocalDB(db);
        return null;
      }
      return cleanDoc(t);
    }
  },

  async deleteRefreshToken(token: string) {
    if (isUsingMongo()) {
      await RefreshToken.deleteOne({ token });
    } else {
      const db = readLocalDB();
      db.refreshTokens = db.refreshTokens.filter((rt: any) => rt.token !== token);
      writeLocalDB(db);
    }
    return true;
  },

  async deleteUserTokens(userId: string) {
    if (isUsingMongo()) {
      await RefreshToken.deleteMany({ user: userId });
    } else {
      const db = readLocalDB();
      db.refreshTokens = db.refreshTokens.filter((rt: any) => rt.user !== userId);
      writeLocalDB(db);
    }
    return true;
  }
};


// ==========================================
// POST SERVICES
// ==========================================
export const postService = {
  async createPost(data: { authorId: string; content: string; imageUrl?: string; techTags: string[] }) {
    if (isUsingMongo()) {
      const post = new Post({
        author: data.authorId,
        content: data.content,
        imageUrl: data.imageUrl || "",
        techTags: data.techTags,
        likes: [],
        commentCount: 0,
      });
      await post.save();
      const populated = await post.populate("author", "name username avatarUrl techStack");
      return cleanDoc(populated);
    } else {
      const db = readLocalDB();
      const newPost = {
        _id: generateId(),
        author: data.authorId,
        content: data.content,
        imageUrl: data.imageUrl || "",
        techTags: data.techTags,
        likes: [],
        commentCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.posts.push(newPost);
      writeLocalDB(db);

      // Attach author details for local return
      const author = db.users.find((u: any) => u._id === data.authorId);
      const doc = cleanDoc(newPost);
      doc.author = author ? {
        id: author._id,
        name: author.name,
        username: author.username,
        avatarUrl: author.avatarUrl,
        techStack: author.techStack
      } : { id: data.authorId };
      return doc;
    }
  },

  async getPostById(id: string, currentUserId?: string) {
    if (isUsingMongo()) {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      const post = await Post.findById(id).populate("author", "name username avatarUrl techStack");
      if (!post) return null;
      const cleaned = cleanDoc(post);
      cleaned.likedByMe = currentUserId ? post.likes.some((id) => id.toString() === currentUserId) : false;
      cleaned.bookmarkedByMe = currentUserId ? await User.exists({ _id: currentUserId, savedPosts: id }).then(Boolean) : false;
      return cleaned;
    } else {
      const db = readLocalDB();
      const post = db.posts.find((p: any) => p._id === id);
      if (!post) return null;

      const author = db.users.find((u: any) => u._id === post.author);
      const cleaned = cleanDoc(post);
      cleaned.author = author ? {
        id: author._id,
        name: author.name,
        username: author.username,
        avatarUrl: author.avatarUrl,
        techStack: author.techStack
      } : { id: post.author };

      cleaned.likedByMe = currentUserId ? post.likes.includes(currentUserId) : false;
      const currentUser = currentUserId ? db.users.find((u: any) => u._id === currentUserId) : null;
      cleaned.bookmarkedByMe = currentUser ? currentUser.savedPosts?.includes(id) : false;

      return cleaned;
    }
  },

  async getFeed(params: {
    type: "latest" | "following" | "trending";
    currentUserId?: string;
    page: number;
    limit: number;
    tagFilter?: string;
    userFilter?: string; // profile username or profile id
    savedOnly?: boolean;
  }) {
    const { type, currentUserId, page, limit, tagFilter, userFilter, savedOnly } = params;
    const skip = (page - 1) * limit;

    if (isUsingMongo()) {
      let query: any = {};

      if (tagFilter) {
        query.techTags = { $in: [tagFilter] };
      }

      if (userFilter) {
        // Resolve profile first if username
        const pUser = await User.findOne({ username: userFilter });
        if (pUser) {
          query.author = pUser._id;
        } else if (mongoose.Types.ObjectId.isValid(userFilter)) {
          query.author = userFilter;
        }
      }

      if (savedOnly && currentUserId) {
        const me = await User.findById(currentUserId);
        if (me) {
          query._id = { $in: me.savedPosts };
        } else {
          return [];
        }
      }

      if (type === "following" && currentUserId) {
        const me = await User.findById(currentUserId);
        if (me && me.following && me.following.length > 0) {
          query.author = { $in: me.following };
        } else if (me) {
          query.author = { $in: [] }; // No following, empty feed
        }
      }

      let postsQuery = Post.find(query);

      if (type === "trending") {
        // Simple trending weight: likes + comments, sorted by engagement
        // Mongo Aggregation can do this, or sorted by likes array length
        postsQuery = Post.find(query);
      } else {
        postsQuery = postsQuery.sort({ createdAt: -1 });
      }

      let results = await postsQuery.populate("author", "name username avatarUrl techStack");

      if (type === "trending") {
        // Sort in memory for simplicity or custom weight
        results = results.sort((a, b) => {
          const scoreA = a.likes.length * 2 + a.commentCount * 3;
          const scoreB = b.likes.length * 2 + b.commentCount * 3;
          return scoreB - scoreA;
        });
      }

      // Paginate
      const paginated = results.slice(skip, skip + limit);

      // Map likedByMe & bookmarkedByMe
      const me = currentUserId ? await User.findById(currentUserId) : null;
      const cleanPosts = paginated.map((p) => {
        const c = cleanDoc(p);
        c.likedByMe = currentUserId ? p.likes.some((id) => id.toString() === currentUserId) : false;
        c.bookmarkedByMe = me ? me.savedPosts.some((id) => id.toString() === p._id.toString()) : false;
        return c;
      });

      return cleanPosts;
    } else {
      const db = readLocalDB();
      let filtered = [...db.posts];

      if (tagFilter) {
        const lowerTag = tagFilter.toLowerCase();
        filtered = filtered.filter((p: any) => p.techTags.some((t: string) => t.toLowerCase() === lowerTag));
      }

      if (userFilter) {
        const pUser = db.users.find((u: any) => u.username === userFilter.toLowerCase() || u._id === userFilter);
        if (pUser) {
          filtered = filtered.filter((p: any) => p.author === pUser._id);
        } else {
          filtered = [];
        }
      }

      if (savedOnly && currentUserId) {
        const me = db.users.find((u: any) => u._id === currentUserId);
        if (me) {
          const savedIds = me.savedPosts || [];
          filtered = filtered.filter((p: any) => savedIds.includes(p._id));
        } else {
          filtered = [];
        }
      }

      if (type === "following" && currentUserId) {
        const me = db.users.find((u: any) => u._id === currentUserId);
        if (me && me.following && me.following.length > 0) {
          filtered = filtered.filter((p: any) => me.following.includes(p.author));
        } else {
          filtered = [];
        }
      }

      // Sort
      if (type === "trending") {
        filtered.sort((a: any, b: any) => {
          const scoreA = (a.likes?.length || 0) * 2 + (a.commentCount || 0) * 3;
          const scoreB = (b.likes?.length || 0) * 2 + (b.commentCount || 0) * 3;
          return scoreB - scoreA;
        });
      } else {
        // Latest
        filtered.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }

      // Paginate
      const paginated = filtered.slice(skip, skip + limit);

      // Populate authors & interactive states
      const me = currentUserId ? db.users.find((u: any) => u._id === currentUserId) : null;
      return paginated.map((p: any) => {
        const author = db.users.find((u: any) => u._id === p.author);
        const c = cleanDoc(p);
        c.author = author ? {
          id: author._id,
          name: author.name,
          username: author.username,
          avatarUrl: author.avatarUrl,
          techStack: author.techStack
        } : { id: p.author };

        c.likedByMe = currentUserId ? p.likes.includes(currentUserId) : false;
        c.bookmarkedByMe = me ? me.savedPosts?.includes(p._id) : false;
        return c;
      });
    }
  },

  async searchPosts(queryStr: string, currentUserId?: string) {
    const normalized = queryStr.toLowerCase();
    if (isUsingMongo()) {
      const posts = await Post.find({
        $or: [
          { content: { $regex: normalized, $options: "i" } },
          { techTags: { $in: [new RegExp(normalized, "i")] } }
        ]
      })
      .sort({ createdAt: -1 })
      .populate("author", "name username avatarUrl techStack");

      const me = currentUserId ? await User.findById(currentUserId) : null;
      return posts.map((p) => {
        const c = cleanDoc(p);
        c.likedByMe = currentUserId ? p.likes.some((id) => id.toString() === currentUserId) : false;
        c.bookmarkedByMe = me ? me.savedPosts.some((id) => id.toString() === p._id.toString()) : false;
        return c;
      });
    } else {
      const db = readLocalDB();
      const matched = db.posts.filter((p: any) => 
        p.content.toLowerCase().includes(normalized) ||
        p.techTags.some((tag: string) => tag.toLowerCase().includes(normalized))
      );

      matched.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const me = currentUserId ? db.users.find((u: any) => u._id === currentUserId) : null;
      return matched.map((p: any) => {
        const author = db.users.find((u: any) => u._id === p.author);
        const c = cleanDoc(p);
        c.author = author ? {
          id: author._id,
          name: author.name,
          username: author.username,
          avatarUrl: author.avatarUrl,
          techStack: author.techStack
        } : { id: p.author };

        c.likedByMe = currentUserId ? p.likes.includes(currentUserId) : false;
        c.bookmarkedByMe = me ? me.savedPosts?.includes(p._id) : false;
        return c;
      });
    }
  },

  async likePost(userId: string, postId: string) {
    if (isUsingMongo()) {
      if (!mongoose.Types.ObjectId.isValid(postId) || !mongoose.Types.ObjectId.isValid(userId)) {
        return null;
      }
      const post = await Post.findByIdAndUpdate(postId, { $addToSet: { likes: userId } }, { new: true });
      return post ? cleanDoc(post) : null;
    } else {
      const db = readLocalDB();
      const post = db.posts.find((p: any) => p._id === postId);
      if (!post) return null;

      if (!post.likes.includes(userId)) {
        post.likes.push(userId);
      }
      writeLocalDB(db);
      return cleanDoc(post);
    }
  },

  async unlikePost(userId: string, postId: string) {
    if (isUsingMongo()) {
      if (!mongoose.Types.ObjectId.isValid(postId) || !mongoose.Types.ObjectId.isValid(userId)) {
        return null;
      }
      const post = await Post.findByIdAndUpdate(postId, { $pull: { likes: userId } }, { new: true });
      return post ? cleanDoc(post) : null;
    } else {
      const db = readLocalDB();
      const post = db.posts.find((p: any) => p._id === postId);
      if (!post) return null;

      post.likes = post.likes.filter((id: string) => id !== userId);
      writeLocalDB(db);
      return cleanDoc(post);
    }
  },

  async bookmarkPost(userId: string, postId: string) {
    if (isUsingMongo()) {
      if (!mongoose.Types.ObjectId.isValid(postId) || !mongoose.Types.ObjectId.isValid(userId)) {
        return null;
      }
      await User.findByIdAndUpdate(userId, { $addToSet: { savedPosts: postId } });
      return true;
    } else {
      const db = readLocalDB();
      const user = db.users.find((u: any) => u._id === userId);
      if (!user) return null;

      user.savedPosts = user.savedPosts || [];
      if (!user.savedPosts.includes(postId)) {
        user.savedPosts.push(postId);
      }
      writeLocalDB(db);
      return true;
    }
  },

  async unbookmarkPost(userId: string, postId: string) {
    if (isUsingMongo()) {
      if (!mongoose.Types.ObjectId.isValid(postId) || !mongoose.Types.ObjectId.isValid(userId)) {
        return null;
      }
      await User.findByIdAndUpdate(userId, { $pull: { savedPosts: postId } });
      return true;
    } else {
      const db = readLocalDB();
      const user = db.users.find((u: any) => u._id === userId);
      if (!user) return null;

      user.savedPosts = user.savedPosts || [];
      user.savedPosts = user.savedPosts.filter((id: string) => id !== postId);
      writeLocalDB(db);
      return true;
    }
  },

  async updatePost(postId: string, content: string, imageUrl?: string, techTags?: string[]) {
    if (isUsingMongo()) {
      const updates: any = { content, updatedAt: new Date() };
      if (imageUrl !== undefined) updates.imageUrl = imageUrl;
      if (techTags !== undefined) updates.techTags = techTags;

      const post = await Post.findByIdAndUpdate(postId, { $set: updates }, { new: true }).populate("author", "name username avatarUrl techStack");
      return post ? cleanDoc(post) : null;
    } else {
      const db = readLocalDB();
      const postIndex = db.posts.findIndex((p: any) => p._id === postId);
      if (postIndex === -1) return null;

      const p = db.posts[postIndex];
      p.content = content;
      if (imageUrl !== undefined) p.imageUrl = imageUrl;
      if (techTags !== undefined) p.techTags = techTags;
      p.updatedAt = new Date().toISOString();

      writeLocalDB(db);

      const author = db.users.find((u: any) => u._id === p.author);
      const c = cleanDoc(p);
      c.author = author ? {
        id: author._id,
        name: author.name,
        username: author.username,
        avatarUrl: author.avatarUrl,
        techStack: author.techStack
      } : { id: p.author };
      return c;
    }
  },

  async deletePost(postId: string) {
    if (isUsingMongo()) {
      const post = await Post.findByIdAndDelete(postId);
      if (post) {
        // Cascade delete comments
        await Comment.deleteMany({ post: postId });
        // Delete post ref in savedPosts
        await User.updateMany({}, { $pull: { savedPosts: postId } });
        return true;
      }
      return false;
    } else {
      const db = readLocalDB();
      const exists = db.posts.some((p: any) => p._id === postId);
      if (!exists) return false;

      db.posts = db.posts.filter((p: any) => p._id !== postId);
      db.comments = db.comments.filter((c: any) => c.post !== postId);
      db.users.forEach((u: any) => {
        if (u.savedPosts) {
          u.savedPosts = u.savedPosts.filter((id: string) => id !== postId);
        }
      });
      writeLocalDB(db);
      return true;
    }
  }
};


// ==========================================
// COMMENT SERVICES
// ==========================================
export const commentService = {
  async createComment(data: { postId: string; authorId: string; content: string; parentCommentId?: string }) {
    if (isUsingMongo()) {
      const comment = new Comment({
        post: data.postId,
        author: data.authorId,
        parentComment: data.parentCommentId || null,
        content: data.content,
        likes: [],
        isDeleted: false
      });
      await comment.save();

      // Update post comment count
      await Post.findByIdAndUpdate(data.postId, { $inc: { commentCount: 1 } });

      const populated = await comment.populate("author", "name username avatarUrl techStack");
      return cleanDoc(populated);
    } else {
      const db = readLocalDB();
      const newComment = {
        _id: generateId(),
        post: data.postId,
        author: data.authorId,
        parentComment: data.parentCommentId || null,
        content: data.content,
        likes: [],
        isDeleted: false,
        createdAt: new Date().toISOString()
      };
      db.comments.push(newComment);

      // Increment post commentCount
      const post = db.posts.find((p: any) => p._id === data.postId);
      if (post) {
        post.commentCount = (post.commentCount || 0) + 1;
      }

      writeLocalDB(db);

      const author = db.users.find((u: any) => u._id === data.authorId);
      const c = cleanDoc(newComment);
      c.author = author ? {
        id: author._id,
        name: author.name,
        username: author.username,
        avatarUrl: author.avatarUrl,
        techStack: author.techStack
      } : { id: data.authorId };
      return c;
    }
  },

  async getPostComments(postId: string, currentUserId?: string) {
    if (isUsingMongo()) {
      // Find all comments for this post
      const comments = await Comment.find({ post: postId })
        .sort({ createdAt: 1 })
        .populate("author", "name username avatarUrl techStack");

      return comments.map((comment) => {
        const c = cleanDoc(comment);
        c.likedByMe = currentUserId ? comment.likes.some((id) => id.toString() === currentUserId) : false;
        return c;
      });
    } else {
      const db = readLocalDB();
      const postComments = db.comments.filter((c: any) => c.post === postId);
      postComments.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      return postComments.map((c: any) => {
        const author = db.users.find((u: any) => u._id === c.author);
        const doc = cleanDoc(c);
        doc.author = author ? {
          id: author._id,
          name: author.name,
          username: author.username,
          avatarUrl: author.avatarUrl,
          techStack: author.techStack
        } : { id: c.author };
        doc.likedByMe = currentUserId ? c.likes.includes(currentUserId) : false;
        return doc;
      });
    }
  },

  async getCommentById(id: string) {
    if (isUsingMongo()) {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      const comment = await Comment.findById(id).populate("author", "name username avatarUrl techStack");
      return comment ? cleanDoc(comment) : null;
    } else {
      const db = readLocalDB();
      const comment = db.comments.find((c: any) => c._id === id);
      if (!comment) return null;

      const author = db.users.find((u: any) => u._id === comment.author);
      const doc = cleanDoc(comment);
      doc.author = author ? {
        id: author._id,
        name: author.name,
        username: author.username,
        avatarUrl: author.avatarUrl,
        techStack: author.techStack
      } : { id: comment.author };
      return doc;
    }
  },

  async likeComment(userId: string, commentId: string) {
    if (isUsingMongo()) {
      if (!mongoose.Types.ObjectId.isValid(commentId)) return null;
      const comment = await Comment.findByIdAndUpdate(commentId, { $addToSet: { likes: userId } }, { new: true });
      return comment ? cleanDoc(comment) : null;
    } else {
      const db = readLocalDB();
      const comment = db.comments.find((c: any) => c._id === commentId);
      if (!comment) return null;

      if (!comment.likes.includes(userId)) {
        comment.likes.push(userId);
      }
      writeLocalDB(db);
      return cleanDoc(comment);
    }
  },

  async unlikeComment(userId: string, commentId: string) {
    if (isUsingMongo()) {
      if (!mongoose.Types.ObjectId.isValid(commentId)) return null;
      const comment = await Comment.findByIdAndUpdate(commentId, { $pull: { likes: userId } }, { new: true });
      return comment ? cleanDoc(comment) : null;
    } else {
      const db = readLocalDB();
      const comment = db.comments.find((c: any) => c._id === commentId);
      if (!comment) return null;

      comment.likes = comment.likes.filter((id: string) => id !== userId);
      writeLocalDB(db);
      return cleanDoc(comment);
    }
  },

  async deleteComment(commentId: string) {
    if (isUsingMongo()) {
      const comment = await Comment.findById(commentId);
      if (!comment) return false;

      // Soft delete check: if it has replies, we mark as deleted. Otherwise, we can hard delete!
      const hasReplies = await Comment.exists({ parentComment: commentId });
      if (hasReplies) {
        comment.isDeleted = true;
        comment.content = "[deleted]";
        await comment.save();
      } else {
        await Comment.findByIdAndDelete(commentId);
        // Decrement post commentCount
        await Post.findByIdAndUpdate(comment.post, { $inc: { commentCount: -1 } });
      }
      return true;
    } else {
      const db = readLocalDB();
      const commentIndex = db.comments.findIndex((c: any) => c._id === commentId);
      if (commentIndex === -1) return false;

      const comment = db.comments[commentIndex];
      const hasReplies = db.comments.some((c: any) => c.parentComment === commentId);

      if (hasReplies) {
        comment.isDeleted = true;
        comment.content = "[deleted]";
      } else {
        db.comments.splice(commentIndex, 1);
        // Decrement post commentCount
        const post = db.posts.find((p: any) => p._id === comment.post);
        if (post) {
          post.commentCount = Math.max(0, (post.commentCount || 0) - 1);
        }
      }

      writeLocalDB(db);
      return true;
    }
  }
};


// ==========================================
// NOTIFICATION SERVICES
// ==========================================
export const notificationService = {
  async createNotification(data: {
    recipientId: string;
    senderId: string;
    type: "follow" | "like" | "comment" | "reply";
    postId?: string;
    commentId?: string;
  }) {
    // Avoid self-notifications
    if (data.recipientId === data.senderId) return null;

    if (isUsingMongo()) {
      const notif = new Notification({
        recipient: data.recipientId,
        sender: data.senderId,
        type: data.type,
        post: data.postId || null,
        comment: data.commentId || null,
        isRead: false
      });
      await notif.save();
      const populated = await notif.populate("sender", "name username avatarUrl");
      return cleanDoc(populated);
    } else {
      const db = readLocalDB();
      const newNotif = {
        _id: generateId(),
        recipient: data.recipientId,
        sender: data.senderId,
        type: data.type,
        post: data.postId || null,
        comment: data.commentId || null,
        isRead: false,
        createdAt: new Date().toISOString()
      };
      db.notifications.push(newNotif);
      writeLocalDB(db);

      const sender = db.users.find((u: any) => u._id === data.senderId);
      const doc = cleanDoc(newNotif);
      doc.sender = sender ? {
        id: sender._id,
        name: sender.name,
        username: sender.username,
        avatarUrl: sender.avatarUrl
      } : { id: data.senderId };
      return doc;
    }
  },

  async getNotifications(recipientId: string) {
    if (isUsingMongo()) {
      const list = await Notification.find({ recipient: recipientId })
        .sort({ createdAt: -1 })
        .populate("sender", "name username avatarUrl")
        .populate("post", "content");
      return list.map(cleanDoc);
    } else {
      const db = readLocalDB();
      const list = db.notifications.filter((n: any) => n.recipient === recipientId);
      list.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return list.map((n: any) => {
        const sender = db.users.find((u: any) => u._id === n.sender);
        const post = db.posts.find((p: any) => p._id === n.post);
        const doc = cleanDoc(n);
        doc.sender = sender ? {
          id: sender._id,
          name: sender.name,
          username: sender.username,
          avatarUrl: sender.avatarUrl
        } : { id: n.sender };
        doc.post = post ? {
          id: post._id,
          content: post.content
        } : null;
        return doc;
      });
    }
  },

  async markNotificationAsRead(id: string) {
    if (isUsingMongo()) {
      await Notification.findByIdAndUpdate(id, { isRead: true });
    } else {
      const db = readLocalDB();
      const notif = db.notifications.find((n: any) => n._id === id);
      if (notif) {
        notif.isRead = true;
        writeLocalDB(db);
      }
    }
    return true;
  },

  async markAllNotificationsAsRead(recipientId: string) {
    if (isUsingMongo()) {
      await Notification.updateMany({ recipient: recipientId }, { isRead: true });
    } else {
      const db = readLocalDB();
      db.notifications.forEach((n: any) => {
        if (n.recipient === recipientId) {
          n.isRead = true;
        }
      });
      writeLocalDB(db);
    }
    return true;
  },

  async getUnreadCount(recipientId: string) {
    if (isUsingMongo()) {
      return await Notification.countDocuments({ recipient: recipientId, isRead: false });
    } else {
      const db = readLocalDB();
      return db.notifications.filter((n: any) => n.recipient === recipientId && !n.isRead).length;
    }
  }
};


// ==========================================
// STATS SERVICES
// ==========================================
export const statsService = {
  async getPublicStats() {
    if (isUsingMongo()) {
      const totalUsers = await User.countDocuments();
      const totalPosts = await Post.countDocuments();
      const totalComments = await Comment.countDocuments();
      return { totalUsers, totalPosts, totalComments, databaseType: "MongoDB Atlas (Production)" };
    } else {
      const db = readLocalDB();
      return {
        totalUsers: db.users.length,
        totalPosts: db.posts.length,
        totalComments: db.comments.length,
        databaseType: "Local Sandbox Fallback (Temporary/Stateless)"
      };
    }
  }
};
