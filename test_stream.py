import asyncio
import json
import httpx

ENDPOINT_URL = "http://127.0.0.1:5433/api/v1/copilot/stream"

async def test_sse_stream():
    # Adjusted payload to match AIInferenceInternalContract
    payload = {
        "prompt": "What are the common issues users are reporting with authentication?",
        "correlation_id": "test-py-stream-001",
        "workspace_id": "ws-default-01",
        "top_k": 3
    }
    headers = {
        "Content-Type": "application/json",
        "X-Correlation-ID": "test-py-stream-001"
    }

    print("🚀 Connecting to SSE endpoint...\n")
    print("-" * 50)

    async with httpx.AsyncClient(timeout=60.0) as client:
        async with client.stream("POST", ENDPOINT_URL, json=payload, headers=headers) as response:
            if response.status_code != 200:
                print(f"❌ Handshake failed with status code {response.status_code}")
                # Print response details if 422 or other errors occur
                error_body = await response.aread()
                print(f"Response details: {error_body.decode()}")
                return

            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    data_str = line[6:].strip()
                    try:
                        data = json.loads(data_str)
                        msg_type = data.get("type")
                        content = data.get("content", "")

                        if msg_type == "content":
                            # Stream tokens in real-time
                            print(content, end="", flush=True)
                        elif msg_type == "status":
                            print(f"\n\n📌 Status: {content}")
                        elif msg_type == "error":
                            print(f"\n❌ Pipeline Error: {content}")
                    except json.JSONDecodeError:
                        print(f"\n[Raw Payload]: {data_str}")

    print("\n" + "-" * 50)
    print("\n✅ SSE stream closed successfully.")

if __name__ == "__main__":
    asyncio.run(test_sse_stream())