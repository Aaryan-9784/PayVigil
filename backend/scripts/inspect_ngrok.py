import httpx
import json
import base64

def main():
    r = httpx.get('http://127.0.0.1:4040/api/requests/http')
    reqs = r.json().get('requests', [])
    print(f"Total HTTP requests through ngrok: {len(reqs)}")
    for x in reqs[:6]:
        req_id = x['id']
        # Fetch detailed request
        det = httpx.get(f'http://127.0.0.1:4040/api/requests/http/{req_id}').json()
        raw_b64 = det['request'].get('raw', '')
        try:
            raw_text = base64.b64decode(raw_b64).decode('utf-8', errors='ignore')
            # Extract JSON from body (split header from body)
            if '\r\n\r\n' in raw_text:
                body = raw_text.split('\r\n\r\n', 1)[1]
                data = json.loads(body)
                print(f"Event: {data.get('event')} | ID: {data.get('payload',{}).get('payment',{}).get('entity',{}).get('id')} | Status Code: {det.get('response',{}).get('status_code')}")
        except Exception as e:
            print(f"Detail parse note: {e}")

if __name__ == "__main__":
    main()
