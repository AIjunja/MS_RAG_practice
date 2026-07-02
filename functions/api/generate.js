export async function onRequestPost(context) {
  try {
    const requestData = await context.request.json();
    const secret = requestData.secret;

    // 관리자 난수 생성용 마스터 패스워드 (유출 방지)
    const MASTER_SECRET = "admin1234";

    if (secret !== MASTER_SECRET) {
      return new Response(JSON.stringify({ error: "접근 권한이 없습니다." }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }

    const KV = context.env.ATS_KV;
    if (!KV) {
      return new Response(JSON.stringify({ error: "서버 KV 데이터베이스가 연결되어 있지 않습니다." }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 1회용 무작위 코드 생성 (형식: ATS-XXXX-XXXX)
    const generateRandomCode = () => {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let part1 = "";
      let part2 = "";
      for (let i = 0; i < 4; i++) {
        part1 += chars.charAt(Math.floor(Math.random() * chars.length));
        part2 += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return `ATS-${part1}-${part2}`;
    };

    const newCode = generateRandomCode();

    // KV에 미사용 상태로 영구 저장
    await KV.put(newCode, "unused");

    return new Response(JSON.stringify({ 
      success: true, 
      code: newCode, 
      message: "새로운 1회용 라이선스 코드가 정상적으로 발급되었습니다. 복사해서 유저에게 지급하세요." 
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
