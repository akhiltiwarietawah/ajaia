export type Role = "editor" | "viewer";

export interface DemoUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export interface DocumentShareInfo {
  id: string;
  documentId: string;
  userId: string;
  role: Role;
  createdAt: Date | string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
}

export interface DocumentWithRelations {
  id: string;
  title: string;
  content: string;
  ownerId: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  owner: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
  shares: DocumentShareInfo[];
}

export interface AccessCheckResult {
  hasAccess: boolean;
  isOwner: boolean;
  role: Role | "owner" | null;
  reason?: string;
}
