// 기존 로컬 분석 시스템을 더 정확한 LLM 기반 분석으로 대체
// 이제 이 파일은 프롬프트 템플릿과 평가 기준만 제공

export interface PromptAnalysisResult {
  strategy: string
  category: "clarity" | "specificity" | "structure" | "domain"
  original: string
  improved: string
  reason: string
  confidence: number
  source: "openai" | "anthropic" | "google"
}

interface UserPreferences {
  enableClarity: boolean
  enableSpecificity: boolean
  enableStructure: boolean
  enableDomain: boolean
  sensitivity: number
}

export class PromptEngineeringAnalyzer {
  // 종합적인 프롬프트 엔지니어링 가이드라인
  static getComprehensivePromptGuide(): string {
    return `
# 종합 프롬프트 엔지니어링 가이드라인

## OpenAI 공식 6가지 전략:
1. **명확한 지시 작성 (Clear Instructions)**
   - 구체적이고 상세한 지시사항 제공
   - 모호한 표현 대신 정확한 용어 사용
   - 원하는 출력 형식 명시

2. **참고 텍스트 제공 (Reference Text)**
   - 관련 배경 정보나 맥락 제공
   - 예시나 샘플 포함
   - 도메인별 전문 지식 추가

3. **복잡한 작업 분할 (Split Complex Tasks)**
   - 큰 작업을 작은 단위로 나누기
   - 단계별 접근 방식 사용
   - 각 단계의 목표 명확화

4. **모델에게 생각할 시간 제공 (Give Time to Think)**
   - 단계별 추론 요청
   - "먼저 생각해보고" 같은 표현 사용
   - 중간 결과 확인 요청

5. **외부 도구 사용 (Use External Tools)**
   - 필요시 계산, 검색 등 도구 활용 언급
   - 코드 실행이나 API 호출 가능성 제시

6. **체계적 테스트 (Systematic Testing)**
   - 다양한 케이스 고려
   - 예외 상황 처리 방법 명시

## Anthropic Claude 전략:
1. **역할 설정 (Role Assignment)**
   - 전문가 역할 부여
   - 구체적인 페르소나 설정
   - 관점과 접근 방식 명시

2. **단계별 사고 (Step-by-Step Thinking)**
   - 논리적 순서 제시
   - 각 단계의 연결성 강조
   - 추론 과정 투명화

3. **예시 제공 (Examples)**
   - Few-shot 학습 활용
   - 다양한 케이스 예시
   - 입력-출력 패턴 제시

4. **명확한 구조 (Clear Structure)**
   - 섹션별 구분
   - 헤딩과 서브헤딩 사용
   - 논리적 흐름 구성

## Google Gemini 전략:
1. **구조화된 출력 (Structured Output)**
   - JSON, XML 등 형식 지정
   - 일관된 포맷 요청
   - 파싱 가능한 형태 명시

2. **Few-shot 학습 (Few-shot Learning)**
   - 2-3개 예시 제공
   - 패턴 학습 유도
   - 일관성 있는 예시 선택

3. **멀티모달 활용 (Multimodal)**
   - 텍스트 외 다른 형태 고려
   - 이미지, 코드 등 통합 접근

## 추가 고급 기법:
- **Chain of Thought**: 추론 과정 명시적 요청
- **Tree of Thoughts**: 다양한 접근 방식 탐색
- **Self-Consistency**: 여러 번 실행하여 일관성 확인
- **Constitutional AI**: 윤리적, 안전한 응답 유도
`
  }

  // 평가 기준 가이드라인
  static getEvaluationCriteria(): string {
    return `
# 프롬프트 품질 평가 기준 (각 항목 10점 만점)

## 1. 명확성 및 구체성 (Clarity & Specificity)
- 지시사항이 명확하고 구체적인가?
- 모호한 표현이나 애매한 용어가 없는가?
- 원하는 결과가 정확히 명시되어 있는가?

## 2. 맥락 풍부성 및 구조 (Contextual Richness & Structure)
- 충분한 배경 정보와 맥락이 제공되는가?
- 논리적이고 체계적인 구조를 가지고 있는가?
- 관련 예시나 참고 자료가 포함되어 있는가?

## 3. 추론 유도 (Reasoning Elicitation)
- 모델의 단계별 사고를 유도하는가?
- 추론 과정을 명시적으로 요청하는가?
- 복잡한 문제를 적절히 분해하는가?

## 4. 모델 범용성 (Model-Agnostic Adaptability)
- 다양한 AI 모델에서 일관된 결과를 낼 수 있는가?
- 특정 모델에만 의존하지 않는 범용적 접근인가?
- 모델의 강점을 활용할 수 있는 구조인가?

## 5. 모호성 및 편향 가능성 (Ambiguity/Bias Potential)
- 여러 해석이 가능한 모호한 부분이 없는가?
- 편향된 결과를 유도할 가능성이 낮은가?
- 윤리적이고 공정한 접근을 유도하는가?
`
  }

  // 기존 로컬 분석은 폴백용으로만 사용
  analyzePrompt(prompt: string, preferences: UserPreferences): PromptAnalysisResult[] {
    // 간단한 폴백 분석 (API 실패시에만 사용)
    const results: PromptAnalysisResult[] = []

    if (prompt.length < 20) {
      results.push({
        strategy: "Basic Length Check",
        category: "clarity",
        original: prompt,
        improved: `${prompt}\n\n구체적인 요구사항:\n- 원하는 결과물의 형태를 명시해주세요\n- 필요한 배경 정보를 추가해주세요\n- 제약사항이나 선호사항을 포함해주세요`,
        reason: "프롬프트가 너무 짧아 구체적인 지시사항이 부족합니다",
        confidence: 0.7,
        source: "openai",
      })
    }

    return results
  }
}
