import { createClient } from '@/utils/supabase/client';

export interface ComicData {
  prompt: string;
  image_urls: string[];
  descriptions: string[];
  dialogues: string[];
  panel_count: number;
  comic_style: string;
  title: string;
}

export async function saveComic(comicData: ComicData) {
  const supabase = createClient();
  
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('comics')
      .insert([
        {
          user_id: user.id,
          prompt: comicData.prompt,
          image_urls: comicData.image_urls,
          descriptions: comicData.descriptions,
          dialogues: comicData.dialogues,
          panel_count: comicData.panel_count,
          comic_style: comicData.comic_style,
          title: comicData.title,
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error saving comic:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to save comic:', error);
    throw error;
  }
}

export async function getUserComics() {
  const supabase = createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('comics')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user comics:', error);
    throw error;
  }
}

export async function getComicById(id: string) {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('comics')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching comic:', error);
    throw error;
  }
}
