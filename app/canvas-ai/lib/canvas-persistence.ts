import { createClient } from '@/utils/supabase/client';

const supabase = createClient();

// Types for storing and retrieving snapshots
export type CanvasSnapshot = {
  document: any;
  is_shared?: boolean;
};

// Function to save canvas state
export async function saveCanvasState(
  documentId: string,
  userId: string,
  document: any,
  isShared: boolean = false,
  canvasTitle?: string
): Promise<boolean> {
  try {
    // Ensure we're not trying to save null or undefined
    if (!document) {
      console.error('Attempted to save empty document');
      return false;
    }

    // Check if a document with this ID exists, but handle the "no rows" case
    const { data, error: selectError } = await supabase
      .from('canvas_snapshots')
      .select('id, title')
      .eq('document_id', documentId)
      .eq('user_id', userId)
      .maybeSingle();
    
    if (selectError) {
      console.error('Error checking for existing document:', selectError);
    }
    
    if (data) {
      // Prepare update payload - always include document, is_shared and updated_at
      const updatePayload: any = {
        document,
        is_shared: isShared,
        updated_at: new Date().toISOString(),
      };
      
      // Only update the title if explicitly provided and not the default value
      // or if the existing title is null/undefined
      if (canvasTitle !== undefined && (canvasTitle !== 'Untitled' || !data.title)) {
        updatePayload.title = canvasTitle;
      }
      
      // Update existing record
      const { error } = await supabase
        .from('canvas_snapshots')
        .update(updatePayload)
        .eq('id', data.id);
      return !error;
    } else {
      // Insert new record - use the provided title or 'Untitled' as default
      const finalTitle = canvasTitle !== undefined ? canvasTitle : 'Untitled';
      // Insert new record
      const { error } = await supabase
        .from('canvas_snapshots')
        .insert({
          document_id: documentId,
          user_id: userId,
          document,
          is_shared: isShared,
          updated_at: new Date().toISOString(),
          title: finalTitle,
        });
      return !error;
    }
  } catch (err) {
    console.error('Failed to save canvas state:', err);
    return false;
  }
}

// Function to load canvas state for a specific user
export async function loadCanvasState(
  documentId: string,
  userId: string
): Promise<CanvasSnapshot | null> {
  try {
    const { data, error } = await supabase
      .from('canvas_snapshots')
      .select('document, is_shared')
      .eq('document_id', documentId)
      .eq('user_id', userId)
      .maybeSingle();
      
    if (error || !data) return null;
    return {
      document: data.document,
      is_shared: data.is_shared
    };
  } catch (err) {
    console.error('Failed to load canvas state:', err);
    return null;
  }
}

// Function to load shared canvas state by document ID
export async function loadSharedCanvasState(documentId: string): Promise<CanvasSnapshot | null> {
  try {
    const { data, error } = await supabase
      .from('canvas_snapshots')
      .select('document, user_id')
      .eq('document_id', documentId)
      .eq('is_shared', true)
      .maybeSingle();
      
    if (error || !data) return null;
    return {
      document: data.document,
      is_shared: true
    };
  } catch (err) {
    console.error('Failed to load shared canvas state:', err);
    return null;
  }
}

// Function to get a complete snapshot (compatible with previous API)
export async function getSnapshot(
  documentId: string, 
  userId: string
): Promise<CanvasSnapshot | null> {
  try {
    // First try to load the user's own canvas
    const userCanvas = await loadCanvasState(documentId, userId);
    
    if (userCanvas) {
      return userCanvas;
    }
    
    // If no user-specific canvas exists, try to load a shared one
    const sharedCanvas = await loadSharedCanvasState(documentId);
    if (sharedCanvas) {
      return sharedCanvas;
    }
    
    // If neither exists, return null
    return null;
  } catch (err) {
    console.error('Error getting snapshot:', err);
    return null;
  }
}

// Generate a unique document ID using crypto
export function generateDocumentId(): string {
  // Use crypto API to generate a random ID
  if (typeof window !== 'undefined') {
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  // Fallback for server side
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Get user email from Supabase Auth
export async function getUserId(isViewMode: boolean = false): Promise<string> {
  if (typeof window === 'undefined') return '';
  
  try {
    // Try to get the user from Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser();
    
    // If we have a logged in user, use their email as the user ID
    if (user && user.email) {
      return user.email;
    }
    
    // If there's no authenticated user but we're in view mode, return 'public' instead of throwing
    if (isViewMode) {
      return 'public';
    }
    
    // If there's no authenticated user and not in view mode, throw an error
    throw new Error('No authenticated user found');
  } catch (err) {
    console.error('Error getting authenticated user:', err);
    if (isViewMode) {
      return 'public';
    }
    throw err;
  }
}

// Function to update sharing status
export async function updateSharingStatus(
  documentId: string,
  userId: string,
  isShared: boolean
): Promise<boolean> {
  try {
    const { data, error: selectError } = await supabase
      .from('canvas_snapshots')
      .select('id')
      .eq('document_id', documentId)
      .eq('user_id', userId)
      .maybeSingle();
    
    if (selectError || !data) {
      console.error('Error finding document to update sharing status:', selectError);
      return false;
    }
    
    const { error } = await supabase
      .from('canvas_snapshots')
      .update({
        is_shared: isShared,
        updated_at: new Date().toISOString()
      })
      .eq('id', data.id);
    
    return !error;
  } catch (err) {
    console.error('Failed to update sharing status:', err);
    return false;
  }
}

// Function to list all documents owned by a user
export async function listUserDocuments(userId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('canvas_snapshots')
      .select('document_id, created_at, updated_at, is_shared, title')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
      
    if (error || !data) return [];
    return data;
  } catch (err) {
    console.error('Failed to list user documents:', err);
    return [];
  }
}

// Function to update canvas title
export async function updateCanvasTitle(
  documentId: string,
  userId: string,
  title: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('canvas_snapshots')
      .update({ 
        title,
        updated_at: new Date().toISOString()
      })
      .eq('document_id', documentId)
      .eq('user_id', userId);
      
    return !error;
  } catch (err) {
    console.error('Failed to update canvas title:', err);
    return false;
  }
}

// Function to delete a document
export async function deleteDocument(
  documentId: string,
  userId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('canvas_snapshots')
      .delete()
      .eq('document_id', documentId)
      .eq('user_id', userId);
      
    return !error;
  } catch (err) {
    console.error('Failed to delete document:', err);
    return false;
  }
}