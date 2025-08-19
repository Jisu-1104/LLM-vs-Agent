import React, { useMemo, useState, useRef, useEffect } from "react";

const INTENTS = ["단순 직역", "독자 맞춤 번역", "기사 헤드라인 번역"];

const ROLES = [
  {
    id: "draft",
    name: "Draft Agent",
    description: "초안 번역 생성 (Literal / Sense-for-sense / Free)",
    color: "bg-sky-100 text-sky-800 border-sky-300",
    snippet:
      "You are a Draft Agent. Produce three translation variants for the given source: (1) Literal Translation, (2) Sense-for-Sense Translation, (3) Free Translation. Use clear section headers and keep key terms consistent across variants.",
  },
  {
    id: "refine",
    name: "Refinement Agent",
    description: "요구 조건 반영해 Refined Translation 도출",
    color: "bg-emerald-100 text-emerald-800 border-emerald-300",
    snippet:
      "You are a Refinement Agent. Merge strengths from prior variants, apply user constraints (audience, tone, style guide), and output a single Refined Translation with a brief rationale of edits.",
  },
  {
    id: "eval",
    name: "Evaluation Agent",
    description: "Faithfulness/Expressiveness/Elegance 평가",
    color: "bg-amber-100 text-amber-800 border-amber-300",
    snippet:
      "You are an Evaluation Agent. Evaluate the Refined Translation for Faithfulness, Expressiveness, and Elegance. Provide short justifications and concrete improvement suggestions.",
  },
  {
    id: "score",
    name: "Score Agent",
    description: "최종 점수 및 개선 제안 요약",
    color: "bg-rose-100 text-rose-800 border-rose-300",
    snippet:
      "You are a Scoring Agent. Provide an overall score and the top 3 actionable fixes to improve the translation further.",
  },
];

function classNames(...cls: string[]) {
  return cls.filter(Boolean).join(" ");
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-3">
      <div className="text-xs uppercase tracking-wider text-gray-500">{subtitle}</div>
      <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
    </div>
  );
}

