export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  techStack: string[];
  githubUrl?: string;
  linkedinUrl?: string;
  followers: string[];
  following: string[];
  savedPosts: string[];
  isPrivate: boolean;
  createdAt: string;
  isFollowing?: boolean;
}

export interface Post {
  id: string;
  author: {
    id: string;
    name: string;
    username: string;
    avatarUrl?: string;
    techStack: string[];
  };
  content: string;
  imageUrl?: string;
  techTags: string[];
  likes: string[];
  commentCount: number;
  createdAt: string;
  updatedAt: string;
  likedByMe?: boolean;
  bookmarkedByMe?: boolean;
}

export interface Comment {
  id: string;
  post: string;
  author: {
    id: string;
    name: string;
    username: string;
    avatarUrl?: string;
    techStack: string[];
  };
  parentComment?: string | null;
  content: string;
  likes: string[];
  isDeleted: boolean;
  createdAt: string;
  likedByMe?: boolean;
}

export interface Notification {
  id: string;
  recipient: string;
  sender: {
    id: string;
    name: string;
    username: string;
    avatarUrl?: string;
  };
  type: "follow" | "like" | "comment" | "reply";
  post?: {
    id: string;
    content: string;
  } | null;
  comment?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface PublicStats {
  totalUsers: number;
  totalPosts: number;
  totalComments: number;
}
