"use client";

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';

export default function SupabaseDebug() {
  const [result, setResult] = useState<string>('No test run yet');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClientComponentClient();

  const testConnection = async () => {
    setLoading(true);
    try {
      // Test 1: Check auth
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        setResult(`Auth Error: ${userError.message}`);
        return;
      }
      setUser(userData.user);
      
      if (!userData.user) {
        setResult('Not logged in! Please login first.');
        return;
      }

      // Test 2: Try simple insert
      const testData = {
        user_id: userData.user.id,
        title: 'Debug Test Document',
        content: '<p>Test content</p>',
      };
      
      const { data, error } = await supabase
        .from('document_generator')
        .insert([testData])
        .select();
        
      if (error) {
        setResult(`Database Error: ${error.message}`);
        return;
      }
      
      // Test 3: Delete the test document
      if (data && data.length > 0) {
        const deleteId = data[0].id;
        const { error: deleteError } = await supabase
          .from('document_generator')
          .delete()
          .eq('id', deleteId);
          
        if (deleteError) {
          setResult(`Delete Error: ${deleteError.message}, but insert worked!`);
          return;
        }
        
        setResult('Success! Full test completed - insert and delete worked.');
      }
    } catch (err) {
      setResult(`Unexpected Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Supabase Connection Debug</h1>
      
      <div className="mb-4">
        <Button onClick={testConnection} disabled={loading}>
          {loading ? 'Testing...' : 'Test Database Connection'}
        </Button>
      </div>
      
      <div className="mb-4 p-4 border rounded bg-gray-50">
        <h2 className="font-semibold mb-2">Result:</h2>
        <pre className="whitespace-pre-wrap">{result}</pre>
      </div>
      
      {user && (
        <div className="p-4 border rounded bg-gray-50">
          <h2 className="font-semibold mb-2">User Info:</h2>
          <pre className="whitespace-pre-wrap text-sm">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>
      )}
      
      <div className="mt-4">
        <p className="text-sm text-gray-500">
          Visit <a href="/tools/document-generator/debug" className="text-blue-500 underline">/tools/document-generator/debug</a> to run this test.
        </p>
      </div>
    </div>
  );
}
