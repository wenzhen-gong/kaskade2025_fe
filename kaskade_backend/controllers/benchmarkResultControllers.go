package controllers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"kaskade_backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type addBenchmarkResultRequest struct {
	SessionID string                 `json:"sessionId" binding:"required"`
	Version   string                 `json:"version" binding:"required"`
	Config    map[string]interface{} `json:"config" binding:"required"`
	Result    map[string]interface{} `json:"result" binding:"required"`
}

// extractSummaryMetrics extracts metrics from result and config JSON
func extractSummaryMetrics(resultJSON datatypes.JSON, configJSON datatypes.JSON) (successRatio, p50Latency, p95Latency, throughput float64) {
	var result map[string]interface{}
	var config map[string]interface{}

	if err := json.Unmarshal(resultJSON, &result); err != nil {
		return 0, 0, 0, 0
	}
	if err := json.Unmarshal(configJSON, &config); err != nil {
		return 0, 0, 0, 0
	}

	successRatio = -1
	p50Latency = -1
	p95Latency = -1
	throughput = -1

	// Calculate success ratio
	success, _ := result["success"].(float64)
	failures, _ := result["failures"].(float64)
	total := success + failures
	if total > 0 {
		successRatio = (success / total) * 100.0
	}

	// Extract percentile latencies
	if percentileTimeMs, ok := result["percentileTimeMs"].(map[string]interface{}); ok {
		// P50 latency
		if p50Val, ok := percentileTimeMs["50"]; ok {
			switch v := p50Val.(type) {
			case float64:
				p50Latency = v
			case int:
				p50Latency = float64(v)
			}
		}
		// P95 latency
		if p95Val, ok := percentileTimeMs["95"]; ok {
			switch v := p95Val.(type) {
			case float64:
				p95Latency = v
			case int:
				p95Latency = float64(v)
			}
		}
	}

	// Calculate throughput (requests per second)
	if testDuration, ok := config["testDuration"].(float64); ok && testDuration > 0 {
		throughput = total / testDuration
	}

	return successRatio, p50Latency, p95Latency, throughput
}

func AddBenchmarkResult(c *gin.Context, db *gorm.DB) {
	var req addBenchmarkResultRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	configBytes, err := json.Marshal(req.Config)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid config payload"})
		return
	}

	resultBytes, err := json.Marshal(req.Result)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid result payload"})
		return
	}

	// Calculate metrics before saving
	resultJSON := datatypes.JSON(resultBytes)
	configJSON := datatypes.JSON(configBytes)
	successRatio, p50Latency, p95Latency, throughput := extractSummaryMetrics(resultJSON, configJSON)

	record := models.BenchmarkResult{
		SessionID:    req.SessionID,
		Version:      req.Version,
		Config:       configJSON,
		Result:       resultJSON,
		SuccessRatio: successRatio,
		P50Latency:   p50Latency,
		P95Latency:   p95Latency,
		Throughput:   throughput,
	}

	if err := db.Create(&record).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save benchmark result"})
		return
	}

	summary := models.BenchmarkResultSummary{
		ID:           record.ID,
		Timestamp:    record.Timestamp,
		SessionID:    record.SessionID,
		Version:      record.Version,
		SuccessRatio: record.SuccessRatio,
		P50Latency:   record.P50Latency,
		P95Latency:   record.P95Latency,
		Throughput:   record.Throughput,
	}
	c.JSON(http.StatusCreated, summary)
}

func GetBenchmarkResults(c *gin.Context, db *gorm.DB) {
	query := db.Model(&models.BenchmarkResult{})

	// ID exact match
	if idStr := c.Query("id"); idStr != "" {
		if id, err := strconv.ParseUint(idStr, 10, 32); err == nil {
			query = query.Where("id = ?", id)
		}
	}

	// ID range query
	if idMinStr := c.Query("idMin"); idMinStr != "" {
		if idMin, err := strconv.ParseUint(idMinStr, 10, 32); err == nil {
			query = query.Where("id >= ?", idMin)
		}
	}
	if idMaxStr := c.Query("idMax"); idMaxStr != "" {
		if idMax, err := strconv.ParseUint(idMaxStr, 10, 32); err == nil {
			query = query.Where("id <= ?", idMax)
		}
	}

	// SessionID exact match (optional)
	if sessionID := c.Query("sessionId"); sessionID != "" {
		query = query.Where("session_id = ?", sessionID)
	}

	// Version exact match (optional)
	if version := c.Query("version"); version != "" {
		query = query.Where("version = ?", version)
	}

	// Timestamp range query (left-closed, right-open: [min, max))
	if timestampMinStr := c.Query("timestampMin"); timestampMinStr != "" {
		if timestampMin, err := time.Parse(time.RFC3339, timestampMinStr); err == nil {
			query = query.Where("timestamp >= ?", timestampMin)
		}
	}
	if timestampMaxStr := c.Query("timestampMax"); timestampMaxStr != "" {
		if timestampMax, err := time.Parse(time.RFC3339, timestampMaxStr); err == nil {
			query = query.Where("timestamp < ?", timestampMax)
		}
	}

	// Order by timestamp descending
	query = query.Order("timestamp DESC")

	// Limit query
	if limitStr := c.Query("limit"); limitStr != "" {
		if limit, err := strconv.Atoi(limitStr); err == nil && limit > 0 {
			query = query.Limit(limit)
		}
	}

	var results []models.BenchmarkResult
	if err := query.Find(&results).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to query benchmark results"})
		return
	}

	// Convert to summary format
	summaries := make([]models.BenchmarkResultSummary, len(results))
	for i, result := range results {
		summaries[i] = models.BenchmarkResultSummary{
			ID:           result.ID,
			Timestamp:    result.Timestamp,
			SessionID:    result.SessionID,
			Version:      result.Version,
			SuccessRatio: result.SuccessRatio,
			P50Latency:   result.P50Latency,
			P95Latency:   result.P95Latency,
			Throughput:   result.Throughput,
		}
	}

	c.JSON(http.StatusOK, summaries)
}

func GetBenchmarkResultByID(c *gin.Context, db *gorm.DB) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id parameter"})
		return
	}

	var result models.BenchmarkResult
	if err := db.First(&result, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "benchmark result not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to query benchmark result"})
		return
	}

	c.JSON(http.StatusOK, result)
}
