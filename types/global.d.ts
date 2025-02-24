interface Window {
  Intercom: any;
  intercomSettings?: {
    app_id: string;
    email: string;
    user_hash: string;
    name?: string;
    created_at?: number;
  };
}
