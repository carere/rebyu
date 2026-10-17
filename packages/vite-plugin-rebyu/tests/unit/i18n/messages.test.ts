import { describe, expect, it } from "vitest";
import { m } from "#i18n/messages";
import en from "../../../../../messages/en.json";
import fr from "../../../../../messages/fr.json";

function inputs(message: unknown) {
  return [...new Set(JSON.stringify(message).match(/\{\w+\}/g) ?? [])].sort();
}

describe("Given the shared English and French catalogs", () => {
  it("Then every English message has a French translation with the same inputs", () => {
    expect(Object.keys(fr).sort()).toEqual(Object.keys(en).sort());
    for (const key of Object.keys(en) as (keyof typeof en)[]) {
      expect(fr[key], key).toBeTruthy();
      expect(inputs(fr[key]), key).toEqual(inputs(en[key]));
    }
  });

  it("Then generated messages select the correct singular and plural forms", () => {
    expect(m.review_total({ shown: 0, total: 0 }, { locale: "en" })).toBe("0 of 0 comments");
    expect(m.review_total({ shown: 1, total: 1 }, { locale: "en" })).toBe("1 of 1 comment");
    expect(m.review_total({ shown: 1, total: 2 }, { locale: "fr" })).toBe("1 sur 2 commentaires");
    expect(m.review_unread_replies({ count: 1 }, { locale: "fr" })).toBe("1 réponse non lue");
    expect(m.review_unread_replies({ count: 2 }, { locale: "fr" })).toBe("2 réponses non lues");
  });
});
