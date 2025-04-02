import { nanoid } from 'nanoid';
import { createClient } from '@/utils/supabase/client';

const supabase = createClient();
// Types for storing and retrieving snapshots
export type CanvasSnapshot = {
  document: any;
  session?: any;
  schema?: any;
};

// Function to save document state
export async function saveDocumentState(documentId: string, document: any): Promise<boolean> {
  try {
    // Ensure we're not trying to save null or undefined
    if (!document) {
      console.error('Attempted to save empty document');
      return false;
    }

    // Check if a document with this ID exists, but handle the "no rows" case
    const { data, error: selectError } = await supabase
      .from('canvas_snapshots')
      .select('id')
      .eq('document_id', documentId)
      .maybeSingle(); // Use maybeSingle instead of single to avoid errors when no rows are found
    
    if (selectError) {
      console.error('Error checking for existing document:', selectError);
    }
    
    if (data) {
      // Update existing record
      const { error } = await supabase
        .from('canvas_snapshots')
        .update({
          document,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.id);
      return !error;
    } else {
      // Insert new record
      const { error } = await supabase
        .from('canvas_snapshots')
        .insert({
          document_id: documentId,
          document,
          updated_at: new Date().toISOString()
        });
      return !error;
    }
  } catch (err) {
    console.error('Failed to save document state:', err);
    return false;
  }
}

// Function to save session state
export async function saveSessionState(
  documentId: string, 
  userId: string, 
  session: any
): Promise<boolean> {
  try {
    // Check if a session exists, but handle the "no rows" case
    const { data, error: selectError } = await supabase
      .from('canvas_sessions')
      .select('id')
      .eq('document_id', documentId)
      .eq('user_id', userId)
      .maybeSingle(); // Use maybeSingle instead of single
    
    if (selectError) {
      console.error('Error checking for existing session:', selectError);
    }
    
    if (data) {
      // Update existing record
      const { error } = await supabase
        .from('canvas_sessions')
        .update({
          session,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.id);
      return !error;
    } else {
      // Insert new record
      const { error } = await supabase
        .from('canvas_sessions')
        .insert({
          document_id: documentId,
          user_id: userId,
          session,
          updated_at: new Date().toISOString()
        });
      return !error;
    }
  } catch (err) {
    console.error('Failed to save session state:', err);
    return false;
  }
}

// Function to load document state
export async function loadDocumentState(documentId: string): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from('canvas_snapshots')
      .select('document')
      .eq('document_id', documentId)
      .maybeSingle(); // Use maybeSingle instead of single
      
    if (error || !data) return null;
    return data.document;
  } catch (err) {
    console.error('Failed to load document state:', err);
    return null;
  }
}

// Function to load session state
export async function loadSessionState(
  documentId: string, 
  userId: string
): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from('canvas_sessions')
      .select('session')
      .eq('document_id', documentId)
      .eq('user_id', userId)
      .maybeSingle(); // Use maybeSingle instead of single
      
    if (error || !data) return null;
    return data.session;
  } catch (err) {
    console.error('Failed to load session state:', err);
    return null;
  }
}

// Function to get a complete snapshot
export async function getSnapshot(
  documentId: string, 
  userId: string
): Promise<CanvasSnapshot | null> {
  try {
    const document = await loadDocumentState(documentId);
    
    if (!document) {
      // Return null if no document exists yet
      return null;
    }
    
    const session = await loadSessionState(documentId, userId);
    
    // Return the document directly without wrapping in a schema structure
    // The drawing-canvas component will handle the proper structure
    return { 
      document,
      session: session || undefined
    };
  } catch (err) {
    console.error('Error getting snapshot:', err);
    return null;
  }
}

// Generate a unique document ID
export function generateDocumentId(): string {
  return nanoid();
}

// Get or create a user ID from local storage
export function getUserId(): string {
  if (typeof window === 'undefined') return '';
  
  let userId = localStorage.getItem('canvas_user_id');
  if (!userId) {
    userId = `user_${nanoid()}`;
    localStorage.setItem('canvas_user_id', userId);
  }
  return userId;
}
