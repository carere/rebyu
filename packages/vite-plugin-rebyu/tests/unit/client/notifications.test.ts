import { beforeEach, describe, expect, it } from "vitest";
import { isReviewer, unreadReplies } from "../../../src/client/notifications";
import type { Review } from "../../../src/schema";

let conversation: Pick<Review, "author" | "authorId" | "replies" | "status">;
const alice = { id: "alice", name: "Alice" };
function reply(id: string, authorId: string, author = authorId) {
  return { id, authorId, author, message: "A reply", createdAt: "2026-10-16T10:00:00Z" };
}
describe("Given a conversation with identified participants", () => {
  beforeEach(() => {
    conversation = {
      status: "open",
      author: "Alice",
      authorId: "alice",
      replies: [reply("a", "bob"), reply("b", "alice"), reply("c", "bob")],
    };
  });
  it("Then the author sees only unread replies from other people", () => {
    expect(unreadReplies(conversation, alice, new Set(["a"])).map((r) => r.id)).toEqual(["c"]);
  });
  it("Then people outside the conversation receive no notifications", () => {
    expect(unreadReplies(conversation, { id: "charlie", name: "Alice" }, new Set())).toEqual([]);
    expect(unreadReplies(conversation, { name: "" }, new Set())).toEqual([]);
  });
  describe("When a reviewer joins by replying", () => {
    beforeEach(() => {
      conversation.authorId = "bob";
      conversation.author = "Bob";
    });
    it("Then earlier replies and their own replies are excluded", () => {
      expect(unreadReplies(conversation, alice, new Set()).map((r) => r.id)).toEqual(["c"]);
    });
  });
  it("Then a changed display name still identifies the same person", () => {
    expect(unreadReplies(conversation, { ...alice, name: "New name" }, new Set())).toHaveLength(2);
  });
  it("Then newly arriving replies remain unread after older replies are read", () => {
    const read = new Set(["a", "c"]);
    conversation.replies.push(reply("new", "bob"));
    expect(unreadReplies(conversation, alice, read).map((r) => r.id)).toEqual(["new"]);
  });
  describe.each(["resolved", "dismissed"] as const)("When the conversation is %s", (status) => {
    beforeEach(() => {
      conversation.status = status;
      conversation.replies.push(reply("new", "bob"));
    });
    it("Then replies do not contribute notifications for a hidden conversation", () => {
      expect(unreadReplies(conversation, alice, new Set())).toEqual([]);
    });
  });
  describe("When a legacy conversation is in progress", () => {
    beforeEach(() => {
      conversation.status = "in-progress";
    });
    it("Then its unread replies remain available", () => {
      expect(unreadReplies(conversation, alice, new Set())).toHaveLength(2);
    });
  });
});
describe("Given legacy comments without user IDs", () => {
  it("Then a normalized name matches while identified namesakes stay separate", () => {
    expect(isReviewer({ author: " ALICE " }, alice)).toBe(true);
    expect(isReviewer({ author: "Alice", authorId: "different" }, alice)).toBe(false);
    expect(isReviewer({ author: "Alice", authorId: "alice" }, { name: "Alice" })).toBe(false);
  });
});
