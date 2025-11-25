package routes

import (
	"kaskade_backend/auth"
	"kaskade_backend/controllers"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func SetupRoutes(r *gin.Engine, db *gorm.DB) {
	r.GET("/users", func(c *gin.Context) {
		controllers.GetUsers(c, db)
	})
	r.POST("/signup", func(c *gin.Context) {
		controllers.CreateUser(c, db)
	})
	r.POST("/login", func(c *gin.Context) {
		controllers.Login(c, db)
	}, auth.CreateJWT, func(c *gin.Context) {
		user, userExists := c.Get("user")
		if !userExists {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "user lost"})
			return
		}
		c.JSON(http.StatusOK, user)
	})
	r.PUT("/users/:username", auth.AuthRequired, func(c *gin.Context) {
		controllers.UpdateUser(c, db)
	})
	r.DELETE("/users/:username", auth.AuthRequired, func(c *gin.Context) {
		controllers.DeleteUser(c, db)
	})
	r.POST("/logout", controllers.Logout)
	r.POST("/benchmarkresult", func(c *gin.Context) {
		controllers.AddBenchmarkResult(c, db)
	})
	r.GET("/benchmarkresult", func(c *gin.Context) {
		controllers.GetBenchmarkResults(c, db)
	})
	r.GET("/benchmarkresult/:id", func(c *gin.Context) {
		controllers.GetBenchmarkResultByID(c, db)
	})
}
