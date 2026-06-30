const formidable = require('formidable');
const fs = require('fs');
const { requireAdmin } = require('../_lib/auth');
const { getSupabaseClient } = require('../_lib/supabase');

const ALLOWED_TARGETS = ['logo_url', 'hero_image_url'];
const ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_SIZE = 4 * 1024 * 1024; // 4MB
const BUCKET = 'site-images';

const config = {
  api: { bodyParser: false }
};

function extFromMime(mime) {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/webp') return 'webp';
  return 'bin';
}

module.exports = async function handler(req, res) {
  if (!requireAdmin(req, res)) return;

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const form = formidable({ maxFileSize: MAX_SIZE });

  let fields, files;
  try {
    [fields, files] = await form.parse(req);
  } catch (err) {
    res.status(400).json({ error: 'invalid_upload', message: err.message });
    return;
  }

  const target = Array.isArray(fields.target) ? fields.target[0] : fields.target;
  const fileEntry = Array.isArray(files.file) ? files.file[0] : files.file;

  if (!ALLOWED_TARGETS.includes(target)) {
    res.status(400).json({ error: 'invalid_target' });
    return;
  }
  if (!fileEntry) {
    res.status(400).json({ error: 'missing_file' });
    return;
  }
  if (!ALLOWED_MIME.includes(fileEntry.mimetype)) {
    res.status(400).json({ error: 'invalid_mime_type' });
    return;
  }

  try {
    const buffer = fs.readFileSync(fileEntry.filepath);
    const path = `${target}-${Date.now()}.${extFromMime(fileEntry.mimetype)}`;

    const supabase = getSupabaseClient();
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType: fileEntry.mimetype, upsert: false });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const publicUrl = publicUrlData.publicUrl;

    const { error: contentError } = await supabase
      .from('site_content')
      .upsert({ key: target, value: publicUrl, updated_at: new Date().toISOString() }, { onConflict: 'key' });

    if (contentError) throw contentError;

    res.status(200).json({ url: publicUrl });
  } catch (err) {
    res.status(500).json({ error: 'internal_error', message: err.message });
  }
};

module.exports.config = config;
