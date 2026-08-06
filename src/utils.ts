import { BeerLog } from "./types";

export interface UserStatsResult {
  totalPints: number;
  avgRating: string;
  favoriteStyle: string;
  totalCheers: number;
  topBeer: string;
}

export function isImposterLog(log: BeerLog): boolean {
  if (!log || !log.reactions) return false;
  const dislikes = log.reactions["dislike"] || log.reactions["imposter"];
  return Array.isArray(dislikes) && dislikes.length >= 3;
}

export function calculateUserStats(logs: BeerLog[], username?: string): UserStatsResult {
  const validLogs = logs.filter((l) => !isImposterLog(l));
  const userLogs = username
    ? validLogs.filter((l) => l.user.toLowerCase() === username.toLowerCase())
    : validLogs;

  const totalPints = userLogs.length;

  const ratedLogs = userLogs.filter((l) => l.rating > 0);
  const avgRating =
    ratedLogs.length > 0
      ? (ratedLogs.reduce((acc, l) => acc + l.rating, 0) / ratedLogs.length).toFixed(1)
      : "0.0";

  const styleCounts: Record<string, number> = {};
  userLogs.forEach((l) => {
    const s = l.beerStyle || "Unknown";
    styleCounts[s] = (styleCounts[s] || 0) + 1;
  });
  let favoriteStyle = "None yet";
  let maxStyleCount = 0;
  Object.entries(styleCounts).forEach(([style, count]) => {
    if (count > maxStyleCount) {
      favoriteStyle = style;
      maxStyleCount = count;
    }
  });

  const totalCheers = userLogs.reduce((acc, l) => acc + (l.cheers?.length || 0), 0);

  const beerCounts: Record<string, number> = {};
  userLogs.forEach((l) => {
    const name = l.beerName.trim();
    if (name) {
      beerCounts[name] = (beerCounts[name] || 0) + 1;
    }
  });
  let topBeerName = "";
  let maxBeerCount = 0;
  Object.entries(beerCounts).forEach(([name, count]) => {
    if (count > maxBeerCount) {
      topBeerName = name;
      maxBeerCount = count;
    }
  });
  const topBeer = topBeerName
    ? `${topBeerName} (${maxBeerCount} pint${maxBeerCount > 1 ? "s" : ""})`
    : "No beers logged yet";

  return {
    totalPints,
    avgRating,
    favoriteStyle,
    totalCheers,
    topBeer,
  };
}

export function getMostDrankBeerForUser(username: string, logs: BeerLog[]): string {
  if (!username) return "No beers logged yet";
  return calculateUserStats(logs, username).topBeer;
}

export function compressAndResizeImage(
  file: File,
  maxWidth = 600,
  maxHeight = 600,
  quality = 0.5
): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.src = objectUrl;

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = Math.round(width);
        canvas.height = Math.round(height);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = (e) => reject(e);
          return;
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        URL.revokeObjectURL(objectUrl);
        resolve(dataUrl);
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      }
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };
  });
}

export function compressImage(file: File, maxWidth = 150, maxHeight = 150): Promise<string> {
  return compressAndResizeImage(file, maxWidth, maxHeight, 0.85);
}
