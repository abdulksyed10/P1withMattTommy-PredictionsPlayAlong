import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.p1withmattandtommyfanpredictions.com";

  return [
    { url: `${baseUrl}/`, lastModified: new Date("2026-02-15") },
    { url: `${baseUrl}/how-it-works`, lastModified: new Date("2026-02-15") },
    { url: `${baseUrl}/leaderboard`, lastModified: new Date("2026-02-15") },
    { url: `${baseUrl}/predict`, lastModified: new Date("2026-02-15") },
    { url: `${baseUrl}/season-prediction`, lastModified: new Date("2026-02-15") },
  ];
}