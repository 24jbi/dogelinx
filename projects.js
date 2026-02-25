import { supabase } from "../lib/supabase";
import { useStudio } from "../store";

// Create a new project and make you a member
export async function createProject(title = "Untitled") {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error("Not signed in");

  const { data: proj, error } = await supabase
    .from("projects")
    .insert({ owner_id: user.id, title })
    .select()
    .single();
  if (error) throw error;

  await supabase.from("project_members").insert({ project_id: proj.id, user_id: user.id, role: "owner" });
  await supabase.from("experiences").insert({ project_id: proj.id, slug: `exp_${proj.id.slice(0, 8)}` });

  return proj;
}

// Publish a new version (snapshot to storage + row in versions)
export async function publishVersion(projectId, notes = "") {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error("Not signed in");

  // next version number
  const { data: last } = await supabase
    .from("project_versions")
    .select("version_number")
    .eq("project_id", projectId)
    .order("version_number", { ascending: false })
    .limit(1);

  const nextVersion = (last?.[0]?.version_number ?? 0) + 1;

  const json = useStudio.getState().exportJSON();
  const path = `p/${projectId}/versions/${nextVersion}.json`;

  // upload snapshot
  const up = await supabase.storage.from("projects").upload(path, new Blob([json], { type: "application/json" }), {
    upsert: true,
    cacheControl: "0",
  });
  if (up.error) throw up.error;

  // record version row
  const { data: ver, error: verr } = await supabase
    .from("project_versions")
    .insert({
      project_id: projectId,
      version_number: nextVersion,
      snapshot_path: path,
      notes,
      created_by: user.id,
    })
    .select()
    .single();
  if (verr) throw verr;

  // point experience to latest
  const { data: exp } = await supabase.from("experiences").select("id").eq("project_id", projectId).single();
  if (exp?.id) {
    await supabase.from("experiences").update({ current_version_id: ver.id, published_at: new Date().toISOString() }).eq("id", exp.id);
  }

  return ver;
}

// Load a version snapshot into your store
export async function loadVersionSnapshot(snapshotPath) {
  const dl = await supabase.storage.from("projects").download(snapshotPath);
  if (dl.error) throw dl.error;
  const text = await dl.data.text();
  const ok = useStudio.getState().importJSON(text);
  if (!ok) throw new Error("Import failed");
}