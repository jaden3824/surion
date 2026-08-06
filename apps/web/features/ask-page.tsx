"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowLeft, ArrowRight, Camera, Check, FileVideo, Info, Search, Upload } from "lucide-react";
import type { CaseSummary, ModelIdentificationStatus } from "@surion/domain";
import { brands, categories, models } from "@/lib/demo-data";
import { useDemoStore } from "./demo-store";

const symptomTypes = ["전원이 안 켜져요", "작동 중 멈춰요", "소음·진동이 있어요", "화면·표시 이상", "충전·배터리 문제", "누수·냄새·연기", "기타"];

export function AskPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { addCase } = useDemoStore();
  const initialCategory = categories.find((item) => item.id === params.get("category"))?.name ?? "";
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    category: initialCategory, brand: "", model: params.get("model") ?? "", title: "", symptom: "", symptomType: "", usagePeriod: "", occurredAt: "", attempts: "", additionalInfo: "", modelIdentificationStatus: "confirmed" as ModelIdentificationStatus,
  });
  const [files, setFiles] = useState<string[]>([]);

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const modelSuggestions = form.model.length > 1 ? models.filter((item) => item.toLowerCase().includes(form.model.toLowerCase())).slice(0, 5) : [];

  function next() {
    const nextErrors: string[] = [];
    if (step === 1) {
      if (!form.category) nextErrors.push("카테고리를 선택해 주세요.");
      if (!form.brand) nextErrors.push("브랜드를 선택하거나 직접 입력해 주세요.");
      if (!form.model) nextErrors.push("모델명을 입력하거나 ‘모델명을 모르겠어요’를 선택해 주세요.");
    }
    if (step === 2) {
      if (form.title.trim().length < 8) nextErrors.push("제목을 8자 이상 입력해 주세요.");
      if (form.symptom.trim().length < 20) nextErrors.push("증상을 20자 이상 자세히 입력해 주세요.");
    }
    setErrors(nextErrors);
    if (!nextErrors.length) setStep((current) => Math.min(3, current + 1));
  }

  function submit() {
    const id = `case-${Date.now()}`;
    const item: CaseSummary = {
      id, category: form.category, brand: form.brand, model: form.model, title: form.title, symptom: form.symptom, status: "OPEN", author: "민준아빠", createdAt: "방금", views: 0, comments: 0, saves: 0, helpful: 0, modelIdentificationStatus: form.modelIdentificationStatus, tags: [form.symptomType || "증상 확인 중"],
    };
    addCase(item);
    setSubmitted(true);
    window.setTimeout(() => router.push(`/cases/${id}`), 900);
  }

  if (submitted) return <div className="success-page"><div className="success-mark"><Check /></div><h1>질문이 등록됐어요</h1><p>관심 분야가 맞는 전문가 피드에 질문이 노출됩니다.</p></div>;

  return (
    <div className="ask-page page-wrap">
      <div className="container narrow-container">
        <div className="ask-header"><span className="eyebrow">새 질문</span><h1>어떤 문제가 생겼나요?</h1><p>아는 만큼만 적어도 괜찮아요. 제품과 증상을 구체적으로 알려주면 더 정확한 답을 받을 수 있어요.</p></div>
        <ol className="stepper"><li className={step >= 1 ? "active" : ""}><span>{step > 1 ? <Check /> : "1"}</span>제품 정보</li><li className={step >= 2 ? "active" : ""}><span>{step > 2 ? <Check /> : "2"}</span>증상 설명</li><li className={step >= 3 ? "active" : ""}><span>3</span>사진과 확인</li></ol>

        {errors.length > 0 && <div className="form-errors" role="alert"><AlertTriangle /> <div><strong>확인해 주세요</strong>{errors.map((error) => <p key={error}>{error}</p>)}</div></div>}

        <div className="form-panel">
          {step === 1 && <section className="form-step"><div className="form-step-title"><span>1</span><div><h2>제품을 알려주세요</h2><p>게시글이 쌓이면서 모델별 해결 사례가 만들어집니다.</p></div></div>
            <fieldset className="category-picker"><legend>카테고리 <em>필수</em></legend><div>{categories.map((item) => <label key={item.id} className={form.category === item.name ? "selected" : ""}><input type="radio" name="category" value={item.name} checked={form.category === item.name} onChange={() => update("category", item.name)} /><strong>{item.name}</strong><small>{item.description}</small></label>)}</div></fieldset>
            <div className="field-grid"><label>브랜드 <em>필수</em><input list="brand-list" value={form.brand} onChange={(event) => update("brand", event.target.value)} placeholder="검색하거나 직접 입력" /><datalist id="brand-list">{brands.map((item) => <option key={item} value={item} />)}</datalist></label>
              <div className="model-field"><label>모델명 <em>필수</em><span className="input-with-icon"><Search /><input value={form.model} onChange={(event) => { update("model", event.target.value); update("modelIdentificationStatus", "user_entered"); }} placeholder="예: S8 MaxV Ultra" disabled={form.modelIdentificationStatus === "unknown"} /></span></label>{modelSuggestions.length > 0 && <div className="suggestion-list">{modelSuggestions.map((model) => <button key={model} onClick={() => { update("model", model); update("modelIdentificationStatus", "confirmed"); }}>{model}</button>)}</div>}<button className="model-help" onClick={() => { update("modelIdentificationStatus", "unknown"); update("model", "모델명 확인 중"); }}>모델명을 모르겠어요</button></div></div>
            {form.modelIdentificationStatus === "unknown" && <div className="info-callout"><Camera /><div><strong>제품 명판이나 라벨 사진을 준비해 주세요</strong><p>보통 제품 바닥, 뒷면, 배터리 안쪽에 모델명이 있어요. 관리자가 확인할 수 있도록 검토 상태로 저장됩니다.</p></div></div>}
            {form.modelIdentificationStatus === "user_entered" && <p className="field-note"><Info /> 검색 결과에 모델이 없나요? 직접 입력한 모델은 검토 대상 모델로 안전하게 저장됩니다.</p>}
          </section>}

          {step === 2 && <section className="form-step"><div className="form-step-title"><span>2</span><div><h2>증상을 자세히 알려주세요</h2><p>보이는 현상과 이미 시도한 조치를 구분해 적어주세요.</p></div></div>
            <label>제목 <em>필수</em><input value={form.title} onChange={(event) => update("title", event.target.value)} placeholder="예: 충전독에 올리면 표시등이 바로 꺼집니다" maxLength={100} /><span className="char-count">{form.title.length}/100</span></label>
            <fieldset className="chip-picker"><legend>증상 유형 <span>선택</span></legend><div>{symptomTypes.map((type) => <label key={type} className={form.symptomType === type ? "selected" : ""}><input type="radio" name="symptom" checked={form.symptomType === type} onChange={() => update("symptomType", type)} />{type}</label>)}</div></fieldset>
            <label>증상 설명 <em>필수</em><textarea value={form.symptom} onChange={(event) => update("symptom", event.target.value)} placeholder="언제, 어떤 상황에서, 얼마나 자주 문제가 생기는지 적어주세요." rows={7} maxLength={4000} /><span className="char-count">{form.symptom.length}/4000</span></label>
            <div className="field-grid"><label>사용 기간 <span>선택</span><input value={form.usagePeriod} onChange={(event) => update("usagePeriod", event.target.value)} placeholder="예: 약 2년" /></label><label>언제부터 발생했나요? <span>선택</span><input value={form.occurredAt} onChange={(event) => update("occurredAt", event.target.value)} placeholder="예: 3일 전부터" /></label></div>
            <label>이미 시도한 조치 <span>선택</span><textarea value={form.attempts} onChange={(event) => update("attempts", event.target.value)} placeholder="전원 재연결, 필터 청소 등 이미 해본 조치를 알려주세요." rows={4} /></label>
          </section>}

          {step === 3 && <section className="form-step"><div className="form-step-title"><span>3</span><div><h2>사진이나 영상을 추가해 주세요</h2><p>문제가 잘 보이는 자료는 원인을 좁히는 데 큰 도움이 됩니다.</p></div></div>
            <label className="upload-zone"><Upload /><strong>사진·영상 파일을 여기에 놓거나 선택하세요</strong><span>사진 최대 10장, 영상 최대 2개 · 데모에서는 파일명만 저장됩니다.</span><input type="file" multiple accept="image/*,video/*" onChange={(event) => setFiles(Array.from(event.target.files ?? []).map((file) => file.name))} /></label>
            {files.length > 0 && <div className="file-list">{files.map((file) => <span key={file}>{/\.(mp4|mov|webm)$/i.test(file) ? <FileVideo /> : <Camera />}{file}<button onClick={() => setFiles((current) => current.filter((name) => name !== file))}>삭제</button></span>)}</div>}
            <div className="privacy-warning"><AlertTriangle /><div><strong>개인정보가 보이지 않는지 확인해 주세요</strong><p>주소, 전화번호, 택배 송장, 얼굴이 포함된 사진은 공개 게시글에 올리지 마세요.</p></div></div>
            <label>추가 정보 <span>선택</span><textarea value={form.additionalInfo} onChange={(event) => update("additionalInfo", event.target.value)} placeholder="답변자가 알아야 할 다른 내용이 있다면 적어주세요." rows={4} /></label>
            <div className="question-preview"><span className="eyebrow">등록 전 확인</span><strong>{form.title}</strong><p>{form.brand} · {form.model} · {form.category}</p><span>{form.symptom}</span></div>
          </section>}
        </div>

        <div className="form-actions">{step > 1 ? <button className="button button-secondary" onClick={() => setStep((current) => current - 1)}><ArrowLeft />이전</button> : <button className="button button-ghost" onClick={() => router.back()}><ArrowLeft />취소</button>} {step < 3 ? <button className="button button-primary" onClick={next}>다음<ArrowRight /></button> : <button className="button button-primary" onClick={submit}>질문 등록하기<Check /></button>}</div>
      </div>
    </div>
  );
}
