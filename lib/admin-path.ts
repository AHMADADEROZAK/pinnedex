export function adminPath() {
  return process.env.ADMIN_PATH || "admin";
}

export function adminBasePath() {
  return `/${adminPath()}`;
}
