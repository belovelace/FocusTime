(function(global){
  const API_BASE = '';
  const TOKEN_KEY = 'ft:token';
  const SESSION_KEY = 'ft:sessionId';

  function getToken(){ return localStorage.getItem(TOKEN_KEY); }
  function setToken(t){ if (t) localStorage.setItem(TOKEN_KEY, t); else localStorage.removeItem(TOKEN_KEY); }
  function getSessionId(){ return localStorage.getItem(SESSION_KEY); }
  function setSessionId(id){ if (id) localStorage.setItem(SESSION_KEY, id); else localStorage.removeItem(SESSION_KEY); }

  async function request(path, opts = {}){
    opts.headers = opts.headers || {};
    if (!opts.headers['Content-Type'] && !(opts.body instanceof FormData)) opts.headers['Content-Type'] = 'application/json';
    const token = getToken();
    if (token) opts.headers['Authorization'] = `Bearer ${token}`;
    if (opts.body && opts.headers['Content-Type'] === 'application/json' && typeof opts.body !== 'string') opts.body = JSON.stringify(opts.body);
    const res = await fetch(API_BASE + path, opts);
    if (res.status === 401){ setToken(null); window.location.href = '/app/login.html'; throw new Error('unauthenticated'); }
    let json = null;
    try{ json = await res.json(); }catch(e){}
    return { ok: res.ok, status: res.status, body: json };
  }

  async function login(email,password){ return request('/api/auth/login', { method: 'POST', body: { email, password } }); }
  async function signup(data){ return request('/api/auth/signup', { method: 'POST', body: data }); }

  async function createSession(payload){ return request('/api/sessions', { method: 'POST', body: payload }); }
  async function getSession(id){ return request(`/api/sessions/${id}`); }
  async function joinSession(id){ return request(`/api/sessions/${id}/join`, { method: 'POST' }); }

  async function postMessage(sessionId, body){ return request(`/api/sessions/${sessionId}/messages`, { method: 'POST', body: { body } }); }
  async function getMessages(sessionId){ return request(`/api/sessions/${sessionId}/messages`); }

  async function postGoal(sessionId, goalText){ return request(`/api/sessions/${sessionId}/goals`, { method: 'POST', body: { goalText } }); }
  async function getGoals(sessionId){ return request(`/api/sessions/${sessionId}/goals`); }

  async function postVideo(sessionId, youtubeUrl){ return request(`/api/sessions/${sessionId}/video`, { method: 'POST', body: { youtubeUrl } }); }

  // helper: extract youtube id
  function extractYouTubeId(url){ if (!url) return null; const m = url.match(/(?:youtu\.be\/|v=|embed\/)([A-Za-z0-9_-]{11})/); return m?m[1]:null; }

  global.FTApi = {
    getToken, setToken, getSessionId, setSessionId,
    request, login, signup, createSession, getSession, joinSession,
    postMessage, getMessages, postGoal, getGoals, postVideo, extractYouTubeId
  };
})(window);
