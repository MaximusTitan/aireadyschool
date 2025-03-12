"use client";

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Edit, 
  Trash2, 
  Plus, 
  FileText, 
  Loader2 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Document {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export default function DocumentList() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();
  const router = useRouter();

  // Fetch documents
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user?.email) {
          toast.error("Please sign in to view your documents");
          router.push('/login');
          return;
        }
        
        const { data, error } = await supabase
          .from('document_generator')
          .select('id, title, created_at, updated_at')
          .eq('email', session.user.email)
          .order('updated_at', { ascending: false });
          
        if (error) throw error;
        
        setDocuments(data || []);
      } catch (error) {
        console.error('Error fetching documents:', error);
        toast.error("Failed to load documents");
      } finally {
        setLoading(false);
      }
    };
    
    fetchDocuments();
  }, [supabase, router]);

  // Create new document
  const createNewDocument = () => {
    router.push('/tools/document-generator');
  };

  // Edit document
  const editDocument = (id: string) => {
    router.push(`/tools/document-generator?id=${id}`);
  };

  // Delete document
  const deleteDocument = async (id: string) => {
    try {
      // Soft delete by setting is_deleted to true
      const { error } = await supabase
        .from('document_generator')  // Updated table name
        .update({ is_deleted: true })
        .eq('id', id);
        
      if (error) {
        throw error;
      }
      
      // Update state to remove deleted document
      setDocuments(documents.filter(doc => doc.id !== id));
      
      toast.success("Document deleted successfully");
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error("Failed to delete document");
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Documents</h1>
        <Button onClick={createNewDocument} className="flex items-center gap-2">
          <Plus size={16} />
          New Document
        </Button>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-gray-50">
          <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">No documents yet</h3>
          <p className="text-gray-500 mb-4">Create your first document to get started</p>
          <Button onClick={createNewDocument}>Create Document</Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document Title</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Last Modified</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell 
                  className="font-medium cursor-pointer hover:text-primary"
                  onClick={() => editDocument(doc.id)}
                >
                  {doc.title || 'Untitled Document'}
                </TableCell>
                <TableCell>
                  {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}
                </TableCell>
                <TableCell>
                  {formatDistanceToNow(new Date(doc.updated_at), { addSuffix: true })}
                </TableCell>
                <TableCell className="text-right">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => editDocument(doc.id)}
                    className="text-gray-500 hover:text-primary"
                  >
                    <Edit size={16} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => deleteDocument(doc.id)}
                    className="text-gray-500 hover:text-destructive"
                  >
                    <Trash2 size={16} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
