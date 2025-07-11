export interface Voice {
  id: string;
  name: string;
  voiceId: string;
  createdAt: string;
}

export interface UploadStatus {
  success?: boolean;
  message?: string;
}
