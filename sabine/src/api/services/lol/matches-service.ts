import type { MatchesData } from "@types";
import { env } from "@/env";

export const lolMatches = {
  async get() {
    const response = await fetch(env.API_URL + "/matches/lol", {
      headers: {
        authorization: env.AUTH
      }
    });
    const data: MatchesData[] = await response.json();

    return data;
  }
};
