export async function onRequestPost(context) {
  try {
    const requestData = await context.request.json();
    const inputCode = requestData.code?.trim().toUpperCase();

    if (!inputCode) {
      return new Response(JSON.stringify({ valid: false, message: "코드를 입력해 주세요." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Cloudflare KV 바인딩 체크 (바인딩명: ATS_KV)
    const KV = context.env.ATS_KV;
    if (!KV) {
      // 로컬 개발 환경이거나 KV 바인딩이 아직 안 된 경우의 예외 복구 조항 (정적 코드 허용)
      const fallbackCodes = ["ATS-FALLBACK-99", "ATS-TEST-77"];
      if (fallbackCodes.includes(inputCode)) {
        return new Response(JSON.stringify({ valid: true, message: "인증에 성공했습니다. (로컬 테스트 모드)" }), {
          headers: { "Content-Type": "application/json" }
        });
      }
      return new Response(JSON.stringify({ 
        valid: false, 
        message: "현재 서버의 KV 데이터베이스 바인딩이 완료되지 않았습니다. Cloudflare 설정에서 ATS_KV 바인딩을 추가해 주세요." 
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    // KV에서 코드 상태 조회
    const codeStatus = await KV.get(inputCode);

    if (codeStatus === null) {
      return new Response(JSON.stringify({ valid: false, message: "존재하지 않거나 만료된 인증 코드입니다." }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (codeStatus === "used") {
      return new Response(JSON.stringify({ valid: false, message: "이미 사용이 완료된 1회용 인증 코드입니다." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (codeStatus === "unused") {
      // 코드를 즉시 '사용 완료(used)'로 변경하여 재사용 원천 차단
      await KV.put(inputCode, "used");
      return new Response(JSON.stringify({ valid: true, message: "인증에 성공했습니다! Pro 프리미엄 권한이 활성화되었습니다." }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ valid: false, message: "비정상적인 코드 상태입니다." }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
