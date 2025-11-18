import { API_BASE_URL } from "../constants";

const API_ROOT = API_BASE_URL.replace(/\/api(\/v\d+)?$/, "");

export const resolveImageUrl = (path?: string | null) => {
  if (!path || path.trim() === "") {
    return `${API_ROOT}/api/v1/static/p_default_img.png`;
  }

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  if (path.startsWith("/api/")) {
    return `${API_ROOT}${path}`;
  }

  if (path.startsWith("/")) {
    return path;
  }

  return `${API_ROOT}/api/v1/static/${path}`;
};
