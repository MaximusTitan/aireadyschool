import { createClient } from './client';

export async function fetchQuestions() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('evaluator_questions')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching questions:', error);
    return [];
  }
  return data;
}

export async function addQuestion(text: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('evaluator_questions')
    .insert({ text })
    .select()
    .single();
  
  if (error) {
    console.error('Error adding question:', error);
    return null;
  }
  return data;
}

export async function deleteQuestion(id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('evaluator_questions')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting question:', error);
  }
}

export async function fetchAnswers() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('evaluator_answers')
    .select('*');
  
  if (error) {
    console.error('Error fetching answers:', error);
    return [];
  }
  return data;
}

export async function submitAnswer(questionId: string, text: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('evaluator_answers')
    .insert({ question_id: questionId, text })
    .select()
    .single();
  
  if (error) {
    console.error('Error submitting answer:', error);
    return null;
  }
  return data;
}

export async function deleteAnswer(questionId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('evaluator_answers')
    .delete()
    .eq('question_id', questionId);
  
  if (error) {
    console.error('Error deleting answer:', error);
  }
}

