// scripts/loadtester.go
package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"sort"
	"strings"
	"sync"
	"time"
)

type Request struct {
	RequestID   int      `json:"requestId"`
	RequestName string   `json:"requestName"`
	URL         string   `json:"url"`
	Method      string   `json:"method"`
	ReqBody     string   `json:"reqBody"`
	Headers     []Header `json:"headers"`
	ContentType string   `json:"contentType"`
}

type Header struct {
	Key   string `json:"key"`
	Value string `json:"value"`
}

type Config struct {
	ServerURL   string    `json:"serverUrl"`
	Concurrency int       `json:"concurrencyNumber"`
	Count       int       `json:"totalRequests"`
	Requests    []Request `json:"requests"`
}

type Result struct {
	AvgTimeMs        float64         `json:"avgTimeMs"`
	Success          int             `json:"success"`
	Failures         int             `json:"failures"`
	PercentileTimeMs map[int]float64 `json:"percentileTimeMs"`
}

func main() {
	var config Config
	decoder := json.NewDecoder(os.Stdin)

	if err := decoder.Decode(&config); err != nil {
		fmt.Fprintf(os.Stderr, "Failed to decode config: %v\n", err)
		os.Exit(1)
	}

	var wg sync.WaitGroup
	times := make([]time.Duration, config.Count)
	success := 0
	failures := 0
	var mu sync.Mutex

	sem := make(chan struct{}, config.Concurrency)

	// Build headers map from headers array and contentType
	buildHeaders := func(headers []Header, contentType string) map[string]string {
		headerMap := make(map[string]string)
		if contentType != "" {
			headerMap["Content-Type"] = contentType
		}
		for _, header := range headers {
			if header.Key != "" {
				headerMap[header.Key] = header.Value
			}
		}
		return headerMap
	}

	// Check if requests array is empty
	if len(config.Requests) == 0 {
		fmt.Fprintf(os.Stderr, "No requests found in config\n")
		os.Exit(1)
	}

	for i := 0; i < config.Count; i++ {
		wg.Add(1)
		sem <- struct{}{}
		go func(index int) {
			defer func() { <-sem }()
			defer wg.Done()

			// Select a request from the requests array (round-robin)
			requestIndex := index % len(config.Requests)
			request := config.Requests[requestIndex]

			// Build full URL with server URL and request URL
			// Params are already included in request.URL
			// Handle trailing/leading slashes properly:
			// - If serverUrl ends with / and request.URL starts with /, keep only one /
			// - If serverUrl doesn't end with / and request.URL doesn't start with /, add one /
			// - Otherwise, concatenate directly
			fullURL := config.ServerURL
			if request.URL != "" {
				serverEndsWithSlash := strings.HasSuffix(fullURL, "/")
				requestStartsWithSlash := strings.HasPrefix(request.URL, "/")

				if serverEndsWithSlash && requestStartsWithSlash {
					// Both have /, remove one from request.URL
					fullURL += request.URL[1:]
				} else if !serverEndsWithSlash && !requestStartsWithSlash {
					// Neither has /, add one
					fullURL += "/" + request.URL
				} else {
					// One has /, concatenate directly
					fullURL += request.URL
				}
			}

			// Build request body
			body := strings.NewReader(request.ReqBody)

			// Build headers
			headers := buildHeaders(request.Headers, request.ContentType)

			// Create HTTP request
			req, _ := http.NewRequest(request.Method, fullURL, body)
			for k, v := range headers {
				req.Header.Set(k, v)
			}

			start := time.Now()
			resp, err := http.DefaultClient.Do(req)
			duration := time.Since(start)

			mu.Lock()
			times[index] = duration
			if err == nil && resp.StatusCode < 400 {
				defer resp.Body.Close()
				bodyBytes, _ := io.ReadAll(resp.Body)
				bodyStr := string(bodyBytes)
				fmt.Fprintln(os.Stderr, bodyStr)
				success++
			} else {
				failures++
			}
			mu.Unlock()
		}(i)
	}

	wg.Wait()

	// 对times数组从小到大排序
	sort.Slice(times, func(i, j int) bool {
		return times[i] < times[j]
	})

	// 计算百分位数
	percentileTimeMs := make(map[int]float64)
	if config.Count > 0 {
		for i := 0; i <= 100; i++ {
			var index int
			if i == 100 {
				index = config.Count - 1 // p100 是最大值
			} else {
				index = int(float64(config.Count) * float64(i) / 100.0)
				if index >= config.Count {
					index = config.Count - 1
				}
			}
			percentileTimeMs[i] = float64(times[index].Seconds()) * 1000.0
		}
	}

	var total time.Duration
	for _, t := range times {
		total += t
	}

	avg := total.Seconds() * 1000 / float64(config.Count)
	result := Result{AvgTimeMs: avg, Success: success, Failures: failures, PercentileTimeMs: percentileTimeMs}
	json.NewEncoder(os.Stdout).Encode(result)
}
