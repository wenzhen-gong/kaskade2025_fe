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

type Config struct {
	ServerURL   string            `json:"serverUrl"`
	Concurrency int               `json:"concurrencyNumber"`
	Count       int               `json:"totalRequests"`
	Method      string            `json:"httpMethod"`
	Payload     string            `json:"reqBody"`
	Headers     map[string]string `json:"finalHeaders"`
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

	for i := 0; i < config.Count; i++ {
		wg.Add(1)
		sem <- struct{}{}
		go func(index int) {
			defer func() { <-sem }()
			defer wg.Done()
			body := strings.NewReader(config.Payload)

			req, _ := http.NewRequest(config.Method, config.ServerURL, body)
			for k, v := range config.Headers {
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
