export const session = {
  save(access: string, refresh?: string) {
    localStorage.setItem("access_token", access);
    if (refresh) localStorage.setItem("refresh_token", refresh);
  },
  access() { return localStorage.getItem("access_token"); },
  refresh() { return localStorage.getItem("refresh_token"); },
  clear() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  }
};
