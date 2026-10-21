
const IS_LOCAL = location.protocol === 'file:' || ['localhost','127.0.0.1','[::1]'].includes(location.hostname) || location.hostname.endsWith('.github.io');
if (!IS_LOCAL) document.write('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"><\/script>');
