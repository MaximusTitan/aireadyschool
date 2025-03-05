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