function RolePill({
  role,
  selected,
  onSelect,
  disabled,
}: {
  role: any;
  selected: boolean;
  onSelect: (id: string) => void;
  disabled: boolean;
}) {
  return (
    <button
      disabled={disabled}
      onClick={() => !disabled && onSelect(role.id)}
      className={classNames(
        "w-full text-left p-3 rounded-2xl border flex flex-col gap-1 transition",
        selected ? "ring-2 ring-gray-900" : "hover:shadow-sm",
        role.color,
        disabled ? "opacity-60 cursor-not-allowed" : ""
      )}
      title={role.description}
      aria-disabled={disabled}
    >
      <div className="flex items-center justify-between">
        <span className="font-medium">{role.name}</span>
        <span className="text-[10px] uppercase tracking-wide">LLM 전용</span>
      </div>
      <p className="text-xs opacity-80 leading-snug">{role.description}</p>
    </button>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={classNames("rounded-2xl border bg-white shadow-sm", className)}>{children}</div>;
}

export default function InterfaceDesktopNoCopy() {
  const [mode, setMode] = useState<"LLM" | "Agent">("LLM");
  const [intent, setIntent] = useState<string>(INTENTS[0]);
  const [selectedRole, setSelectedRole] = useState<string>("draft");
  const roleMap = useMemo(() => Object.fromEntries(ROLES.map((r) => [r.id, r])), []);

  const [messages, setMessages] = useState<{ who: "system" | "assistant" | "user"; text: string }[]>([
    { who: "system", text: "실험 모드: LLM vs Agent 비교 인터페이스 (번역 작업 전용)" },
    {
      who: "assistant",
      text:
        "LLM 모드에서는 좌측에서 하나의 역할만 선택할 수 있습니다. Agent 모드에서는 Draft→Refinement→Evaluation→Score 순서를 자동 사용합니다.",
    },
  ]);
  const [input, setInput] = useState<string>("");

  const listRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  const pipelineLabel = "Draft → Refinement → Evaluation → Score (자동)";
  const promptPreview =
    mode === "LLM"
      ? `[모드] LLM  |  [의도] ${intent}\n[역할] ${roleMap[selectedRole].name}\n[역할 지시]\n- ${roleMap[selectedRole].snippet}`
      : `[모드] Agent  |  [의도] ${intent}\n[파이프라인] ${pipelineLabel}\n프롬프트에 과업과 제약을 명확히 적어주세요. (역할 선택은 비활성화됨)`;

  function sendMessage() {
    if (!input.trim()) return;
    const userMsg = { who: "user" as const, text: input.trim() };
    const replyPrefix = mode === "Agent" ? "(Agent)" : "(LLM)";
    const roleName = mode === "LLM" ? roleMap[selectedRole].name : pipelineLabel;
    const assistantMsg = {
      who: "assistant" as const,
      text: `${replyPrefix} 의도='${intent}', 역할/파이프라인=[${roleName}] 반영해 응답합니다.\n\n• 요약 출력\n• 다음 단계 제안(예: 독자·어조 확인 → 정제 → 자체 평가/개선)`,
    };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-white text-gray-900">
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur text-sm">
        <div className="max-w-[1280px] mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <div className="font-semibold">LLM vs Agent 비교 실험용 인터페이스</div>
            <span className="text-xs text-gray-500">Translation Pipeline</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-gray-600">모드</span>
              <div className="inline-flex rounded-xl border overflow-hidden">
                {(["LLM", "Agent"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={classNames("px-3 py-1.5", mode === m ? "bg-gray-900 text-white" : "bg-white text-gray-700")}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">과업</span>
              <select className="border rounded-xl px-2 py-1 bg-white" value={intent} onChange={(e) => setIntent(e.target.value)}>
                {INTENTS.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1280px] mx-auto p-4 grid grid-cols-[300px_minmax(0,1fr)_340px] gap-3 text-sm">
        <aside className="sticky top-[60px] self-start">
          <Card className="p-4">
            <SectionTitle title="역할 선택 (LLM 전용)" subtitle="Agent 역할 팔레트" />
            <p className="text-xs text-gray-600 mb-3">
              LLM 모드에서는 아래 중 <span className="font-medium">하나</span>만 선택할 수 있습니다. Agent 모드에서는 역할 선택이 비활성화되고{" "}
              <span className="font-medium">{pipelineLabel}</span>을 자동 사용합니다.
            </p>
            <div className="grid gap-2">
              {ROLES.map((r) => (
                <RolePill key={r.id} role={r} selected={selectedRole === r.id} onSelect={setSelectedRole} disabled={mode !== "LLM"} />
              ))}
            </div>
            <div className="mt-4 p-3 rounded-xl bg-gray-50 border">
              <div className="text-xs text-gray-600 mb-1">현재 선택</div>
              <div className="text-sm">{mode === "LLM" ? (roleMap as any)[selectedRole].name : pipelineLabel}</div>
            </div>
          </Card>
        </aside>

        <section className="h-[560px] flex flex-col">
          <Card className="h-full flex flex-col">
            <div className="border-b px-4 py-3">
              <SectionTitle title="대화" subtitle="Conversation Log" />
              <div className="text-xs text-gray-500">중앙 로그는 챗봇 형태로 과업 진행 과정을 기록합니다.</div>
            </div>

            <div ref={listRef} className="flex-1 overflow-auto p-4 space-y-3">
              {messages.map((m, idx) => (
                <div key={idx} className={classNames("flex", m.who === "user" ? "justify-end" : "justify-start")}>
                  <div
                    className={classNames(
                      "max-w-[75%] rounded-2xl px-3 py-2 shadow-sm border",
                      m.who === "user" ? "bg-gray-900 text-white border-gray-900" : m.who === "system" ? "bg-gray-50 text-gray-700" : "bg-white text-gray-800"
                    )}
                  >
                    <div className="text-[10px] uppercase tracking-wider mb-1 opacity-70">{m.who}</div>
                    <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t p-3">
              <div className="mb-2">
                <div className="text-xs text-gray-600 mb-1">프롬프트 미리보기</div>
                <pre className="text-xs bg-gray-50 border rounded-xl p-3 overflow-auto max-h-40">{promptPreview}</pre>
              </div>
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder={mode === "Agent" ? "예: 이 문장을 기사 헤드라인으로 번역해줘 (타깃: 일반 독자)" : "예: 원문을 단순 직역으로 생성해줘"}
                  className="flex-1 px-3 py-2 rounded-xl border bg-white"
                />
                <button onClick={sendMessage} className="px-4 py-2 rounded-xl bg-gray-900 text-white hover:bg-black">
                  전송
                </button>
              </div>
            </div>
          </Card>
        </section>

        <aside className="sticky top-[60px] self-start">
          <Card className="p-4">
            <SectionTitle title="평가 기준 (참고용)" subtitle="사용자 사고 단계 기반" />
            <p className="text-xs text-gray-600 mb-3">아래 단계들을 보며 프롬프트 작성/검토에 참고하십시오.</p>

            <div className="grid gap-3">
              <div className="p-3 border rounded-xl bg-gray-50">
                <div className="text-sm font-medium mb-1">복잡도 1 · 단순 직역</div>
                <ul className="text-sm list-disc pl-5 space-y-1">
                  <li>① 번역 지시</li>
                </ul>
              </div>

              <div className="p-3 border rounded-xl bg-gray-50">
                <div className="text-sm font-medium mb-1">복잡도 2 · 독자 맞춤 번역</div>
                <ul className="text-sm list-disc pl-5 space-y-1">
                  <li>① 목표 독자를 고려한 난이도, 어조 결정</li>
                  <li>② 지침 포함 번역 지시</li>
                </ul>
              </div>

              <div className="p-3 border rounded-xl bg-gray-50">
                <div className="text-sm font-medium mb-1">복잡도 3 · 기사 헤드라인 번역</div>
                <ul className="text-sm list-disc pl-5 space-y-1">
                  <li>① 목표 독자를 고려한 난이도, 어조 결정</li>
                  <li>② 언어, 문화를 고려한 적합성 결정</li>
                  <li>③ 지침 포함 번역 지시</li>
                </ul>
              </div>
            </div>
          </Card>
        </aside>
      </main>

      <footer className="py-6 text-center text-xs text-gray-500">
        좌: 역할(LLM 전용, 단일 선택) · 중: 대화 로그 · 우: 사고 단계 기반 평가 기준(참고용). Agent 모드는 Draft→Refinement→Evaluation→Score를 자동 적용합니다.
      </footer>
    </div>
  );
}
