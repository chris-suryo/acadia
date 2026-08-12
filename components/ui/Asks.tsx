"use client";

/**
 * What the trip needs from you, at the top of the first screen you see.
 *
 * Everything in this app worked, and none of it asked. Someone opened the
 * link, read a nicely laid-out schedule, thought "nice", and closed it — the
 * three things that actually have to happen before Friday were one and two
 * taps away behind tabs nobody had a reason to open. Four people had opened
 * the app, one vote had been cast, and fourteen must-haves had nobody on them.
 *
 * So the asks come to you. Each row disappears once you've done it, the card
 * goes when you're finished, and the whole thing is gone for good once
 * everyone has joined — it has no reason to outlive the weekend it's for.
 */

import { Card } from "@/components/primitives";
import { Avatar } from "./Avatar";
import { useData } from "@/lib/data/context";

/** The one date that matters: the food has to be bought before anyone eats. */
const DEADLINE = "The Costco run is Friday morning — food votes close then.";

function Ask({
  n,
  title,
  detail,
  onClick,
}: {
  n: number;
  title: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-transparent border-none border-b border-rule last:border-b-0 cursor-pointer flex items-center gap-3 px-3.5 py-3"
    >
      <span className="shrink-0 w-[22px] h-[22px] rounded-full bg-blaze/12 text-blaze font-mono text-[11px] flex items-center justify-center">
        {n}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[14.5px] text-ink leading-[1.35]">{title}</span>
        <span className="block text-[11.5px] text-mute mt-0.5 leading-[1.4]">{detail}</span>
      </span>
      <span className="shrink-0 font-mono text-[13px] text-blaze">→</span>
    </button>
  );
}

export function Asks({ goto }: { goto: (tab: string, view?: string) => void }) {
  const {
    menuVotes,
    gear,
    surveys,
    menu,
    members,
    claimedMembers,
    memberAvatars,
    isMe,
    userId,
  } = useData();

  const voted = menuVotes.some((v) => isMe(v.user_id));
  const claimed = gear.some((g) => isMe(g.owner_id));
  // Same resolution the Ideas board uses — answering on a laptop must not
  // read as blank on a phone, or the ask never goes away.
  const mine =
    surveys.find((s) => s.user_id === userId) ?? surveys.find((s) => isMe(s.user_id));
  const said = !!(
    mine &&
    (mine.activity || mine.hikes || mine.wants || mine.bar_harbor || mine.food).trim()
  );

  const meals = new Set(menu.map((m) => `${m.night}|${m.meal}`)).size;
  const openEssentials = gear.filter((g) => g.essential && !g.owner_id).length;
  const joined = claimedMembers.length;
  const everyoneIn = joined >= members.length && members.length > 0;

  const todo = [!voted, !claimed, !said].filter(Boolean).length;

  // Nothing left to ask and everybody's here: the card has done its job.
  if (todo === 0 && everyoneIn) return null;

  const faces = members.filter((m) => claimedMembers.includes(m.id));

  return (
    <Card className="overflow-hidden mb-5">
      <div className="px-3.5 pt-3 pb-2">
        <div className="font-mono text-[10.5px] tracking-[.12em] uppercase text-blaze">
          {todo > 0 ? "Before Friday" : "You're set"}
        </div>
        {todo > 0 && (
          <div className="text-[13.5px] text-ink mt-1">
            {todo === 1 ? "One thing" : todo === 2 ? "Two things" : "Three things"}, about
            a minute.
          </div>
        )}
      </div>

      {!voted && (
        <Ask
          n={1}
          title="Vote on what we eat"
          detail={`${meals} meals to settle — tap the ones you'd actually eat`}
          onClick={() => goto("food", "menu")}
        />
      )}
      {!claimed && (
        <Ask
          n={voted ? 1 : 2}
          title="Claim something to bring"
          detail={
            openEssentials > 0
              ? `${openEssentials} must-have${openEssentials === 1 ? "" : "s"} still have nobody`
              : "the group gear list, so nothing arrives twice"
          }
          onClick={() => goto("packing", "group")}
        />
      )}
      {!said && (
        <Ask
          n={[!voted, !claimed].filter(Boolean).length + 1}
          title="Say what you're hoping for"
          detail="a hike, a swim, a food request, anything"
          // Already on this tab — the board is further down the same page.
          onClick={() =>
            document
              .getElementById("ideas")
              ?.scrollIntoView({ behavior: "smooth", block: "start" })
          }
        />
      )}

      <div className="px-3.5 py-2.5 border-t border-rule">
        {todo > 0 && (
          <div className="text-[11.5px] text-granite leading-[1.45]">{DEADLINE}</div>
        )}
        {!everyoneIn && (
          <div className="flex items-center gap-2 mt-1.5">
            <span className="flex items-center gap-1">
              {faces.slice(0, 6).map((m) => (
                <Avatar
                  key={m.id}
                  userId={m.id}
                  url={memberAvatars[m.id]}
                  name={m.name}
                  size={18}
                />
              ))}
            </span>
            <span className="font-mono text-[10.5px] text-mute">
              {joined} of {members.length} have joined
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
