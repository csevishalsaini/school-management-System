export function getToken() {
  return localStorage.getItem("token");
}

export function clearAuth() {
  localStorage.removeItem("token");
}

export function getCurrentUser() {
  const token = getToken();
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return {
      id: payload.uid,
      username: payload.user,
      role: payload.role,
      expiresAt: payload.exp,
    };
  } catch {
    return null;
  }
}
