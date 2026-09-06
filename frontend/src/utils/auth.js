export const getToken = () => {
  return localStorage.getItem("token");
};

export const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

export const isAdmin = () => {
  const user = getUser();
  return user?.role === "admin";
};

export const isTokenValid = () => {
  const token = getToken();

  if (!token) {
    return false;
  }

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));

    if (!payload.exp) {
      return false;
    }

    return payload.exp * 1000 > Date.now();
  } catch (error) {
    console.error("Invalid token:", error);
    return false;
  }
};

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};
