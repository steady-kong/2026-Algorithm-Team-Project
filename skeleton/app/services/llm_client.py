"""Upstage LLM 클라이언트 래퍼.

API 키가 비어있으면 :class:`NotConfiguredError` 를 발생시킨다. 폴백을 직접
만들지 않고 호출부(서비스 계층)에 위임하는 이유는, 서비스마다 적절한 규칙
기반 폴백이 다르기 때문이다(취향 파싱은 키워드 휴리스틱, 레시피는 공식 기반).
이 구조 덕분에 API 키 없이도 전체 파이프라인을 검증할 수 있다. 실제 키가
들어오면 Upstage chat completions 엔드포인트를 사용한다.
"""

from __future__ import annotations

import json
from typing import Any

import httpx

from app.config import settings


class LLMClient:
    def __init__(self) -> None:
        self.api_key = settings.upstage_api_key
        self.model = settings.upstage_model
        self.base_url = settings.upstage_base_url.rstrip("/")

    @property
    def is_configured(self) -> bool:
        return bool(self.api_key)

    async def chat_json(self, system: str, user: str) -> dict[str, Any]:
        """system + user 메시지를 보내고 JSON 객체를 받아 dict 로 파싱.

        키가 없으면 NotConfiguredError 를 발생시킨다. 호출부에서 fallback 을 결정한다.
        """
        if not self.is_configured:
            raise NotConfiguredError("UPSTAGE_API_KEY is not set")

        url = f"{self.base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.2,
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()

        try:
            content = data["choices"][0]["message"]["content"]
        except (KeyError, IndexError) as e:
            raise LLMResponseError(f"Unexpected LLM response shape: {data}") from e

        try:
            return json.loads(content)
        except json.JSONDecodeError as e:
            raise LLMResponseError(f"LLM returned non-JSON content: {content}") from e


class NotConfiguredError(RuntimeError):
    """Upstage API 키가 설정되지 않았을 때."""


class LLMResponseError(RuntimeError):
    """LLM 응답이 기대한 포맷이 아닐 때."""


llm_client = LLMClient()
