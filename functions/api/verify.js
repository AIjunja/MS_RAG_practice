export async function onRequestPost(context) {
  try {
    const requestData = await context.request.json();
    const inputCode = requestData.code;

    // 수익화 결제 완료자에게 지급할 비밀번호 목록
    // 필요 시 아래 배열에 여러 개의 패스코드를 등록할 수 있습니다.
    const validCodes = ["pass1234", "hyway2026", "ragpro99"];

    if (validCodes.includes(inputCode)) {
      return new Response(JSON.stringify({ valid: true, message: "인증에 성공했습니다. Pro 권한이 활성화됩니다!" }), {
        headers: { "Content-Type": "application/json" }
      });
    } else {
      return new Response(JSON.stringify({ valid: false, message: "올바르지 않은 인증 코드입니다." }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
