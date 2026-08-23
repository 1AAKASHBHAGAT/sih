import time
import numpy as np
from concurrent.futures import ThreadPoolExecutor, as_completed
from fastapi.testclient import TestClient
from app.main import app, _ip_request_history

client = TestClient(app)

def reset_rate_limiter():
    """Clears sliding window rate limiter state for clean benchmarking."""
    _ip_request_history.clear()

def benchmark_endpoint_latency(endpoint_name: str, method: str, url: str, payload: dict = None, num_samples: int = 25, headers: dict = None):
    """Measures actual p50, p90, and p95 latencies for a given API endpoint under normal conditions."""
    reset_rate_limiter()
    latencies = []
    
    for _ in range(num_samples):
        reset_rate_limiter()
        start = time.perf_counter()
        if method.upper() == "GET":
            res = client.get(url, headers=headers)
        elif method.upper() == "POST":
            res = client.post(url, json=payload, headers=headers)
        elapsed_ms = (time.perf_counter() - start) * 1000.0
        if res.status_code in [200, 201]:
            latencies.append(elapsed_ms)

    if not latencies:
        print(f"\nLatency Benchmark [{endpoint_name}]: No successful samples.")
        return None

    p50 = np.percentile(latencies, 50)
    p90 = np.percentile(latencies, 90)
    p95 = np.percentile(latencies, 95)

    print(f"\nLatency Benchmark [{endpoint_name}] ({len(latencies)} samples):")
    print(f"  - p50: {p50:.2f} ms")
    print(f"  - p90: {p90:.2f} ms")
    print(f"  - p95: {p95:.2f} ms")
    
    return {"p50": p50, "p90": p90, "p95": p95}

def benchmark_concurrency_throughput(num_workers: int = 15, total_requests: int = 45):
    """Simulates concurrent requests to measure actual Requests/Sec (RPS) throughput and success rate."""
    reset_rate_limiter()
    start = time.perf_counter()
    successes = 0
    failures = 0

    def make_request(idx):
        try:
            res = client.get("/api/problems")
            if res.status_code == 200:
                return "SUCCESS"
            else:
                return "FAIL"
        except Exception:
            return "FAIL"

    with ThreadPoolExecutor(max_workers=num_workers) as executor:
        futures = [executor.submit(make_request, i) for i in range(total_requests)]
        for f in as_completed(futures):
            res_type = f.result()
            if res_type == "SUCCESS":
                successes += 1
            else:
                failures += 1

    total_time = time.perf_counter() - start
    rps = total_requests / total_time if total_time > 0 else 0

    print(f"\nConcurrency Benchmark ({total_requests} requests across {num_workers} worker threads):")
    print(f"  - Execution Time: {total_time:.3f} s")
    print(f"  - Throughput: {rps:.1f} req/sec (RPS)")
    print(f"  - Successful Responses (200 OK): {successes}/{total_requests}")
    print(f"  - Errors / Failures: {failures}")

    return {"total_time": total_time, "rps": rps, "successes": successes}

if __name__ == "__main__":
    print("==========================================================")
    print("SIH 26043 Real Performance Benchmark Audit Execution")
    print("==========================================================")
    
    # 1. API Latency Benchmarks
    benchmark_endpoint_latency("GET /api/problems", "GET", "/api/problems", num_samples=25)
    
    # Auth login for analytics
    reset_rate_limiter()
    step1_res = client.post("/api/auth/login-step1", json={"email": "gov@jharkhand.gov.in", "password": "gov123"})
    otp = step1_res.json()["dev_otp"]
    login_res = client.post("/api/auth/login-step2", json={"email": "gov@jharkhand.gov.in", "password": "gov123", "otp": otp})
    auth_headers = {"Authorization": f"Bearer {login_res.json()['access_token']}"}
    
    benchmark_endpoint_latency("GET /api/analytics/summary", "GET", "/api/analytics/summary", num_samples=25, headers=auth_headers)
    
    payload = {
        "title": "Performance Audit Water Quality Test in Chas",
        "description": "High turbidity and chemical contamination tested across Chas village deep tube wells.",
        "location": "Chas Village",
        "district": "Bokaro"
    }
    benchmark_endpoint_latency("POST /api/problems/submit (AI Engine)", "POST", "/api/problems/submit", payload=payload, num_samples=15)

    # 2. Concurrency Load Benchmark
    benchmark_concurrency_throughput(num_workers=15, total_requests=45)
    print("==========================================================")
