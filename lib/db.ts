import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export const saveDocumentToDatabase = async (documentData: {
  email: string;
  title: string;
  content: string;
  id?: string;
}) => {
  const supabase = createClientComponentClient();
  console.log('Attempting to save document:', {
    title: documentData.title,
    contentLength: documentData.content.length,
    isUpdate: !!documentData.id
  });

  try {
    if (documentData.id) {
      const { data, error } = await supabase
        .from('document_generator')
        .update({
          title: documentData.title,
          content: documentData.content,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentData.id)
        .eq('email', documentData.email)
        .select()
        .single();

      if (error) throw error;
      console.log('Document updated successfully:', data);
      return { data, error: null };
    } else {
      const { data, error } = await supabase
        .from('document_generator')
        .insert([{
          email: documentData.email,
          title: documentData.title,
          content: documentData.content
        }])
        .select()
        .single();

      if (error) throw error;
      console.log('Document created successfully:', data);
      return { data, error: null };
    }
  } catch (error) {
    console.error('Database operation failed:', error);
    return { data: null, error };
  }
};

export const loadDocumentFromDatabase = async (id: string) => {
  const supabase = createClientComponentClient();

  try {
    // Get current session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.email) {
      throw new Error('No authenticated user');
    }

    const { data, error } = await supabase
      .from('document_generator')
      .select('*')
      .eq('id', id)
      .eq('email', session.user.email)
      .eq('is_deleted', false)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error loading document:', error);
    return { data: null, error };
  }
};

export const getAllDocuments = async () => {
  const supabase = createClientComponentClient();

  try {
    const { data, error } = await supabase
      .from('document_generator')
      .select('*')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching documents:', error);
    return { data: null, error };
  }
};
