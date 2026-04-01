
-- Make resumes and video-cvs buckets private
UPDATE storage.buckets SET public = false WHERE id IN ('resumes', 'video-cvs');
