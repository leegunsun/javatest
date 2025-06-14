function getSeenApis() {
  const raw = localStorage.getItem("seenApis");
  return raw ? JSON.parse(raw) : {};
}

export function setMarkAtSeenApi(key, type = "status") {
  const seen = getSeenApis();
  seen[key] = { type, timestamp: new Date().toISOString() };
  localStorage.setItem("seenApis", JSON.stringify(seen));
}

export function isApiSeenRecently(key, thresholdDays = 5) {
  const seenApis = getSeenApis();
  const seen = seenApis[key];
  if (!seen) return false;

  const saved = new Date(seen.timestamp);
  const now = new Date();
  const diffDays = (now - saved) / (1000 * 60 * 60 * 24);

  if (diffDays >= thresholdDays) {
    setMarkAtSeenApi(key, seen.type);
    return true;
  }
  return true;
}
