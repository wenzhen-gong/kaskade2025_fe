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

type RequestStats struct {
	RequestID        int             `json:"requestId"`
	RequestName      string          `json:"requestName"`
	AvgTimeMs        float64         `json:"avgTimeMs"`
	Success          int             `json:"success"`
	Failures         int             `json:"failures"`
	PercentileTimeMs map[int]float64 `json:"percentileTimeMs"`
}

type Result struct {
	// Session-level stats (all requests combined)
	AvgTimeMs        float64         `json:"avgTimeMs"`
	Success          int             `json:"success"`
	Failures         int             `json:"failures"`
	PercentileTimeMs map[int]float64 `json:"percentileTimeMs"`
	// Per-request stats
	RequestStats []RequestStats `json:"requestStats"`
}

func main() {
	var config Config
	decoder := json.NewDecoder(os.Stdin)

	if err := decoder.Decode(&config); err != nil {
		fmt.Fprintf(os.Stderr, "Failed to decode config: %v\n", err)
		os.Exit(1)
	}

	var wg sync.WaitGroup
	// Session-level stats: times for each goroutine (total duration of all requests)
	sessionTimes := make([]time.Duration, config.Count)
	sessionSuccess := 0
	sessionFailures := 0

	// Per-request stats: for each request, store times, success, failures
	requestTimes := make(map[int][]time.Duration) // requestId -> []duration
	requestSuccess := make(map[int]int)           // requestId -> count
	requestFailures := make(map[int]int)          // requestId -> count

	var mu sync.Mutex

	sem := make(chan struct{}, config.Concurrency)

	// Initialize per-request stats
	for _, req := range config.Requests {
		requestTimes[req.RequestID] = make([]time.Duration, 0, config.Count)
		requestSuccess[req.RequestID] = 0
		requestFailures[req.RequestID] = 0
	}

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

			// Execute all requests in sequence
			sessionStart := time.Now()
			sessionSucceeded := true

			for _, request := range config.Requests {
				// Build full URL with server URL and request URL
				// Params are already included in request.URL
				fullURL := strings.TrimSuffix(config.ServerURL, "/")
				if request.URL != "" {
					if !strings.HasPrefix(request.URL, "/") {
						fullURL += "/"
					}
					fullURL += request.URL
				}

				fmt.Fprintln(os.Stderr, "fullURL: ", fullURL)

				// Build request body
				body := strings.NewReader(request.ReqBody)

				// Build headers
				headers := buildHeaders(request.Headers, request.ContentType)

				// Create HTTP request
				req, _ := http.NewRequest(request.Method, fullURL, body)
				for k, v := range headers {
					req.Header.Set(k, v)
				}

				// Execute request and measure time
				requestStart := time.Now()
				resp, err := http.DefaultClient.Do(req)
				requestDuration := time.Since(requestStart)

				// Check if request succeeded
				requestSucceeded := err == nil && resp != nil && resp.StatusCode < 400

				// Read response body
				if requestSucceeded && resp.Body != nil {
					bodyBytes, _ := io.ReadAll(resp.Body)
					resp.Body.Close()
					bodyStr := string(bodyBytes)
					fmt.Fprintln(os.Stderr, bodyStr)
				}

				// Update per-request stats
				mu.Lock()
				requestTimes[request.RequestID] = append(requestTimes[request.RequestID], requestDuration)
				if requestSucceeded {
					requestSuccess[request.RequestID]++
				} else {
					requestFailures[request.RequestID]++
				}
				mu.Unlock()

				// If request failed, stop executing remaining requests in this session
				if !requestSucceeded {
					sessionSucceeded = false
					break
				}
			}

			// Record total session duration for this goroutine
			sessionDuration := time.Since(sessionStart)
			mu.Lock()
			sessionTimes[index] = sessionDuration
			if sessionSucceeded {
				sessionSuccess++
			} else {
				sessionFailures++
			}
			mu.Unlock()
		}(i)
	}

	wg.Wait()

	// Calculate session-level stats
	sort.Slice(sessionTimes, func(i, j int) bool {
		return sessionTimes[i] < sessionTimes[j]
	})

	sessionPercentileTimeMs := make(map[int]float64)
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
			sessionPercentileTimeMs[i] = float64(sessionTimes[index].Seconds()) * 1000.0
		}
	}

	var sessionTotal time.Duration
	for _, t := range sessionTimes {
		sessionTotal += t
	}
	sessionAvg := sessionTotal.Seconds() * 1000 / float64(config.Count)

	// Calculate per-request stats
	requestStatsList := make([]RequestStats, 0, len(config.Requests))
	for _, req := range config.Requests {
		times := requestTimes[req.RequestID]
		if len(times) == 0 {
			continue
		}

		// Sort times for percentile calculation
		sortedTimes := make([]time.Duration, len(times))
		copy(sortedTimes, times)
		sort.Slice(sortedTimes, func(i, j int) bool {
			return sortedTimes[i] < sortedTimes[j]
		})

		// Calculate percentiles for this request
		percentileTimeMs := make(map[int]float64)
		for i := 0; i <= 100; i++ {
			var index int
			if i == 100 {
				index = len(sortedTimes) - 1
			} else {
				index = int(float64(len(sortedTimes)) * float64(i) / 100.0)
				if index >= len(sortedTimes) {
					index = len(sortedTimes) - 1
				}
			}
			percentileTimeMs[i] = float64(sortedTimes[index].Seconds()) * 1000.0
		}

		// Calculate average
		var total time.Duration
		for _, t := range times {
			total += t
		}
		avg := total.Seconds() * 1000 / float64(len(times))

		requestStatsList = append(requestStatsList, RequestStats{
			RequestID:        req.RequestID,
			RequestName:      req.RequestName,
			AvgTimeMs:        avg,
			Success:          requestSuccess[req.RequestID],
			Failures:         requestFailures[req.RequestID],
			PercentileTimeMs: percentileTimeMs,
		})
	}

	result := Result{
		AvgTimeMs:        sessionAvg,
		Success:          sessionSuccess,
		Failures:         sessionFailures,
		PercentileTimeMs: sessionPercentileTimeMs,
		RequestStats:     requestStatsList,
	}
	json.NewEncoder(os.Stdout).Encode(result)
}
