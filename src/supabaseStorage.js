import supabase from './supabaseClient';

export async function saveScene(name, objects) {
  const userRes = await supabase.auth.getUser();
  const user = userRes?.data?.user;
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase.from('scenes').insert([{ user_id: user.id, name, data: objects }]);
  return { data, error };
}

export async function loadScenes() {
  const userRes = await supabase.auth.getUser();
  const user = userRes?.data?.user;
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase.from('scenes').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
  return { data, error };
}
