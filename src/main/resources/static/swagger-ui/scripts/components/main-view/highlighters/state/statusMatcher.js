import { apiStatusMap } from "../../../../swaggerApiStatus.js";

export function extractStatusFromText(text) {
  const emojiToTextMap = Object.fromEntries(Object.entries(apiStatusMap));
  const matchedEmoji = Object.keys(emojiToTextMap).find((emoji) =>
    text.includes(emoji)
  );
  return {
    matchedEmoji,
    matchedStatus: matchedEmoji ? emojiToTextMap[matchedEmoji] : undefined,
  };
}