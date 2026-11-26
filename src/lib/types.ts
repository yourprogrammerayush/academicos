export type ResourceType =
  | 'Notes'
  | 'Syllabus'
  | 'PYQ'
  | 'Assignment'
  | 'Presentation'
  | 'Video'
  | 'Audio'
  | 'Image'
  | 'Document'
  | 'Other';

export type FileKind = 'pdf' | 'video' | 'audio' | 'image' | 'text' | 'doc' | 'other';

export interface CatalogFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  parents?: string[];
  path: string[];
  year?: string;
  semester?: string;
  subject?: string;
  type: ResourceType;
  kind: FileKind;
  demo?: boolean;
  webViewLink?: string;
}

export interface CatalogFolder {
  id: string;
  name: string;
  parentId: string | null;
  path: string[];
}

export interface Catalog {
  files: CatalogFile[];
  folders: CatalogFolder[];
  indexedAt: string;
  source: 'drive' | 'demo';
  rootName: string;
}

export interface Collection {
  id: string;
  name: string;
  fileIds: string[];
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  fileIds?: string[];
  createdAt: number;
}

export interface ChatThread {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
}
