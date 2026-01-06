import React from "react";
import { Mic } from "lucide-react";
import { Icon } from "../ui";
import { MarkdownBody } from "./MarkdownBody";
import type { ThreadItem } from "./types";
import "./items.css";

function Meta({
  who,
  whoClass,
  tag,
  time,
  accentDot,
}: {
  who: string;
  whoClass?: string;
  tag?: string;
  time: string;
  accentDot?: boolean;
}) {
  return (
    <div className="v2-item__meta">
      {accentDot && <span className="v2-item__meta-dot" aria-hidden="true" />}
      <span className={`v2-item__who ${whoClass ?? ""}`}>{who}</span>
      {tag && <span className="v2-item__tag">· {tag}</span>}
      <span className="v2-item__time">· {time}</span>
    </div>
  );
}

export function UserVoiceItem({
  item,
}: {
  item: Extract<ThreadItem, { kind: "user-voice" }>;
}) {
  return (
    <article className="v2-item v2-item--user">
      <Meta who="You" tag="voice" time={item.t} />
      <div className="v2-item__body">
        <span className="v2-item__mic" aria-hidden="true">
          <Icon icon={Mic} size="sm" />
        </span>
        {item.text}
      </div>
    </article>
  );
}

export function UserTextItem({
  item,
}: {
  item: Extract<ThreadItem, { kind: "user-text" }>;
}) {
  return (
    <article className="v2-item v2-item--user">
      <Meta who="You" time={item.t} />
      <div className="v2-item__body">{item.text}</div>
    </article>
  );
}

export function ZoyaSpeechItem({
  item,
}: {
  item: Extract<ThreadItem, { kind: "zoya-speech" }>;
}) {
  const isSpeaking = item.status === "speaking";
  return (
    <article className="v2-item v2-item--speech">
      <Meta
        who="Zoya"
        whoClass="v2-item__who--zoya"
        tag={isSpeaking ? "speaking" : undefined}
        time={item.t}
        accentDot
      />
      <div className="v2-item__body">
        <MarkdownBody text={item.text} />
        {isSpeaking && (
          <span className="v2-item__speaking-dot" aria-label="Speaking" />
        )}
      </div>
    </article>
  );
}

export function ZoyaThoughtItem({
  item,
}: {
  item: Extract<ThreadItem, { kind: "zoya-thought" }>;
}) {
  return (
    <article className="v2-item v2-item--thought" aria-label="Zoya thought">
      <Meta
        who="Zoya"
        whoClass="v2-item__who--zoya"
        tag="thinking"
        time={item.t}
        accentDot
      />
      <div className="v2-item__body">{item.text}</div>
    </article>
  );
}

export function ResultItem({
  item,
}: {
  item: Extract<ThreadItem, { kind: "result" }>;
}) {
  return (
    <article className="v2-item v2-item--result">
      <Meta who="Result" time={item.t} />
      <div className="v2-item__body">
        <MarkdownBody text={item.summary} />
      </div>
      {item.detail && (
        <div className="v2-item__detail">
          <MarkdownBody text={item.detail} />
        </div>
      )}
    </article>
  );
}
