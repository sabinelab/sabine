import type { LiveFeed } from "@types";
import { env } from "@/env";

export const lolLiveMatches = {
  async get() {
    const response = await fetch(env.API_URL + "/live/lol", {
      headers: {
        authorization: env.AUTH
      }
    });
    const data: LiveFeed[] = await response.json();

    return data;
  }
};
