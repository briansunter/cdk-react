export default function getConfig() {
  const url = window.location.href;
  if (url.includes("local")) {
    return { api: "http://localhost:3000", isLocal: true };
  } else if (url.includes("dev")) {
    return { api: "https://api-dev.briansunter.com" };
  }
}
